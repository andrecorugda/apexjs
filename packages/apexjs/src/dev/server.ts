import { createServer as createHttpServer, type Server } from 'node:http'
import { apex } from '@apex-stack/vite'
import {
  createApp,
  defineEventHandler,
  fromNodeMiddleware,
  setResponseHeader,
  setResponseStatus,
  toNodeListener,
} from 'h3'
import { createServer as createViteServer, type ViteDevServer } from 'vite'
import { createApiHandler, loadApiRoutes } from '../api/routes.js'
import { createMcpHandler } from '../mcp/server.js'
import { loadComponents } from '../components/registry.js'
import { renderIslandsPage } from '../islands/render.js'
import { matchRoute, type RouteDef, scanPages } from '../routing/router.js'
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

  const vite = await createViteServer({
    root: options.root,
    appType: 'custom',
    server: { middlewareMode: true },
    // User apps depend on `@apex-stack/core`, so the client module imports the runtime
    // from `@apex-stack/core/client` (a re-export) rather than the internal kit package.
    plugins: [apex({ clientRuntime: '@apex-stack/core/client' })],
    optimizeDeps: { include: ['alpinejs'] },
  })

  const app = createApp()

  // Vite handles assets, HMR client, and .alpine module requests. When it has
  // nothing to serve it calls next() and the request falls through to the
  // API / MCP / SSR handlers below.
  app.use(fromNodeMiddleware(vite.middlewares))

  // Load server/api/*.ts routes (single routes + resources) per request in dev, so
  // editing a route or resource takes effect without a restart — Vite invalidates the
  // module on change, so ssrLoadModule returns fresh code. A `/api` handler validates
  // and dispatches them; `/mcp` exposes every `mcp: true` entry as an AI-callable tool.
  const loadEntries = () => loadApiRoutes(options.root, (id) => vite.ssrLoadModule(id) as never)
  app.use('/api', defineEventHandler((event) => loadEntries().then((e) => createApiHandler(e)(event))))
  app.use('/mcp', defineEventHandler((event) => loadEntries().then((e) => createMcpHandler(e)(event))))

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
          return notFoundPage(url, routes)
        }

        const { registry, css: componentCss } = await loadComponents(
          options.root,
          (id) => vite.ssrLoadModule(id) as never,
        )
        const render = options.islands ? renderIslandsPage : renderPage
        const html = await render({
          loadModule: (id) => vite.ssrLoadModule(id) as Promise<PageModule>,
          pageId: matched.pageId,
          params: matched.params,
          url,
          registry,
          componentCss,
          transformHtml: (u, doc) => vite.transformIndexHtml(u, doc),
        })
        setResponseHeader(event, 'Content-Type', 'text/html')
        return html
      } catch (err) {
        const error = err as Error
        vite.ssrFixStacktrace(error)
        setResponseStatus(event, 500)
        setResponseHeader(event, 'Content-Type', 'text/html')
        return `<pre>${escapeHtml(error.stack ?? error.message)}</pre>`
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
      await new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      )
    },
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'))
}

function notFoundPage(url: string, routes: RouteDef[]): string {
  const list = routes.map((r) => `<li><code>${escapeHtml(r.pattern)}</code></li>`).join('')
  return `<!DOCTYPE html><html><head><title>404 — Apex JS</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 40rem; margin: 3rem auto;">
  <h1>404 — no route for <code>${escapeHtml(url)}</code></h1>
  <p>Available routes:</p>
  <ul>${list || '<li>(no pages found — add <code>pages/index.alpine</code>)</li>'}</ul>
</body></html>`
}
