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
    const loaderCode = descriptor.script?.content?.trim()
    const loaderExport = loaderCode?.includes('loader')
      ? loaderCode
      : 'export const loader = () => ({})'

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
    `if (import.meta.hot) import.meta.hot.accept()`,
  ]
    .filter(Boolean)
    .join('\n')

  return { code, css: scopedCssBlocks }
}
