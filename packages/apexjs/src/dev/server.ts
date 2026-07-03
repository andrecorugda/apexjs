import { createServer as createHttpServer, type Server } from 'node:http'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
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
import { matchRoute, scanPages } from '../routing/router.js'
import { renderErrorPage, renderNotFoundPage } from './errorPage.js'
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
  const alias: Record<string, string> = { '@apex-stack/core/client': coreClient }
  if (alpine) alias.alpinejs = alpine
  if (kit) alias['@apex-stack/kit'] = kit

  const vite = await createViteServer({
    root: options.root,
    appType: 'custom',
    // Derive the HMR port from the dev port so multiple `apex dev` instances
    // don't all fight over Vite's default 24678.
    server: { middlewareMode: true, fs: { strict: false }, hmr: { port: port + 1 } },
    resolve: { alias },
    // User apps depend on `@apex-stack/core`, so the client module imports the runtime
    // from `@apex-stack/core/client` (a re-export) rather than the internal kit package.
    plugins: [apex({ clientRuntime: '@apex-stack/core/client' })],
    optimizeDeps: { include: ['alpinejs'] },
  })

  // Vite's ssrLoadModule needs project files as absolute paths — a bare
  // root-relative "/pages/x" is misread as drive-root ("C:\pages\x") on Windows,
  // so it "doesn't exist". Normalize project ids (anything starting with "/" not
  // already under root) to an absolute forward-slash path; identical on POSIX + Windows.
  const ssrLoad = (id: string): Promise<Record<string, unknown>> => {
    const resolved =
      id[0] === '/' && !id.startsWith(options.root) ? join(options.root, id).replace(/\\/g, '/') : id
    return vite.ssrLoadModule(resolved) as Promise<Record<string, unknown>>
  }

  const app = createApp()

  // Vite handles assets, HMR client, and .alpine module requests. When it has
  // nothing to serve it calls next() and the request falls through to the
  // API / MCP / SSR handlers below.
  app.use(fromNodeMiddleware(vite.middlewares))

  // Load server/api/*.ts routes (single routes + resources) per request in dev, so
  // editing a route or resource takes effect without a restart — Vite invalidates the
  // module on change, so ssrLoadModule returns fresh code. A `/api` handler validates
  // and dispatches them; `/mcp` exposes every `mcp: true` entry as an AI-callable tool.
  const loadEntries = () => loadApiRoutes(options.root, (id) => ssrLoad(id) as never)
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
          return await vite.transformIndexHtml(url, renderNotFoundPage(url, routes))
        }

        const { registry, css: componentCss } = await loadComponents(
          options.root,
          (id) => ssrLoad(id) as never,
        )
        const render = options.islands ? renderIslandsPage : renderPage
        const html = await render({
          loadModule: (id) => ssrLoad(id) as unknown as Promise<PageModule>,
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
      await new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      )
    },
  }
}
