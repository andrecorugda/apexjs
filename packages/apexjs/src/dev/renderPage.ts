import {
  type ComponentRegistry,
  renderComponent,
  renderFragment,
  stateIsland,
} from '@apex-stack/kit'
import { type RuntimeConfig, clientConfigScript } from '../config/runtime.js'
import { type LoadedStore, storesInitialState } from '../stores/loader.js'

/** The shape a compiled `.alpine` SSR module exports (see @apex-stack/vite). */
/** Head/SEO data a page's `head()` may return. */
export interface HeadInput {
  title?: string
  /** `<meta>` tags — each object's keys become attributes, e.g. { name: 'description', content: '…' }. */
  meta?: Array<Record<string, string>>
  /** `<link>` tags — e.g. { rel: 'canonical', href: '…' }. */
  link?: Array<Record<string, string>>
}

export interface PageModule {
  loader: (ctx: {
    params: Record<string, string>
    url: string
    config: RuntimeConfig
    locals: Record<string, unknown>
  }) => unknown | Promise<unknown>
  /** Optional per-page head/SEO — receives the loader's data, returns title/meta/link. */
  head?: (ctx: {
    data: Record<string, unknown>
    params: Record<string, string>
    url: string
    config: RuntimeConfig
    locals: Record<string, unknown>
  }) => HeadInput | Promise<HeadInput>
  template: string
  rootXData: string | null
  /** Compiled x-data factory (present when the page has a `<script client>`) — resolves imports at SSR. */
  rootData?: () => Record<string, unknown>
  /** Layout name to wrap this page in; `false` opts out. Defaults to `default` if it exists. */
  layout?: string | false
  componentId: string
  scopeId: string
  css: string
}

function escAttr(s: unknown): string {
  return String(s).replace(/[&<>"]/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;',
  )
}

/** Build `<head>` inner tags from a page's head data. Always emits a <title>. */
function renderHead(head: HeadInput | undefined): string {
  const parts = [`<title>${head?.title ? escAttr(head.title) : 'Apex JS'}</title>`]
  for (const m of head?.meta ?? []) {
    parts.push(
      `<meta ${Object.entries(m)
        .map(([k, v]) => `${k}="${escAttr(v)}"`)
        .join(' ')} />`,
    )
  }
  for (const l of head?.link ?? []) {
    parts.push(
      `<link ${Object.entries(l)
        .map(([k, v]) => `${k}="${escAttr(v)}"`)
        .join(' ')} />`,
    )
  }
  return parts.join('\n  ')
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
  /** In a production build, the href of the built client bundle for this page.
   * When set, the shell references it instead of the inline dev module. */
  clientHref?: string
  /** Global stores discovered from `stores/*` — SSR initial state + client registration. */
  stores?: LoadedStore[]
  /** A global stylesheet module id (e.g. `/app.css`) to import — carries Tailwind + shared styles. */
  appCss?: string
  /** Available layout names (from `layouts/*.alpine`) — enables page-wrapping layouts. */
  layouts?: string[]
  /** Full resolved runtime config passed to the page loader + head (server-side). */
  runtimeConfig?: RuntimeConfig
  /** Public config subset seeded into the client for `useRuntimeConfig()`. */
  publicConfig?: Record<string, unknown>
  /** Request-scoped state from middleware, passed to the loader + head. */
  locals?: Record<string, unknown>
  /** Error boundary: page id (e.g. `/pages/error.alpine`) rendered with `{ error }` if the loader throws. */
  errorPageId?: string
}

/**
 * The framework's render seam — deliberately dev-server-agnostic so it can move
 * verbatim into a Nitro route handler post-spike. Loads the page module, runs
 * its loader, renders the component to hydration-safe HTML, and assembles the
 * document shell (SSR body + state island + client entry).
 */
export async function renderPage(opts: RenderPageOptions): Promise<string> {
  let mod = await opts.loadModule(opts.pageId)
  const cfg = opts.runtimeConfig ?? { public: {} }
  const locals = opts.locals ?? {}

  // Error boundary: if the loader throws and an error page exists, render THAT
  // (with `{ error }`) instead of crashing — an in-app, layout-wrapped error UI.
  let loaderData: Record<string, unknown>
  try {
    loaderData = ((await mod.loader({
      params: opts.params ?? {},
      url: opts.url,
      config: cfg,
      locals,
    })) ?? {}) as Record<string, unknown>
  } catch (err) {
    if (!opts.errorPageId) throw err
    mod = await opts.loadModule(opts.errorPageId)
    const e = err as { message?: string; statusCode?: number }
    loaderData = {
      error: { message: e.message ?? 'Something went wrong', statusCode: e.statusCode ?? 500 },
    }
  }

  const head = mod.head
    ? await mod.head({
        data: loaderData,
        params: opts.params ?? {},
        url: opts.url,
        config: cfg,
        locals,
      })
    : undefined

  const stores = opts.stores ?? []
  const { html } = renderComponent({
    template: mod.template,
    rootXData: mod.rootXData,
    componentId: mod.componentId,
    scopeId: mod.scopeId,
    loaderData,
    registry: opts.registry,
    stores: storesInitialState(stores),
    authoredDefaults: mod.rootData ? mod.rootData() : undefined,
  })

  // Wrap the page in a layout (layouts/<name>.alpine) — its `<slot></slot>` is
  // replaced by the rendered page. `export const layout` on the page overrides;
  // `false` opts out; otherwise `default` is used when it exists.
  const available = opts.layouts ?? []
  const layoutName =
    mod.layout === false
      ? null
      : typeof mod.layout === 'string'
        ? mod.layout
        : available.includes('default')
          ? 'default'
          : null

  // Nested layouts: wrap the page in its layout, and if that layout itself
  // declares `export const layout = '<parent>'`, wrap again — outermost last.
  // `seen` guards against cycles; each layout is applied at most once.
  let body = html
  let layoutCss = ''
  const seen = new Set<string>()
  let next: string | false | null | undefined = layoutName
  while (typeof next === 'string' && available.includes(next) && !seen.has(next)) {
    seen.add(next)
    const layoutMod = await opts.loadModule(`/layouts/${next}.alpine`)
    const chrome = renderFragment(layoutMod.template, {}, layoutMod.scopeId, opts.registry)
    // Function replacement so `$` in the wrapped HTML isn't treated as a special token.
    body = /<slot\b[^>]*>[\s\S]*?<\/slot>/.test(chrome)
      ? chrome.replace(/<slot\b[^>]*>[\s\S]*?<\/slot>/, () => body)
      : chrome + body
    layoutCss += layoutMod.css
    next = layoutMod.layout // a layout may declare a parent layout
  }

  const doc = shell({
    body,
    island: stateIsland(mod.componentId, loaderData),
    css: mod.css + layoutCss + (opts.componentCss ?? ''),
    pageId: opts.pageId,
    clientHref: opts.clientHref,
    storeIds: stores.map((s) => s.id),
    appCss: opts.appCss,
    headTags: renderHead(head),
    configScript: clientConfigScript(opts.publicConfig ?? {}),
  })

  return opts.transformHtml ? opts.transformHtml(opts.url, doc) : doc
}

interface ShellParts {
  body: string
  island: string
  css: string
  pageId: string
  clientHref?: string
  storeIds?: string[]
  appCss?: string
  headTags?: string
  configScript?: string
}

function shell({
  body,
  island,
  css,
  pageId,
  clientHref,
  storeIds = [],
  appCss,
  headTags = '<title>Apex JS</title>',
  configScript = '',
}: ShellParts): string {
  // Register global stores on the client before Alpine.start(): import each store
  // module and call Alpine.store(name, factory()) — same factory the server used,
  // so hydration is value-identical.
  const storeImports = storeIds
    .map((id, i) => `  import __s${i} from ${JSON.stringify(id)}`)
    .join('\n')
  const storeRegs = storeIds
    .map((_, i) => `  Alpine.store(__s${i}.name, __s${i}.factory())`)
    .join('\n')

  // Production build → reference the built, hashed client bundle. Dev → inline
  // the module so Vite serves + HMRs it.
  const clientScript = clientHref
    ? `<script type="module" src="${clientHref}"></script>`
    : `<script type="module">
${appCss ? `  import ${JSON.stringify(appCss)}\n` : ''}  import Alpine from 'alpinejs'
${storeImports ? `${storeImports}\n` : ''}  import ${JSON.stringify(pageId)}
  window.Alpine = Alpine
${storeRegs ? `${storeRegs}\n` : ''}  Alpine.start()
</script>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${headTags}
  <style>${css}</style>
</head>
<body>
${body}
${island}
${configScript}
${clientScript}
</body>
</html>`
}
