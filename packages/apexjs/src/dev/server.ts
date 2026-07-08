import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createServer as createHttpServer, type Server } from 'node:http'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { renderFragment } from '@apex-stack/kit'
import { apex } from '@apex-stack/vite'
import {
  createApp,
  defineEventHandler,
  fromNodeMiddleware,
  getQuery,
  getRequestHeaders,
  setResponseHeader,
  setResponseStatus,
  toNodeListener,
} from 'h3'
import { createServer as createViteServer, type PluginOption, type ViteDevServer } from 'vite'
import { createApiHandler, loadApiRoutes } from '../api/routes.js'
import { getRequestUser, loadAuth } from '../auth/run.js'
import { loadComponents } from '../components/registry.js'
import { resolveApexConfig } from '../config/resolve.js'
import { renderIslandsPage } from '../islands/render.js'
import { createMcpHandler } from '../mcp/server.js'
import { loadMiddleware, runMiddleware } from '../middleware/run.js'
import { matchRoute, scanPages } from '../routing/router.js'
import { loadStores } from '../stores/loader.js'
import { openInEditor } from '../vscode.js'
import { renderErrorPage, renderNoProjectPage, renderNotFoundPage } from './errorPage.js'
import { type PageModule, renderPage } from './renderPage.js'

export interface DevServerOptions {
  root: string
  port?: number
  /** Page module rendered for every route in the spike (single-route). */
  pageId?: string
  /** Render in islands mode (static-first, per-island hydration) instead of one page component. */
  islands?: boolean
}

export interface DevServer {
  vite: ViteDevServer
  server: Server
  port: number
  close: () => Promise<void>
}

/**
 * Start the Apex dev server: Vite in middleware mode (build/HMR/asset serving)
 * fronted by an h3 app whose catch-all handler SSRs the page. Written as h3
 * event handlers so the render path can migrate to Nitro unchanged.
 */
export async function startDevServer(options: DevServerOptions): Promise<DevServer> {
  const port = options.port ?? 3000
  const pageId = options.pageId ?? '/pages/index.alpine'

  // Resolve the runtime deps from THIS package (core), so a globally-installed
  // `apex` works even when the project's node_modules is missing alpinejs /
  // @apex-stack/*. Aliases point Vite at core's own copies; fs.allow is relaxed
  // so those out-of-root files can be served in dev.
  const req = createRequire(import.meta.url)
  const tryResolve = (spec: string): string | undefined => {
    try {
      return req.resolve(spec)
    } catch {
      return undefined
    }
  }
  const alpine = tryResolve('alpinejs')
  const kit = tryResolve('@apex-stack/kit')
  const coreClient = fileURLToPath(new URL('./client.js', import.meta.url))
  const coreSelf = fileURLToPath(new URL('./index.js', import.meta.url))
  // Order matters: the subpath alias must precede the bare package alias.
  const alias: Record<string, string> = {
    '@apex-stack/core/client': coreClient,
    '@apex-stack/core': coreSelf,
  }
  if (alpine) alias.alpinejs = alpine
  if (kit) alias['@apex-stack/kit'] = kit

  // Optional Tailwind — auto-load @tailwindcss/vite if the project installed it.
  const plugins: PluginOption[] = [
    apex({ clientRuntime: '@apex-stack/core/client', fullReloadOnly: options.islands }),
  ]
  let hasTailwind = false
  try {
    const reqProj = createRequire(join(options.root, 'package.json'))
    const twMod = await import(pathToFileURL(reqProj.resolve('@tailwindcss/vite')).href)
    const tw = (twMod.default ?? twMod) as () => PluginOption
    plugins.unshift(tw())
    hasTailwind = true
  } catch {
    // Tailwind not installed — fine, it's opt-in.
  }

  // A project global stylesheet (Tailwind entry + shared styles), Vite-processed.
  const appCssRel = ['app.css', 'styles/app.css', 'src/app.css'].find((p) =>
    existsSync(join(options.root, p)),
  )
  let appCss = appCssRel ? `/${appCssRel}` : undefined
  // If the stylesheet imports Tailwind but it isn't installed, skip it (and warn)
  // rather than letting Vite/postcss crash with a cryptic "ENOENT … tailwindcss".
  if (appCssRel && !hasTailwind) {
    const css = readFileSync(join(options.root, appCssRel), 'utf8')
    if (/@import\s+['"]tailwindcss['"]|@tailwind\b/.test(css)) {
      console.warn(
        `\n  ⚠ ${appCssRel} imports Tailwind, but it isn't installed — skipping it (styles won't apply).\n    Fix: npm i -D tailwindcss @tailwindcss/vite\n`,
      )
      appCss = undefined
    }
  }

  const vite = await createViteServer({
    root: options.root,
    appType: 'custom',
    // Derive the HMR port from the dev port so multiple `apex dev` instances
    // don't all fight over Vite's default 24678.
    server: { middlewareMode: true, fs: { strict: false }, hmr: { port: port + 1 } },
    resolve: { alias },
    // User apps depend on `@apex-stack/core`, so the client module imports the runtime
    // from `@apex-stack/core/client` (a re-export) rather than the internal kit package.
    plugins,
    optimizeDeps: { include: ['alpinejs'] },
  })

  // Vite's ssrLoadModule needs project files as absolute paths — a bare
  // root-relative "/pages/x" is misread as drive-root ("C:\pages\x") on Windows,
  // so it "doesn't exist". Normalize project ids (anything starting with "/" not
  // already under root) to an absolute forward-slash path; identical on POSIX + Windows.
  const ssrLoad = (id: string): Promise<Record<string, unknown>> => {
    const resolved =
      id[0] === '/' && !id.startsWith(options.root)
        ? join(options.root, id).replace(/\\/g, '/')
        : id
    return vite.ssrLoadModule(resolved) as Promise<Record<string, unknown>>
  }

  // Resolve apex.config.ts + .env once at boot. Editing config or .env needs a
  // dev-server restart (like Nuxt) — routes/pages still hot-reload per request.
  const { config, runtimeConfig, publicConfig } = await resolveApexConfig(
    options.root,
    (id) => ssrLoad(id) as never,
  )
  const clientNav = config.clientNav !== false

  const app = createApp()

  // Vite handles assets, HMR client, and .alpine module requests. When it has
  // nothing to serve it calls next() and the request falls through to the
  // API / MCP / SSR handlers below.
  app.use(fromNodeMiddleware(vite.middlewares))

  // Auth + middleware, before API + page handlers. Both are loaded per request so
  // edits apply without a restart. First resolve the request's user (defineAuth),
  // seed it into `locals.user`, then run middleware/*.ts. Sets
  // `event.context.apexLocals` for downstream loaders/handlers; a redirect
  // short-circuits. Auth is *also* enforced inside the API/MCP handlers (the real
  // gate) — this step just resolves identity + feeds pages.
  const loadAuthCfg = () => loadAuth(options.root, (id) => ssrLoad(id) as never)
  app.use(
    defineEventHandler(async (event) => {
      const user = await getRequestUser(event, await loadAuthCfg(), runtimeConfig)
      const seed: Record<string, unknown> = user ? { user } : {}
      const mws = await loadMiddleware(options.root, (id) => ssrLoad(id) as never)
      if (!mws.length) {
        event.context.apexLocals = seed
        return
      }
      const { redirect, locals } = await runMiddleware(mws, {
        url: event.path || '/',
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

  // Load server/api/*.ts routes (single routes + resources) per request in dev, so
  // editing a route or resource takes effect without a restart — Vite invalidates the
  // module on change, so ssrLoadModule returns fresh code. A `/api` handler validates
  // and dispatches them; `/mcp` exposes every `mcp: true` entry as an AI-callable tool.
  const loadEntries = () => loadApiRoutes(options.root, (id) => ssrLoad(id) as never)
  app.use(
    '/api',
    defineEventHandler(async (event) =>
      createApiHandler(await loadEntries(), runtimeConfig, await loadAuthCfg())(event),
    ),
  )
  app.use(
    '/mcp',
    defineEventHandler(async (event) =>
      createMcpHandler(await loadEntries(), runtimeConfig, await loadAuthCfg())(event),
    ),
  )

  // Dev-only: open a source file in the user's editor (from the error page's
  // "open in editor" links). Only files inside the project root are allowed.
  app.use(
    '/__apex_open',
    defineEventHandler((event) => {
      const q = getQuery(event)
      const file = String(q.file ?? '')
      const resolved = resolve(file)
      if (!file || !resolved.startsWith(options.root)) {
        setResponseStatus(event, 400)
        return { ok: false }
      }
      const ok = openInEditor(resolved, Number(q.line) || 1, Number(q.col) || 1)
      setResponseStatus(event, ok ? 200 : 500)
      return { ok }
    }),
  )

  app.use(
    defineEventHandler(async (event) => {
      const url = event.path || '/'
      try {
        // Re-scan per request so newly added pages are picked up without a restart.
        const routes = scanPages(options.root)
        const matched = routes.length ? matchRoute(routes, url) : { pageId, params: {} }
        if (!matched) {
          setResponseStatus(event, 404)
          setResponseHeader(event, 'Content-Type', 'text/html')
          return await vite.transformIndexHtml(url, renderNotFoundPage(url, routes))
        }
        // No pages/ at all (or the default page is missing) → the command was
        // likely run outside an app. Show a clear, actionable page rather than a
        // cryptic "Failed to load url …/pages/index.alpine" from Vite.
        if (!existsSync(join(options.root, matched.pageId))) {
          setResponseStatus(event, 404)
          setResponseHeader(event, 'Content-Type', 'text/html')
          return await vite.transformIndexHtml(url, renderNoProjectPage(options.root))
        }

        const {
          registry,
          css: componentCss,
          cssBlocks: componentCssBlocks,
        } = await loadComponents(options.root, (id) => ssrLoad(id) as never)
        const stores = await loadStores(options.root, (id) => ssrLoad(id) as never)
        const layoutsDir = join(options.root, 'layouts')
        const layouts = existsSync(layoutsDir)
          ? readdirSync(layoutsDir)
              .filter((f) => f.endsWith('.alpine'))
              .map((f) => f.replace(/\.alpine$/, ''))
          : []
        // Optional slow-navigation boundary: pages/loading.alpine rendered to
        // static HTML, embedded once for the client-nav runtime to show.
        let loadingHtml: string | undefined
        if (
          !options.islands &&
          clientNav &&
          existsSync(join(options.root, 'pages', 'loading.alpine'))
        ) {
          const l = (await ssrLoad('/pages/loading.alpine')) as unknown as PageModule
          loadingHtml = await renderFragment(l.template, {}, l.scopeId, registry)
        }

        const render = options.islands ? renderIslandsPage : renderPage
        const html = await render({
          loadModule: (id) => ssrLoad(id) as unknown as Promise<PageModule>,
          pageId: matched.pageId,
          params: matched.params,
          url,
          registry,
          componentCss,
          componentCssBlocks,
          stores,
          appCss,
          layouts,
          runtimeConfig,
          publicConfig,
          clientNav,
          loadingHtml,
          locals: (event.context.apexLocals as Record<string, unknown>) ?? {},
          errorPageId: existsSync(join(options.root, 'pages', 'error.alpine'))
            ? '/pages/error.alpine'
            : undefined,
          transformHtml: (u, doc) => vite.transformIndexHtml(u, doc),
        })
        setResponseHeader(event, 'Content-Type', 'text/html')
        return html
      } catch (err) {
        const error = err as Error
        vite.ssrFixStacktrace(error)
        setResponseStatus(event, 500)
        setResponseHeader(event, 'Content-Type', 'text/html')
        const html = renderErrorPage(error, { url, root: options.root })
        try {
          // Inject Vite's HMR client so the page reloads once the error is fixed.
          return await vite.transformIndexHtml(url, html)
        } catch {
          return html
        }
      }
    }),
  )

  const server = createHttpServer(toNodeListener(app))
  await new Promise<void>((resolve) => server.listen(port, resolve))

  return {
    vite,
    server,
    port,
    close: async () => {
      await vite.close()
      await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())))
    },
  }
}
