import { type ComponentRegistry, renderIslands } from '@apex-stack/kit'
import type { PageModule } from '../dev/renderPage.js'

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
const ISLAND_LOADER = /* js */ `
let __alpine
function __ensureAlpine() {
  return __alpine ??= import('alpinejs').then(function (m) {
    const Alpine = m.default
    window.Alpine = Alpine
    Alpine.start() // islands are x-ignore'd, so this hydrates nothing on its own
    return Alpine
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

export interface RenderIslandsPageOptions {
  loadModule: (id: string) => Promise<PageModule>
  pageId: string
  url: string
  params?: Record<string, string>
  registry?: ComponentRegistry
  componentCss?: string
  transformHtml?: (url: string, html: string) => string | Promise<string>
}

/**
 * Render a page in islands mode: static-first HTML with independently-hydrating
 * interactive regions. A page with no hydrating islands ships **zero** JavaScript.
 */
export async function renderIslandsPage(opts: RenderIslandsPageOptions): Promise<string> {
  const mod = await opts.loadModule(opts.pageId)
  const loaderData = ((await mod.loader({ params: opts.params ?? {}, url: opts.url })) ?? {}) as Record<
    string,
    unknown
  >

  const { html, hydratingCount } = renderIslands(
    mod.template,
    loaderData,
    mod.scopeId,
    opts.registry,
  )

  const loaderScript =
    hydratingCount > 0 ? `\n<script type="module">${ISLAND_LOADER}</script>` : ''

  const doc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Apex JS — Islands</title>
  <style>${mod.css}${opts.componentCss ?? ''}</style>
</head>
<body>
${html}${loaderScript}
</body>
</html>`

  return opts.transformHtml ? opts.transformHtml(opts.url, doc) : doc
}
