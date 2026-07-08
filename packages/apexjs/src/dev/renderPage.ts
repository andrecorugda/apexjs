import {
  type ComponentRegistry,
  renderComponent,
  renderFragment,
  stateIsland,
} from '@apex-stack/kit'
import { clientConfigScript, type RuntimeConfig } from '../config/runtime.js'
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

/**
 * Build `<head>` inner tags from a page's head data. Always emits a <title>.
 * The page-specific `<meta>`/`<link>` carry `data-apex-head` so client-side
 * navigation can swap exactly this set of tags without touching stylesheets etc.
 */
export function renderHead(head: HeadInput | undefined): string {
  const parts = [`<title>${head?.title ? escAttr(head.title) : 'Apex JS'}</title>`]
  for (const m of head?.meta ?? []) {
    parts.push(
      `<meta ${Object.entries(m)
        .map(([k, v]) => `${k}="${escAttr(v)}"`)
        .join(' ')} data-apex-head />`,
    )
  }
  for (const l of head?.link ?? []) {
    parts.push(
      `<link ${Object.entries(l)
        .map(([k, v]) => `${k}="${escAttr(v)}"`)
        .join(' ')} data-apex-head />`,
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
  /** Per-component CSS blocks (scopeId → css) — enables per-component style HMR in dev. */
  componentCssBlocks?: Array<{ scopeId: string; css: string }>
  /** Post-process the shell HTML (dev: vite.transformIndexHtml). */
  transformHtml?: (url: string, html: string) => string | Promise<string>
  /** In a production build, the href of the built client bundle for this page.
   * When set, the shell references it instead of the inline dev module. */
  clientHref?: string
  /** Global stores discovered from `stores/*` — SSR initial state + client registration. */
  stores?: LoadedStore[]
  /** A global stylesheet href (e.g. `/app.css`) linked in <head> — Tailwind + shared styles. */
  appCss?: string
  /** Built CSS hrefs (production) to link in <head>. */
  clientCss?: string[]
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
  /** Enable client-side navigation (SPA link nav + prefetch). Default true. */
  clientNav?: boolean
  /** Pre-rendered `loading.alpine` HTML, embedded as the slow-nav boundary. */
  loadingHtml?: string
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
  const { html } = await renderComponent({
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
  const layoutCssBlocks: Array<{ scopeId: string; css: string }> = []
  const seen = new Set<string>()
  let next: string | false | null | undefined = layoutName
  while (typeof next === 'string' && available.includes(next) && !seen.has(next)) {
    seen.add(next)
    const layoutMod = await opts.loadModule(`/layouts/${next}.alpine`)
    const chrome = await renderFragment(layoutMod.template, {}, layoutMod.scopeId, opts.registry)
    // Function replacement so `$` in the wrapped HTML isn't treated as a special token.
    body = /<slot\b[^>]*>[\s\S]*?<\/slot>/.test(chrome)
      ? chrome.replace(/<slot\b[^>]*>[\s\S]*?<\/slot>/, () => body)
      : chrome + body
    if (layoutMod.css) layoutCssBlocks.push({ scopeId: layoutMod.scopeId, css: layoutMod.css })
    next = layoutMod.layout // a layout may declare a parent layout
  }

  // One <style data-apex-css="<scopeId>"> per source, so a style-only edit in
  // dev can hot-swap exactly that block (HMR replaces the tag's contents).
  const cssBlocks: Array<{ scopeId: string; css: string }> = [
    { scopeId: mod.scopeId, css: mod.css },
    ...layoutCssBlocks,
    ...(opts.componentCssBlocks ??
      (opts.componentCss ? [{ scopeId: 'components', css: opts.componentCss }] : [])),
  ].filter((b) => b.css)

  const doc = shell({
    body,
    island: stateIsland(mod.componentId, loaderData),
    cssBlocks,
    pageId: opts.pageId,
    clientHref: opts.clientHref,
    storeIds: stores.map((s) => s.id),
    appCss: opts.appCss,
    clientCss: opts.clientCss,
    headTags: renderHead(head),
    configScript: clientConfigScript(opts.publicConfig ?? {}),
    // dev imports the page module by path; prod imports its hashed bundle.
    moduleUrl: opts.clientHref ?? opts.pageId,
    clientNav: opts.clientNav !== false,
    loadingHtml: opts.loadingHtml,
  })

  return opts.transformHtml ? opts.transformHtml(opts.url, doc) : doc
}

interface ShellParts {
  body: string
  island: string
  cssBlocks: Array<{ scopeId: string; css: string }>
  pageId: string
  clientHref?: string
  storeIds?: string[]
  appCss?: string
  /** Built CSS hrefs (production) to link in <head>. */
  clientCss?: string[]
  headTags?: string
  configScript?: string
  /** URL the client imports to register this page's factory (dev: path, prod: bundle). */
  moduleUrl?: string
  /** Wire up client-side navigation in the boot script. */
  clientNav?: boolean
  /** Pre-rendered `loading.alpine` HTML for the slow-nav boundary. */
  loadingHtml?: string
}

function shell({
  body,
  island,
  cssBlocks,
  pageId,
  clientHref,
  storeIds = [],
  appCss,
  clientCss = [],
  headTags = '<title>Apex JS</title>',
  configScript = '',
  moduleUrl,
  clientNav = true,
  loadingHtml,
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

  // Client-side navigation is installed from the runtime, once, in the boot. The
  // built bundle installs it itself (see buildClient); the dev inline script does
  // it here. Guarded by `window.__apexNav` so it never double-installs.
  const navImport = clientNav ? `  import { installNav } from '@apex-stack/core/client'\n` : ''
  const navInstall = clientNav ? `  installNav()\n` : ''

  // Production build → reference the built, hashed client bundle. Dev → inline
  // the module so Vite serves + HMRs it.
  const clientScript = clientHref
    ? `<script type="module" src="${clientHref}"></script>`
    : `<script type="module">
  import Alpine from 'alpinejs'
${navImport}${storeImports ? `${storeImports}\n` : ''}  import ${JSON.stringify(pageId)}
  window.Alpine = Alpine
${storeRegs ? `${storeRegs}\n` : ''}  Alpine.start()
${navInstall}</script>`

  // Global stylesheet(s) as render-blocking <link>s in <head> — NOT a deferred
  // JS import — so the page never flashes unstyled before Alpine hydrates.
  const cssLinks = [...(appCss ? [appCss] : []), ...clientCss]
    .map((href) => `<link rel="stylesheet" href="${href}" />`)
    .join('\n  ')

  // The stable region client-side navigation swaps. The page module hint tells
  // nav which module to import to register the next page's Alpine factory.
  const moduleMeta = moduleUrl
    ? `\n  <meta name="apex:page-module" content="${escAttr(moduleUrl)}" />`
    : ''
  const loadingTpl = loadingHtml ? `\n<template data-apex-loading>${loadingHtml}</template>` : ''

  // One <style> per source (page / layout / component), keyed by scopeId so a
  // style-only edit in dev hot-swaps exactly that tag's contents.
  const styleTags = cssBlocks
    .map((b) => `<style data-apex-css="${escAttr(b.scopeId)}">${b.css}</style>`)
    .join('\n  ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />${moduleMeta}
  ${cssLinks ? `${cssLinks}\n  ` : ''}${headTags}
  ${styleTags}
</head>
<body>
<div id="__apex" data-apex-root>
${body}
</div>${loadingTpl}
${island}
${configScript}
${clientScript}
</body>
</html>`
}
