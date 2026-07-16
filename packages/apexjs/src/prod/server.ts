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
import type { PwaConfig, RuntimeConfig } from '../config/runtime.js'
import { type PageModule, renderPage } from '../dev/renderPage.js'
import type { ApexServerHooks, ErrorContext, RequestLogEntry } from '../hooks/define.js'
import { createI18n, resolveLocale } from '../i18n/index.js'
import { loadMessages } from '../i18n/run.js'
import { renderIslandsPage } from '../islands/render.js'
import { createMcpHandler, hasMcpRoutes } from '../mcp/server.js'
import type { Middleware } from '../middleware/define.js'
import { runMiddleware } from '../middleware/run.js'
import { matchRoute, type RouteDef } from '../routing/router.js'
import { resolveSecurityConfig } from '../security/config.js'
import type { KvStore } from '../security/kvStore.js'
import {
  corsHandler,
  escapeHtml,
  rateLimitHandler,
  requestIdHandler,
  safeDecode,
  securityHeadersHandler,
} from '../security/middleware.js'
import { gracefulShutdown, onShutdown } from './shutdown.js'

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
  /** PWA config baked at build — the runtime SSR shell links the manifest + worker. */
  pwa?: PwaConfig
  /** Observability hooks module (server/hooks.ts), if the app defined one. */
  hooks?: { serverFile: string }
}

const MIME: Record<string, string> = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

export interface ProdServerOptions {
  dir: string
  port?: number
  /** Emit one JSON log line per request (default true for `apex start`; APEX_LOG=off silences). */
  requestLog?: boolean
}

/**
 * Build the production h3 app from a `apex build --server` output dir — routes,
 * API + MCP, static assets; no Vite, no listen. Wrap with h3's `toNodeListener`
 * (or `createProdNodeHandler`) for a serverless target, or use `startProdServer`
 * to run it as a standalone Node server.
 */
export async function createProdApp(options: {
  dir: string
  /**
   * Override how built server modules are loaded. Defaults to dynamic `import()` of the
   * file on disk. On runtimes without a filesystem module loader (mobile/embedded engines),
   * pass a static registry: `(relFile) => Promise.resolve(registry[relFile])`. The mobile seam.
   */
  loadModule?: (relFile: string) => Promise<Record<string, unknown>>
  /**
   * Shared KV store for API idempotency (`Idempotency-Key` de-duplication) across
   * instances — e.g. Redis-backed. Default: in-memory (correct for a single process).
   */
  idempotencyStore?: KvStore
  /**
   * Shared KV store backing the `/api` + `/mcp` rate limiter — pass one (Redis, Cloudflare KV,
   * …) for a GLOBAL counter across instances. Default: in-memory per-process (a warning is
   * logged at boot, since that under-counts behind a load balancer / on serverless).
   */
  rateLimitStore?: KvStore
  /**
   * Emit one JSON line per request (`{time, method, path, status, ms}`) to stdout.
   * Default false — `apex start` turns it on; serverless embedders opt in.
   */
  requestLog?: boolean
  /** Programmatic observability hooks — merged OVER the app's server/hooks.ts exports. */
  hooks?: ApexServerHooks
}): Promise<App> {
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

  // Resolve the server-hardening knobs (headers/CSP/HSTS, rate limit, CORS, body cap, timeouts).
  const security = resolveSecurityConfig(runtimeConfig.security)
  const isProd = process.env.NODE_ENV === 'production'

  const importServer =
    options.loadModule ??
    ((relFile: string) => import(pathToFileURL(join(dir, 'server', relFile)).href))

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

  // Observability hooks (server/hooks.ts) + programmatic overrides (#25).
  let fileHooks: ApexServerHooks = {}
  if (manifest.hooks) {
    const mod = await importServer(manifest.hooks.serverFile)
    fileHooks = (mod.default ?? mod) as ApexServerHooks
  }
  const hooks: ApexServerHooks = { ...fileHooks, ...options.hooks }
  if (hooks.onShutdown) onShutdown(hooks.onShutdown)
  // ErrorContext + a per-request id (echoed as `x-request-id`) — additive; hook consumers that
  // want it read `ctx.requestId` (present at runtime; the base type stays source-compatible).
  const reportError = (error: unknown, ctx: ErrorContext & { requestId?: string }) => {
    if (hooks.onError) hooks.onError(error, ctx)
    else
      console.error(
        `[apex] ${ctx.kind}${ctx.path ? ` ${ctx.path}` : ''}${ctx.requestId ? ` [${ctx.requestId}]` : ''} error:`,
        error,
      )
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

  const app = createApp({
    // Route h3-boundary errors (anything not caught below) to the hooks. h3's default
    // response is already stack-free; this adds the server-side reporting.
    onError: (error, event) => {
      reportError(error, {
        kind: 'http',
        path: event.path,
        method: event.method,
        requestId: event.context.apexRequestId as string | undefined,
      })
    },
  })

  // Per-request id + security headers run FIRST, so every response — health, static, API,
  // pages, errors — carries `x-request-id` and the hardening headers (opt-out via config).
  if (security.enabled) {
    app.use(requestIdHandler())
    if (security.headers.enabled) app.use(securityHeadersHandler(security, isProd))
    if (security.cors.enabled) app.use(corsHandler(security))
    if (security.rateLimit.enabled) {
      if (!options.rateLimitStore) {
        console.warn(
          '[apex] rate limiter is using the in-memory single-process store — counters are ' +
            'NOT shared across instances (under-counts behind a load balancer / on serverless). ' +
            'Pass `rateLimitStore` (Redis/KV) for a global limit.',
        )
      }
      app.use(rateLimitHandler(security, options.rateLimitStore))
    }
  }

  // Liveness probe — first, before static/auth/middleware (must never touch DB or auth).
  // Liveness only (no readiness/DB ping); an app page at /health is shadowed (exact match).
  app.use(
    defineEventHandler((event) => {
      const path = getRequestURL(event).pathname
      if (event.method === 'GET' && (path === '/health' || path === '/healthz')) {
        setResponseHeader(event, 'Content-Type', 'application/json')
        return JSON.stringify({ status: 'ok', uptime: process.uptime() })
      }
    }),
  )

  // Request log: one JSON line per completed request (skips the health probes' noise).
  // hooks.onRequest replaces the default stdout line.
  if (options.requestLog || hooks.onRequest) {
    app.use(
      defineEventHandler((event) => {
        const res = event.node?.res
        if (!res) return // toWebHandler/mobile mode — no Node response to observe
        const path = getRequestURL(event).pathname
        if (path === '/health' || path === '/healthz') return
        const startedAt = Date.now()
        res.on('finish', () => {
          const entry: RequestLogEntry & { requestId?: string } = {
            time: new Date().toISOString(),
            method: event.method,
            path,
            status: res.statusCode,
            ms: Date.now() - startedAt,
            requestId: event.context.apexRequestId as string | undefined,
          }
          if (hooks.onRequest) hooks.onRequest(entry)
          else process.stdout.write(`${JSON.stringify(entry)}\n`)
        })
      }),
    )
  }

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
      // The service worker must revalidate on every load so a new deploy's precache
      // list (and cache name) propagates — never let it be cached long-term.
      if (path === '/sw.js') setResponseHeader(event, 'Cache-Control', 'no-cache')
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

  if (apiEntries.length)
    app.use(
      '/api',
      createApiHandler(apiEntries, runtimeConfig, auth, {
        // Production default: clients get a generic 500; the detail goes to the hooks.
        exposeErrors: false,
        onError: reportError,
        bodyLimitBytes: security.bodyLimitBytes,
        ...(options.idempotencyStore ? { idempotency: { store: options.idempotencyStore } } : {}),
      }),
    )
  if (hasMcpRoutes(apiEntries))
    app.use(
      '/mcp',
      createMcpHandler(apiEntries, runtimeConfig, auth, {
        exposeErrors: false,
        onError: reportError,
        bodyLimitBytes: security.bodyLimitBytes,
      }),
    )

  app.use(
    defineEventHandler(async (event) => {
      // Route on the locale-stripped path when i18n is on (/fr/about → /about).
      const url = (event.context.apexPath as string) || getRequestURL(event).pathname
      const locale = event.context.apexLocale as string | undefined
      const matched = matchRoute(manifest.routes, url)
      if (!matched) {
        setResponseStatus(event, 404)
        setResponseHeader(event, 'Content-Type', 'text/html')
        setResponseHeader(event, 'Cache-Control', 'no-store')
        // HTML-escape the reflected path — a raw echo is a reflected-XSS sink.
        return `<!DOCTYPE html><h1>404 — ${escapeHtml(safeDecode(url))}</h1>`
      }
      const route = manifest.routes.find((r) => r.pageId === matched.pageId)
      const render = manifest.islands ? renderIslandsPage : renderPage
      let html: string
      try {
        html = await render({
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
          pwa: manifest.pwa,
          locale,
          locals: (event.context.apexLocals as Record<string, unknown>) ?? {},
          errorPageId,
        })
      } catch (err) {
        // Report the real failure (Sentry hook); the h3 boundary then answers safely
        // (its production body carries no message or stack).
        reportError(err, {
          kind: 'page',
          path: url,
          method: event.method,
          requestId: event.context.apexRequestId as string | undefined,
        })
        throw err
      }
      setResponseHeader(event, 'Content-Type', 'text/html')
      // SSR pages embed per-request/session data (loader output, locals) — never let a browser
      // serve a stale cached document (else edits look un-saved until a hard refresh). Static
      // builds are served as files (with their own caching) and don't hit this path.
      setResponseHeader(event, 'Cache-Control', 'no-store')
      return html
    }),
  )

  return app
}

/** Options shared by the prod handlers. `loadModule` is the mobile/embedded seam — see
 * {@link createProdApp}. */
export type ProdHandlerOptions = Parameters<typeof createProdApp>[0]

/** A Node request handler `(req, res) => void` for the built app — for serverless
 * targets (Vercel, etc.). */
export async function createProdNodeHandler(options: ProdHandlerOptions) {
  return toNodeListener(await createProdApp(options))
}

/** A Web fetch handler `(Request) => Promise<Response>` for the built app — for
 * fetch-style serverless targets (Netlify Functions v2, edge runtimes) and embedded/mobile
 * engines (pass `loadModule` with a static module registry — no filesystem import needed). */
export async function createProdWebHandler(options: ProdHandlerOptions) {
  return toWebHandler(await createProdApp(options))
}

/** Run the built app as a standalone Node HTTP server (used by `apex start`). */
export async function startProdServer(
  options: ProdServerOptions,
): Promise<{ server: Server; port: number; close: () => Promise<void> }> {
  const port = options.port ?? 3000
  const app = await createProdApp({ dir: options.dir, requestLog: options.requestLog ?? true })
  const server = createHttpServer(toNodeListener(app))

  // Server-level timeouts + connection caps (Slowloris / socket-exhaustion guards). Read the
  // same resolved security config the app used (from the baked manifest + deploy-time env).
  const manifest = JSON.parse(
    readFileSync(join(options.dir, 'apex-manifest.json'), 'utf8'),
  ) as ProdManifest
  const runtimeConfig = applyEnvToRuntimeConfig(
    manifest.runtimeConfig ?? { public: {} },
    process.cwd(),
  )
  const security = resolveSecurityConfig(runtimeConfig.security)
  server.requestTimeout = security.requestTimeoutMs
  server.headersTimeout = security.headersTimeoutMs
  server.keepAliveTimeout = security.keepAliveTimeoutMs
  if (security.maxConnections > 0) server.maxConnections = security.maxConnections

  await new Promise<void>((resolve) => server.listen(port, resolve))
  // `close` drains in-flight requests, then runs shutdown hooks (DB pools close there).
  return { server, port, close: () => gracefulShutdown(server) }
}
