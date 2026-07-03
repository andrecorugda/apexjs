import { parseAlpineFile } from 'apexjs-kit'
import { type Plugin, transformWithEsbuild } from 'vite'
import { compileAlpine } from './compile.js'

// Match `.alpine`, tolerating Vite's query suffixes (?import, ?v=, ?t=, …).
export interface ApexPluginOptions {
  /**
   * The module specifier the generated client module imports the runtime from.
   * Defaults to `apexjs-kit/client`; the `apexjs` CLI overrides this to
   * `apexjs-core/client` so user apps only need `apexjs-core` installed.
   */
  clientRuntime?: string
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
  const clientRuntime = options.clientRuntime ?? 'apexjs-kit/client'

  return {
    name: 'apexjs',
    async transform(code, id, transformOptions) {
      // Skip Vite virtual modules (\0-prefixed, e.g. html-proxy blocks).
      if (id.includes('\0')) return
      // Match the real file, ignoring any query suffix (?import, ?v=, …).
      const filePath = id.split('?', 1)[0] as string
      if (!filePath.endsWith('.alpine')) return

      const descriptor = parseAlpineFile(code, filePath)
      const { code: generated } = compileAlpine(descriptor, filePath, {
        ssr: transformOptions?.ssr === true,
        clientRuntime,
      })
      // Transpile any TS (loader body / authored x-data) to JS. Use the clean
      // file path as the esbuild filename — a queried id can carry null bytes.
      const result = await transformWithEsbuild(generated, filePath, {
        loader: 'ts',
        sourcemap: true,
      })
      return { code: result.code, map: result.map }
    },
    handleHotUpdate(ctx) {
      if (!ctx.file.endsWith('.alpine')) return
      // Invalidate the module (both client and SSR representations) so the next
      // `ssrLoadModule` recompiles the changed file instead of returning the
      // stale cached module — otherwise the full reload below re-renders old HTML.
      const { moduleGraph } = ctx.server
      for (const mod of moduleGraph.getModulesByFile(ctx.file) ?? []) {
        moduleGraph.invalidateModule(mod)
      }
      ctx.server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}

export default apex
