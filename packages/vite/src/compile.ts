import { type AlpineDescriptor, scopeCss } from '@apex-stack/kit'
import { computeIds } from './ids.js'

export interface CompileResult {
  code: string
  css: string
}

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
    // When a client script exists, compile x-data into a real factory so its
    // imports (composables) resolve during SSR — instead of the sandboxed
    // string evaluator, which can't import. Backward compatible: without a
    // client script, the renderer keeps evaluating the `rootXData` string.
    const rootDataExport = descriptor.clientScript
      ? `export function rootData() { return (${authoredExpr}) }`
      : ''

    const code = [
      clientCode,
      loaderExport,
      `export const template = ${JSON.stringify(descriptor.template?.content ?? '')}`,
      `export const rootXData = ${JSON.stringify(rootXData)}`,
      rootDataExport,
      `export const componentId = ${JSON.stringify(componentId)}`,
      `export const scopeId = ${JSON.stringify(scopeId)}`,
      `export const css = ${JSON.stringify(scopedCssBlocks)}`,
    ]
      .filter(Boolean)
      .join('\n')

    return { code, css: scopedCssBlocks }
  }

  // Client module: never includes <script server> code, but DOES include
  // <script client> so composables/imports referenced by x-data resolve.
  const runtime = opts.clientRuntime ?? '@apex-stack/kit/client'
  const code = [
    `import { registerApexComponent } from ${JSON.stringify(runtime)}`,
    clientCode,
    `registerApexComponent(${JSON.stringify(componentId)}, () => (${authoredExpr}))`,
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
