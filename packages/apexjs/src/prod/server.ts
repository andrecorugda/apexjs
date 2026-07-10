import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer as createHttpServer, type Server } from 'node:http'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ComponentRegistry } from '@apex-stack/kit'
import {
  type App,
  createApp,
  defineEventHandler,
  getRequestHeaders,
  getRequestURL,
  setResponseHeader,
  setResponseStatus,
  toNodeListener,
  toWebHandler,
} from 'h3'
import { createApiHandler, expandApiModule } from '../api/routes.js'
import type { AuthConfig } from '../auth/define.js'
import { getRequestUser } from '../auth/run.js'
import { toComponentEntry } from '../components/registry.js'
import { applyEnvToRuntimeConfig } from '../config/resolve.js'
import type { RuntimeConfig } from '../config/runtime.js'
import { type PageModule, renderPage } from '../dev/renderPage.js'
import { createI18n, resolveLocale } from '../i18n/index.js'
import { loadMessages } from '../i18n/run.js'
import { renderIslandsPage } from '../islands/render.js'
import { createMcpHandler, hasMcpRoutes } from '../mcp/server.js'
import type { Middleware } from '../middleware/define.js'
import { runMiddleware } from '../middleware/run.js'
import { matchRoute, type RouteDef } from '../routing/router.js'

/** The build manifest written by `apex build --server` to `<dist>/apex-manifest.json`. */
export interface ProdManifest {
  islands: boolean
  routes: Array<RouteDef & { serverFile: string; clientHref?: string; clientCss?: string[] }>
  components: Record<string, string>
  /** Layout modules (name → built server file) for page-wrapping layouts. */
  layouts?: Array<{ name: string; serverFile: string }>
  api: Array<{ name: string; serverFile: string }>
  /** Middleware modules in run order. */
  middleware?: Array<{ serverFile: string }>
  /** The auth resolver (server/auth.ts), if the app defined one. */
  auth?: { serverFile: string }
  /** i18n config (locales + default), if the app declared it. */
  i18n?: { defaultLocale: string; locales: string[] }
  /** runtimeConfig defaults baked at build; env is applied at server start. */
  runtimeConfig?: RuntimeConfig
  /** Client-side navigation enabled (default true). */
  clientNav?: boolean
  /** Pre-rendered `loading.alpine` HTML for the slow-nav boundary. */
  loadingHtml?: string
}

const MIME: Record<string, string> = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

export interface ProdServerOptions {
  dir: string
  port?: number
}

/**
 * Build the production h3 app from a `apex build --server` output dir — routes,
 * API + MCP, static assets; no Vite, no listen. Wrap with h3's `toNodeListener`
 * (or `createProdNodeHandler`) for a serverless target, or use `startProdServer`
 * to run it as a standalone Node server.
 */
export async function createProdApp(options: { dir: string }): Promise<App> {
  const dir = options.dir
  const manifest = JSON.parse(readFileSync(join(dir, 'apex-manifest.json'), 'utf8')) as ProdManifest

  // Apply deploy-time .env / process.env over the baked runtimeConfig defaults.
  // Load .env from the working directory (where the operator runs `apex start`,
  // i.e. the deploy root) — not from the build dir — matching where users keep it.
  const runtimeConfig = applyEnvToRuntimeConfig(
    manifest.runtimeConfig ?? { public: {} },
    process.cwd(),
  )
  const publicConfig = (runtimeConfig.public ?? {}) as Record<string, unknown>

  const importServer = (relFile: string) => import(pathToFileURL(join(dir, 'server', relFile)).href)

  // Build the component registry from the built component modules.
  const registry: ComponentRegistry = {}
  let componentCss = ''
  for (const [name, file] of Object.entries(manifest.components)) {
    const mod = await importServer(file)
    // Shared with the dev loader — keeps the server `loader` from being dropped.
    registry[name] = toComponentEntry(mod)
    if (mod.css) componentCss += `${mod.css}\n`
  }

  // Build the API entry table from the built API modules.
  const apiEntries = []
  for (const { name, serverFile } of manifest.api) {
    const mod = await importServer(serverFile)
    apiEntries.push(...expandApiModule(name, mod.default))
  }

  // Load middleware modules (in manifest order).
  const middleware: Middleware[] = []
  for (const { serverFile } of manifest.middleware ?? []) {
    const mod = await importServer(serverFile)
    if (typeof mod.default === 'function') middleware.push(mod.default)
  }

  // Load the auth resolver (server/auth.ts), if the app defined one.
  let auth: AuthConfig | undefined
  if (manifest.auth) {
    const mod = await importServer(manifest.auth.serverFile)
    if (mod.default && typeof mod.default.resolve === 'function') auth = mod.default
  }

  // i18n: message catalogs were copied to <dir>/locales by the build.
  const i18nCfg = manifest.i18n
  const messages = i18nCfg ? loadMessages(dir, i18nCfg.locales) : {}

  const serverFileFor = new Map(manifest.routes.map((r) => [r.pageId, r.serverFile]))
  // Layout modules are loaded by renderPage via `/layouts/<name>.alpine` ids.
  const layoutNames: string[] = []
  for (const l of manifest.layouts ?? []) {
    serverFileFor.set(`/layouts/${l.name}.alpine`, l.serverFile)
    layoutNames.push(l.name)
  }
  const errorPageId = serverFileFor.has('/pages/error.alpine') ? '/pages/error.alpine' : undefined
  const loadModule = (id: string) =>
    importServer(serverFileFor.get(id) as string) as Promise<PageModule>

  const app = createApp()

  // Static assets (client bundles + public files) under <dir>.
  app.use(
    defineEventHandler((event) => {
      if (event.method !== 'GET') return
      const path = decodeURIComponent(getRequestURL(event).pathname)
      if (path === '/' || path.startsWith('/api') || path === '/mcp') return
      const file = join(dir, path)
      if (!file.startsWith(dir) || !existsSync(file) || !statSync(file).isFile()) return
      const ext = path.slice(path.lastIndexOf('.'))
      setResponseHeader(event, 'Content-Type', MIME[ext] ?? 'application/octet-stream')
      if (path.startsWith('/assets/'))
        setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
      return readFileSync(file)
    }),
  )

  // Resolve the request user (defineAuth) + run middleware, before API + page
  // handlers (after static assets). Seeds `locals.user`; a redirect short-circuits.
  // Always runs so the user is resolved even with no middleware. Auth is *also*
  // enforced inside the API/MCP handlers (the real gate).
  app.use(
    defineEventHandler(async (event) => {
      const user = await getRequestUser(event, auth, runtimeConfig)
      const seed: Record<string, unknown> = user ? { user } : {}
      if (i18nCfg) {
        const headers = getRequestHeaders(event) as Record<string, string>
        const { locale, path } = resolveLocale({
          path: getRequestURL(event).pathname,
          acceptLanguage: headers['accept-language'],
          locales: i18nCfg.locales,
          defaultLocale: i18nCfg.defaultLocale,
        })
        event.context.apexLocale = locale
        event.context.apexPath = path
        seed.locale = locale
        seed.t = createI18n({ messages, locale, defaultLocale: i18nCfg.defaultLocale }).t
      }
      if (!middleware.length) {
        event.context.apexLocals = seed
        return
      }
      const { redirect, locals } = await runMiddleware(middleware, {
        url: getRequestURL(event).pathname,
        method: event.method,
        config: runtimeConfig,
        headers: getRequestHeaders(event) as Record<string, string>,
        locals: seed,
      })
      event.context.apexLocals = locals
      if (redirect) {
        setResponseStatus(event, redirect.status)
        setResponseHeader(event, 'Location', redirect.to)
        return ''
      }
    }),
  )

  if (apiEntries.length) app.use('/api', createApiHandler(apiEntries, runtimeConfig, auth))
  if (hasMcpRoutes(apiEntries)) app.use('/mcp', createMcpHandler(apiEntries, runtimeConfig, auth))

  app.use(
    defineEventHandler(async (event) => {
      // Route on the locale-stripped path when i18n is on (/fr/about → /about).
      const url = (event.context.apexPath as string) || getRequestURL(event).pathname
      const locale = event.context.apexLocale as string | undefined
      const matched = matchRoute(manifest.routes, url)
      if (!matched) {
        setResponseStatus(event, 404)
        setResponseHeader(event, 'Content-Type', 'text/html')
        return `<!DOCTYPE html><h1>404 — ${url}</h1>`
      }
      const route = manifest.routes.find((r) => r.pageId === matched.pageId)
      const render = manifest.islands ? renderIslandsPage : renderPage
      const html = await render({
        loadModule,
        pageId: matched.pageId,
        params: matched.params,
        url,
        registry,
        componentCss,
        clientHref: route?.clientHref,
        clientCss: route?.clientCss,
        layouts: layoutNames,
        runtimeConfig,
        publicConfig,
        clientNav: manifest.clientNav !== false,
        loadingHtml: manifest.loadingHtml,
        locale,
        locals: (event.context.apexLocals as Record<string, unknown>) ?? {},
        errorPageId,
      })
      setResponseHeader(event, 'Content-Type', 'text/html')
      return html
    }),
  )

  return app
}

/** A Node request handler `(req, res) => void` for the built app — for serverless
 * targets (Vercel, etc.). */
export async function createProdNodeHandler(options: { dir: string }) {
  return toNodeListener(await createProdApp(options))
}

/** A Web fetch handler `(Request) => Promise<Response>` for the built app — for
 * fetch-style serverless targets (Netlify Functions v2, edge runtimes, etc.). */
export async function createProdWebHandler(options: { dir: string }) {
  return toWebHandler(await createProdApp(options))
}

/** Run the built app as a standalone Node HTTP server (used by `apex start`). */
export async function startProdServer(
  options: ProdServerOptions,
): Promise<{ server: Server; port: number }> {
  const port = options.port ?? 3000
  const app = await createProdApp({ dir: options.dir })
  const server = createHttpServer(toNodeListener(app))
  await new Promise<void>((resolve) => server.listen(port, resolve))
  return { server, port }
}
