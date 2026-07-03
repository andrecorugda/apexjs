import { type AlpineDescriptor, scopeCss } from '@apexjs/kit'
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
  opts: { ssr: boolean },
): CompileResult {
  const { componentId, scopeId } = computeIds(filePath)

  const scopedCssBlocks = descriptor.styles
    .map((s) => (s.scoped ? scopeCss(s.content, scopeId) : s.content))
    .join('\n')

  if (opts.ssr) {
    const loaderCode = descriptor.script?.content?.trim()
    const loaderExport = loaderCode?.includes('loader')
      ? loaderCode
      : 'export const loader = () => ({})'

    const code = [
      loaderExport,
      `export const template = ${JSON.stringify(descriptor.template?.content ?? '')}`,
      `export const componentId = ${JSON.stringify(componentId)}`,
      `export const scopeId = ${JSON.stringify(scopeId)}`,
      `export const css = ${JSON.stringify(scopedCssBlocks)}`,
    ].join('\n')

    return { code, css: scopedCssBlocks }
  }

  // Client module: never includes <script server> code.
  const authoredExpr = descriptor.template?.attrs['x-data']?.trim() || '{}'
  const code = [
    `import { registerApexComponent } from '@apexjs/kit/client'`,
    `registerApexComponent(${JSON.stringify(componentId)}, () => (${authoredExpr}))`,
    `if (import.meta.hot) import.meta.hot.accept()`,
  ].join('\n')

  return { code, css: scopedCssBlocks }
}
