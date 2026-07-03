import { parseAlpineFile } from '@apexjs/kit'
import { type Plugin, transformWithEsbuild } from 'vite'
import { compileAlpine } from './compile.js'

const ALPINE_RE = /\.alpine$/

export interface ApexPluginOptions {
  /** File extension handled by the plugin. Defaults to `.alpine`. */
  include?: RegExp
}

/**
 * Vite plugin for Apex JS `.alpine` single-file components.
 *
 * Emits an SSR module or a client module for each `.alpine` file depending on
 * Vite's per-request `ssr` flag, then runs the result through esbuild so any
 * TypeScript in the `<script server>` block is transpiled. A `.alpine` edit
 * triggers a full reload in dev (fine-grained template patching is a later
 * milestone).
 */
export function apex(options: ApexPluginOptions = {}): Plugin {
  const include = options.include ?? ALPINE_RE

  return {
    name: 'apexjs',
    async transform(code, id, transformOptions) {
      if (!include.test(id)) return
      const descriptor = parseAlpineFile(code, id)
      const { code: generated } = compileAlpine(descriptor, id, {
        ssr: transformOptions?.ssr === true,
      })
      // Transpile any TS (loader body / authored x-data) to JS.
      const result = await transformWithEsbuild(generated, id, {
        loader: 'ts',
        sourcemap: true,
      })
      return { code: result.code, map: result.map }
    },
    handleHotUpdate(ctx) {
      if (!include.test(ctx.file)) return
      ctx.server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}

export default apex
