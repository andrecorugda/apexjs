import { existsSync, readFileSync, statSync } from 'node:fs'
import { type Server, createServer as createHttpServer } from 'node:http'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ComponentRegistry } from '@apex-stack/kit'
import {
  createApp,
  defineEventHandler,
  getRequestHeaders,
  getRequestURL,
  setResponseHeader,
  setResponseStatus,
  toNodeListener,
} from 'h3'
import { createApiHandler, expandApiModule } from '../api/routes.js'
import { applyEnvToRuntimeConfig } from '../config/resolve.js'
import type { RuntimeConfig } from '../config/runtime.js'
import { type PageModule, renderPage } from '../dev/renderPage.js'
import { renderIslandsPage } from '../islands/render.js'
import { createMcpHandler, hasMcpRoutes } from '../mcp/server.js'
import type { Middleware } from '../middleware/define.js'
import { runMiddleware } from '../middleware/run.js'
import { type RouteDef, matchRoute } from '../routing/router.js'

/** The build manifest written by `apex build --server` to `<dist>/apex-manifest.json`. */
export interface ProdManifest {
  islands: boolean
  routes: Array<RouteDef & { serverFile: string; clientHref?: string }>
  components: Record<string, string>
  api: Array<{ name: string; serverFile: string }>
  /** Middleware modules in run order. */
  middleware?: Array<{ serverFile: string }>
  /** runtimeConfig defaults baked at build; env is applied at server start. */
  runtimeConfig?: RuntimeConfig
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

/** Run the built app: dynamic routes, API + MCP, and static assets — no Vite. */
export async function startProdServer(
  options: ProdServerOptions,
): Promise<{ server: Server; port: number }> {
  const dir = options.dir
  const port = options.port ?? 3000
  const manifest = JSON.parse(readFileSync(join(dir, 'apex-manifest.json'), 'utf8')) as ProdManifest

  // Apply deploy-time .env / process.env over the baked runtimeConfig defaults.
  const runtimeConfig = applyEnvToRuntimeConfig(manifest.runtimeConfig ?? { public: {} }, dir)
  const publicConfig = (runtimeConfig.public ?? {}) as Record<string, unknown>

  const importServer = (relFile: string) => import(pathToFileURL(join(dir, 'server', relFile)).href)

  // Build the component registry from the built component modules.
  const registry: ComponentRegistry = {}
  let componentCss = ''
  for (const [name, file] of Object.entries(manifest.components)) {
    const mod = await importServer(file)
    registry[name] = { template: mod.template, rootXData: mod.rootXData, scopeId: mod.scopeId }
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

  const serverFileFor = new Map(manifest.routes.map((r) => [r.pageId, r.serverFile]))
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

  // Run middleware before API + page handlers (after static assets, which the
  // handler above already served). Sets locals; a redirect short-circuits.
  if (middleware.length) {
    app.use(
      defineEventHandler(async (event) => {
        const { redirect, locals } = await runMiddleware(middleware, {
          url: getRequestURL(event).pathname,
          method: event.method,
          config: runtimeConfig,
          headers: getRequestHeaders(event) as Record<string, string>,
        })
        event.context.apexLocals = locals
        if (redirect) {
          setResponseStatus(event, redirect.status)
          setResponseHeader(event, 'Location', redirect.to)
          return ''
        }
      }),
    )
  }

  if (apiEntries.length) app.use('/api', createApiHandler(apiEntries, runtimeConfig))
  if (hasMcpRoutes(apiEntries)) app.use('/mcp', createMcpHandler(apiEntries, runtimeConfig))

  app.use(
    defineEventHandler(async (event) => {
      const url = getRequestURL(event).pathname
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
        runtimeConfig,
        publicConfig,
        locals: (event.context.apexLocals as Record<string, unknown>) ?? {},
      })
      setResponseHeader(event, 'Content-Type', 'text/html')
      return html
    }),
  )

  const server = createHttpServer(toNodeListener(app))
  await new Promise<void>((resolve) => server.listen(port, resolve))
  return { server, port }
}
