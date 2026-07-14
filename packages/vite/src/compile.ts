import { type AlpineDescriptor, scopeCss } from '@apex-stack/kit'
import { computeIds } from './ids.js'

export interface CompileResult {
  code: string
  css: string
}

// Alpine core magics — evaluated fine server-side (Apex stubs them) and bound by
// Alpine on the client. Left untouched by the rewrite below.
const CORE_MAGICS = new Set([
  'el',
  'refs',
  'store',
  'watch',
  'dispatch',
  'nextTick',
  'id',
  'root',
  'data',
])

/**
 * A page's root `<template x-data>` is compiled into an `Alpine.data` factory, which
 * runs as ordinary JS — outside Alpine's expression scope, so a bare *plugin* magic
 * (`$persist(0)`, registered via `app.client.ts`) is a `ReferenceError` there, even
 * though it works in a nested x-data. Alpine's own answer for magics inside
 * `Alpine.data` is the global form (`Alpine.$persist`), so we rewrite non-core
 * `$magic(` calls to it. See #47.
 *
 *  - **client**: routes through `resolveRootMagic(name, window.Alpine)` — returns the
 *    real global when present ($persist works + persists), else warns once with the fix
 *    and returns a no-op (a magic with no global form can't init root data; use a nested
 *    x-data). Never crashes.
 *  - **ssr**: no Alpine and no console (SSR intentionally degrades), so it inlines a
 *    silent no-op; the client re-binds the real value on hydration.
 *
 * Returns `used: true` when a rewrite fired, so the caller only imports the helper then.
 */
function rewriteRootMagics(expr: string, side: 'client' | 'ssr'): { code: string; used: boolean } {
  let used = false
  // Skip `$` preceded by a word char / `.` / `$` (so `this.$store(`, `Alpine.$x(` are left alone).
  const code = expr.replace(/(?<![\w.$])\$([a-zA-Z_]\w*)\s*\(/g, (m, name: string) => {
    if (CORE_MAGICS.has(name)) return m
    used = true
    return side === 'client'
      ? `${ROOT_MAGIC}(${JSON.stringify(name)},window.Alpine)(`
      : `(globalThis.Alpine&&globalThis.Alpine.$${name}||(()=>{}))(`
  })
  return { code, used }
}

const ROOT_MAGIC = '__apexRootMagic'

/**
 * Generate the JavaScript module for a parsed `.alpine` file.
 *
 * Two very different shapes depending on the environment:
 *
 *  - **SSR** (`ssr: true`): exports the `loader`, the raw `template` string, the
 *    ids, and the scoped `css`. The dev server imports this to render the page.
 *
 *  - **Client** (`ssr: false`): registers the component's `Alpine.data` factory
 *    (authored x-data defaults inlined) via the kit runtime, and arms HMR. The
 *    `<script server>` body is textually excluded so loader code and any secrets
 *    it references never reach the browser bundle.
 */
export function compileAlpine(
  descriptor: AlpineDescriptor,
  filePath: string,
  opts: { ssr: boolean; clientRuntime?: string },
): CompileResult {
  const { componentId, scopeId } = computeIds(filePath)

  const scopedCssBlocks = descriptor.styles
    .map((s) => (s.scoped ? scopeCss(s.content, scopeId) : s.content))
    .join('\n')

  const authoredExpr = descriptor.template?.attrs['x-data']?.trim() || '{}'
  // The `<script client>` body — imports + reusable logic (composables) available
  // to the template's x-data on BOTH server and client.
  const clientCode = descriptor.clientScript?.content?.trim() ?? ''

  if (opts.ssr) {
    // Include the whole <script server> body (so `head`, helpers, etc. survive)
    // and guarantee a `loader` export exists.
    const scriptContent = descriptor.script?.content?.trim() ?? ''
    const hasLoader =
      /export\s+(async\s+)?function\s+loader\b|export\s+(const|let|var)\s+loader\b/.test(
        scriptContent,
      )
    const loaderExport = hasLoader
      ? scriptContent
      : `${scriptContent}\nexport const loader = () => ({})`

    const rootXData = descriptor.template?.attrs['x-data'] ?? null
    // Other root-<template> directives (x-init, x-effect, @events, …) — carried to the
    // emitted root <div> so Alpine runs them on hydration (only x-data is handled specially).
    const rootAttrs = { ...(descriptor.template?.attrs ?? {}) }
    delete rootAttrs['x-data']
    // When a client script exists, compile x-data into a real factory so its
    // imports (composables) resolve during SSR — instead of the sandboxed
    // string evaluator, which can't import. Backward compatible: without a
    // client script, the renderer keeps evaluating the `rootXData` string.
    const rootDataExport = descriptor.clientScript
      ? `export function rootData() { return (${rewriteRootMagics(authoredExpr, 'ssr').code}) }`
      : ''

    const code = [
      clientCode,
      loaderExport,
      `export const template = ${JSON.stringify(descriptor.template?.content ?? '')}`,
      `export const rootXData = ${JSON.stringify(rootXData)}`,
      `export const rootAttrs = ${JSON.stringify(rootAttrs)}`,
      rootDataExport,
      `export const componentId = ${JSON.stringify(componentId)}`,
      `export const scopeId = ${JSON.stringify(scopeId)}`,
      `export const css = ${JSON.stringify(scopedCssBlocks)}`,
      // Whether the author declared a real `loader` (vs the injected no-op) — lets
      // the component registry skip running/serializing loaders for components
      // that don't have one.
      `export const hasLoader = ${hasLoader}`,
    ]
      .filter(Boolean)
      .join('\n')

    return { code, css: scopedCssBlocks }
  }

  // Client module: never includes <script server> code, but DOES include
  // <script client> so composables/imports referenced by x-data resolve.
  const runtime = opts.clientRuntime ?? '@apex-stack/kit/client'
  const rootExpr = rewriteRootMagics(authoredExpr, 'client')
  // These are imported from the app's client runtime (core/client in a real app), so any
  // symbol added here MUST be re-exported by @apex-stack/core/client — see that package's
  // client.test.ts (COMPILER_GLUE), which fails if the barrel forgets one.
  const imports = [
    'registerApexComponent',
    ...(rootExpr.used ? [`resolveRootMagic as ${ROOT_MAGIC}`] : []),
  ]
  const code = [
    `import { ${imports.join(', ')} } from ${JSON.stringify(runtime)}`,
    clientCode,
    `registerApexComponent(${JSON.stringify(componentId)}, () => (${rootExpr.code}))`,
    // Dev-only HMR wiring (Vite strips the whole block from production builds):
    //  - apex:css — a style-only edit hot-swaps the component's scoped CSS in
    //    place (see the plugin's handleHotUpdate); no reload, state preserved.
    //  - full reloads (template/script edits) save + restore the scroll
    //    position, so an edit doesn't dump you back at the top of the page.
    // Window-guarded: every .alpine client module emits this, one instance runs.
    `if (import.meta.hot) {
  import.meta.hot.accept()
  const w = window
  if (!w.__apexHmr) {
    w.__apexHmr = true
    import.meta.hot.on('apex:css', (d) => {
      let el = document.querySelector('style[data-apex-css="' + d.scopeId + '"]')
      if (!el) {
        el = document.createElement('style')
        el.setAttribute('data-apex-css', d.scopeId)
        document.head.appendChild(el)
      }
      el.textContent = d.css
    })
    import.meta.hot.on('vite:beforeFullReload', () => {
      sessionStorage.setItem('__apex_scroll', String(w.scrollY))
    })
    const s = sessionStorage.getItem('__apex_scroll')
    if (s !== null) {
      sessionStorage.removeItem('__apex_scroll')
      requestAnimationFrame(() => w.scrollTo(0, Number(s)))
    }
  }
}`,
  ]
    .filter(Boolean)
    .join('\n')

  return { code, css: scopedCssBlocks }
}
