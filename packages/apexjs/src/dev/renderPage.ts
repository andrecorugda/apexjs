import { type ComponentRegistry, renderComponent, stateIsland } from 'apexjs-kit'

/** The shape a compiled `.alpine` SSR module exports (see apexjs-vite). */
export interface PageModule {
  loader: (ctx: { params: Record<string, string>; url: string }) => unknown | Promise<unknown>
  template: string
  rootXData: string | null
  componentId: string
  scopeId: string
  css: string
}

export interface RenderPageOptions {
  /** Load a page's SSR module (dev: vite.ssrLoadModule; prod: static import). */
  loadModule: (id: string) => Promise<PageModule>
  /** The page module id to render, e.g. `/pages/index.alpine`. */
  pageId: string
  /** The incoming request path. */
  url: string
  /** Route params captured from a dynamic segment (e.g. { slug: '...' }). */
  params?: Record<string, string>
  /** Registry of embeddable components. */
  registry?: ComponentRegistry
  /** Aggregated component CSS to include in the shell. */
  componentCss?: string
  /** Post-process the shell HTML (dev: vite.transformIndexHtml). */
  transformHtml?: (url: string, html: string) => string | Promise<string>
}

/**
 * The framework's render seam — deliberately dev-server-agnostic so it can move
 * verbatim into a Nitro route handler post-spike. Loads the page module, runs
 * its loader, renders the component to hydration-safe HTML, and assembles the
 * document shell (SSR body + state island + client entry).
 */
export async function renderPage(opts: RenderPageOptions): Promise<string> {
  const mod = await opts.loadModule(opts.pageId)
  const loaderData = ((await mod.loader({ params: opts.params ?? {}, url: opts.url })) ?? {}) as Record<
    string,
    unknown
  >

  const { html } = renderComponent({
    template: mod.template,
    rootXData: mod.rootXData,
    componentId: mod.componentId,
    scopeId: mod.scopeId,
    loaderData,
    registry: opts.registry,
  })

  const doc = shell({
    body: html,
    island: stateIsland(mod.componentId, loaderData),
    css: mod.css + (opts.componentCss ?? ''),
    pageId: opts.pageId,
  })

  return opts.transformHtml ? opts.transformHtml(opts.url, doc) : doc
}

interface ShellParts {
  body: string
  island: string
  css: string
  pageId: string
}

function shell({ body, island, css, pageId }: ShellParts): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Apex JS</title>
  <style>${css}</style>
</head>
<body>
${body}
${island}
<script type="module">
  import Alpine from 'alpinejs'
  import ${JSON.stringify(pageId)}
  window.Alpine = Alpine
  Alpine.start()
</script>
</body>
</html>`
}
