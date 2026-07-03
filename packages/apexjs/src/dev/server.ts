import { createServer as createHttpServer, type Server } from 'node:http'
import { apex } from 'apexjs-vite'
import {
  createApp,
  defineEventHandler,
  fromNodeMiddleware,
  setResponseHeader,
  setResponseStatus,
  toNodeListener,
} from 'h3'
import { createServer as createViteServer, type ViteDevServer } from 'vite'
import { loadApiRoutes, mountRestRoutes } from '../api/routes.js'
import { createMcpHandler, hasMcpRoutes } from '../mcp/server.js'
import { renderIslandsPage } from '../islands/render.js'
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
    // User apps depend on `apexjs-core`, so the client module imports the runtime
    // from `apexjs-core/client` (a re-export) rather than the internal kit package.
    plugins: [apex({ clientRuntime: 'apexjs-core/client' })],
    optimizeDeps: { include: ['alpinejs'] },
  })

  const app = createApp()

  // Vite handles assets, HMR client, and .alpine module requests. When it has
  // nothing to serve it calls next() and the request falls through to the
  // API / MCP / SSR handlers below.
  app.use(fromNodeMiddleware(vite.middlewares))

  // Load server/api/*.ts routes and mount them as validated REST endpoints.
  // Every `mcp: true` route is additionally exposed as an MCP tool at /mcp —
  // one typed definition, both a REST API and an AI-callable tool.
  const apiRoutes = await loadApiRoutes(options.root, (id) => vite.ssrLoadModule(id) as never)
  mountRestRoutes(app, apiRoutes)
  if (hasMcpRoutes(apiRoutes)) {
    app.use('/mcp', createMcpHandler(apiRoutes))
  }

  app.use(
    defineEventHandler(async (event) => {
      const url = event.path || '/'
      try {
        const render = options.islands ? renderIslandsPage : renderPage
        const html = await render({
          loadModule: (id) => vite.ssrLoadModule(id) as Promise<PageModule>,
          pageId,
          url,
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
