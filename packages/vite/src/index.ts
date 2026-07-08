import { type AlpineDescriptor, parseAlpineFile, scopeCss } from '@apex-stack/kit'
import { type Plugin, transformWithEsbuild } from 'vite'
import { compileAlpine } from './compile.js'
import { computeIds } from './ids.js'

// Match `.alpine`, tolerating Vite's query suffixes (?import, ?v=, ?t=, …).
export interface ApexPluginOptions {
  /**
   * The module specifier the generated client module imports the runtime from.
   * Defaults to `@apex-stack/kit/client`; the `apexjs` CLI overrides this to
   * `@apex-stack/core/client` so user apps only need `@apex-stack/core` installed.
   */
  clientRuntime?: string
  /**
   * Always full-reload on `.alpine` edits, disabling the style-only hot swap.
   * The islands dev server sets this — islands pages carry no HMR listener, so
   * a css-only event would be silently dropped there.
   */
  fullReloadOnly?: boolean
}

/** The parts of a descriptor that force a reload when they change. */
function structuralKey(d: AlpineDescriptor): string {
  return JSON.stringify([
    d.template?.content ?? '',
    d.template?.attrs ?? {},
    d.script?.content ?? '',
    d.clientScript?.content ?? '',
  ])
}

/** The scoped CSS for a descriptor (same computation the compiler uses). */
function scopedCssOf(d: AlpineDescriptor, scopeId: string): string {
  return d.styles.map((s) => (s.scoped ? scopeCss(s.content, scopeId) : s.content)).join('\n')
}

/**
 * Vite plugin for Apex JS `.alpine` single-file components.
 *
 * Emits an SSR module or a client module for each `.alpine` file depending on
 * Vite's per-request `ssr` flag, then runs the result through esbuild so any
 * TypeScript in the `<script server>` block is transpiled.
 *
 * HMR: a style-only edit hot-swaps the component's scoped CSS in place (no
 * reload, state + scroll preserved) via a custom `apex:css` event the client
 * runtime listens for. Template/script edits still full-reload (the client
 * saves + restores scroll around it); fine-grained template patching is a
 * later milestone.
 */
export function apex(options: ApexPluginOptions = {}): Plugin {
  const clientRuntime = options.clientRuntime ?? '@apex-stack/kit/client'
  // Last-seen structure per file, so a hot update can tell "style-only edit"
  // from "template/script edit". Populated on every transform.
  const structure = new Map<string, string>()

  return {
    name: 'apexjs',
    async transform(code, id, transformOptions) {
      // Skip Vite virtual modules (\0-prefixed, e.g. html-proxy blocks).
      if (id.includes('\0')) return
      // Match the real file, ignoring any query suffix (?import, ?v=, …).
      const filePath = id.split('?', 1)[0] as string
      if (!filePath.endsWith('.alpine')) return

      const descriptor = parseAlpineFile(code, filePath)
      structure.set(filePath, structuralKey(descriptor))
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
    async handleHotUpdate(ctx) {
      if (!ctx.file.endsWith('.alpine')) return
      // Invalidate the module (both client and SSR representations) so the next
      // `ssrLoadModule` recompiles the changed file instead of returning the
      // stale cached module — otherwise a reload re-renders old HTML.
      const { moduleGraph } = ctx.server
      for (const mod of moduleGraph.getModulesByFile(ctx.file) ?? []) {
        moduleGraph.invalidateModule(mod)
      }

      // Style-only edit → swap the scoped CSS in place, no reload. Falls back
      // to a full reload on parse errors or when the structure changed.
      if (!options.fullReloadOnly) {
        try {
          const next = parseAlpineFile(await ctx.read(), ctx.file)
          const prev = structure.get(ctx.file)
          if (prev !== undefined && prev === structuralKey(next)) {
            const { scopeId } = computeIds(ctx.file)
            ctx.server.ws.send({
              type: 'custom',
              event: 'apex:css',
              data: { scopeId, css: scopedCssOf(next, scopeId) },
            })
            return []
          }
        } catch {
          // fall through to full reload
        }
      }

      ctx.server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}

export default apex
