import { type ComponentRegistry, renderIslands } from '@apex-stack/kit'
import { pwaHeadTags, pwaRegisterScript } from '../build/pwa.js'
import { clientConfigScript, type PwaConfig, type RuntimeConfig } from '../config/runtime.js'
import { type PageModule, renderHead } from '../dev/renderPage.js'

const SLOT_RE = /<slot\b[^>]*>[\s\S]*?<\/slot>/

/**
 * The lazy islands client loader, inlined into the page shell.
 *
 * It ships only when a page has hydrating islands. It imports Alpine **lazily**
 * on the first island that needs it, then hydrates each island on its trigger:
 *   - load    → immediately
 *   - idle    → requestIdleCallback
 *   - visible → IntersectionObserver
 *   - none    → never (stays static; Alpine may never load at all)
 */
export function islandLoader(clientEntry?: string | null): string {
  return /* js */ `
let __alpine
function __ensureAlpine() {
  return __alpine ??= import('alpinejs').then(function (m) {
    var Alpine = m.default
    window.Alpine = Alpine
    ${
      clientEntry
        ? `return import(${JSON.stringify(clientEntry)}).then(function (c) { if (typeof c.default === 'function') c.default(Alpine); Alpine.start(); return Alpine })`
        : `Alpine.start() // islands are x-ignore'd, so this hydrates nothing on its own
    return Alpine`
    }
  })
}
async function __hydrate(el) {
  const Alpine = await __ensureAlpine()
  // Global Alpine.start() marked this island with the internal _x_ignore
  // property (from the x-ignore attribute). Clear BOTH so initTree will descend
  // and initialize the island's own x-data instead of early-returning.
  el.removeAttribute('x-ignore')
  delete el._x_ignore
  Alpine.initTree(el)
  el.setAttribute('data-apex-hydrated', '')
}
document.querySelectorAll('[data-apex-island]').forEach(function (el) {
  const mode = el.getAttribute('data-apex-client')
  if (mode === 'load') {
    __hydrate(el)
  } else if (mode === 'idle') {
    (window.requestIdleCallback || function (cb) { return setTimeout(cb, 200) })(function () { __hydrate(el) })
  } else if (mode === 'visible') {
    const io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) { if (e.isIntersecting) { obs.unobserve(e.target); __hydrate(e.target) } })
    })
    io.observe(el)
  }
  // 'none' → do nothing; the SSR HTML is the final, static output.
})
`.trim()
}

export interface RenderIslandsPageOptions {
  loadModule: (id: string) => Promise<PageModule>
  pageId: string
  url: string
  params?: Record<string, string>
  registry?: ComponentRegistry
  componentCss?: string
  transformHtml?: (url: string, html: string) => string | Promise<string>
  runtimeConfig?: RuntimeConfig
  publicConfig?: Record<string, unknown>
  locals?: Record<string, unknown>
  /** Available layout names (from `layouts/*.alpine`) — enables page-wrapping layouts. */
  layouts?: string[]
  appCss?: string
  /** Built stylesheet hrefs (production) to link in <head>. */
  cssHrefs?: string[]
  /** PWA config — links the manifest/theme-color + registers the service worker (🟡). */
  pwa?: PwaConfig
  /**
   * Production: href of the built islands runtime bundle. When set, pages with
   * hydrating islands reference it instead of inlining the dev loader — whose
   * bare `import('alpinejs')` only Vite's dev server can resolve.
   */
  loaderHref?: string
  /** Optional user client hook (`app.client.ts`) — called before Alpine.start() in the
   * inlined dev island loader (prod bundles bake it in via buildIslands). */
  clientEntry?: string
}

/**
 * Render a page in islands mode: static-first HTML with independently-hydrating
 * interactive regions. A page with no hydrating islands ships **zero** JavaScript.
 *
 * The page is wrapped in its layout chain (same as the default renderer) and the
 * WHOLE tree — layout + page — goes through the islands walker, so `client:*`
 * directives anywhere (page or layout) become hydrating islands.
 */
export async function renderIslandsPage(opts: RenderIslandsPageOptions): Promise<string> {
  const mod = await opts.loadModule(opts.pageId)
  const cfg = opts.runtimeConfig ?? { public: {} }
  const locals = opts.locals ?? {}
  const loaderData = ((await mod.loader({
    params: opts.params ?? {},
    url: opts.url,
    config: cfg,
    locals,
  })) ?? {}) as Record<string, unknown>

  const head = mod.head
    ? await mod.head({
        data: loaderData,
        params: opts.params ?? {},
        url: opts.url,
        config: cfg,
        locals,
      })
    : undefined

  // Root x-data defaults are available as SSR scope too (so a page that keeps
  // page-level x-data still renders its static values in islands mode).
  const authoredDefaults = mod.rootData ? mod.rootData() : {}
  const data = { ...authoredDefaults, ...loaderData }

  // Wrap the page template in its layout chain (slot → inner) at the TEMPLATE
  // level, so islands in the layout (e.g. a nav toggle) hydrate too.
  const available = opts.layouts ?? []
  const layoutName =
    mod.layout === false
      ? null
      : typeof mod.layout === 'string'
        ? mod.layout
        : available.includes('default')
          ? 'default'
          : null
  let template = mod.template
  let layoutCss = ''
  const seen = new Set<string>()
  let next: string | false | null | undefined = layoutName
  while (typeof next === 'string' && available.includes(next) && !seen.has(next)) {
    seen.add(next)
    const layoutMod = await opts.loadModule(`/layouts/${next}.alpine`)
    template = SLOT_RE.test(layoutMod.template)
      ? layoutMod.template.replace(SLOT_RE, () => template)
      : layoutMod.template + template
    layoutCss += layoutMod.css
    next = layoutMod.layout
  }

  const { html, hydratingCount } = await renderIslands(template, data, mod.scopeId, opts.registry)

  const loaderScript =
    hydratingCount > 0
      ? opts.loaderHref
        ? `\n<script type="module" src="${opts.loaderHref}"></script>`
        : `\n<script type="module">${islandLoader(opts.clientEntry)}</script>`
      : ''
  const configScript = hydratingCount > 0 ? `\n${clientConfigScript(opts.publicConfig ?? {})}` : ''
  const pwaTags = opts.pwa ? `\n  ${pwaHeadTags(opts.pwa)}\n  ${pwaRegisterScript()}` : ''
  const appCssLink = [...(opts.appCss ? [opts.appCss] : []), ...(opts.cssHrefs ?? [])]
    .map((href) => `\n  <link rel="stylesheet" href="${href}" />`)
    .join('')

  const doc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  ${renderHead(head)}${pwaTags}${appCssLink}
  <style>${mod.css}${layoutCss}${opts.componentCss ?? ''}</style>
</head>
<body>
${html}${configScript}${loaderScript}
</body>
</html>`

  return opts.transformHtml ? opts.transformHtml(opts.url, doc) : doc
}
