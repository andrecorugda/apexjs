import { createRequire } from 'node:module'
import { type AlpineDescriptor, parseAlpineFile, scopeCss } from '@apex-stack/kit'
import { type Plugin, transformWithEsbuild } from 'vite'
import { compileAlpine } from './compile.js'
import { computeIds } from './ids.js'

// acorn ships with Vite (via rollup) — resolve it from Vite's location so it needn't be a
// direct dep. Null if unavailable → we fall back to the full client body (current behavior).
let acornCache:
  | {
      parse: (
        src: string,
        opts: unknown,
      ) => { body: Array<{ type: string; start: number; end: number }> }
    }
  | null
  | undefined
function getAcorn() {
  if (acornCache !== undefined) return acornCache
  try {
    acornCache = createRequire(import.meta.resolve('vite'))('acorn')
  } catch {
    acornCache = null
  }
  return acornCache
}

// The top-level statement kinds a page's `<script client>` may contribute to SSR: imports and
// declarations `rootData()` might reference. Everything else (expression statements, timers,
// event wiring) is a client-only side effect and must NOT run during server-side eval (#53).
const SSR_KEEP = new Set([
  'ImportDeclaration',
  'VariableDeclaration',
  'FunctionDeclaration',
  'ClassDeclaration',
])

/** Strip client-only side effects from a `<script client>` body for the SSR module, keeping
 * only imports + declarations. Falls back to the full body if TS transpile or parse fails. */
async function hoistClientDeclarations(ts: string, filePath: string): Promise<string> {
  try {
    const acorn = getAcorn()
    if (!acorn) return ts
    const js = (await transformWithEsbuild(ts, filePath, { loader: 'ts' })).code
    const ast = acorn.parse(js, { ecmaVersion: 'latest', sourceType: 'module' })
    return ast.body
      .filter((n) => SSR_KEEP.has(n.type))
      .map((n) => js.slice(n.start, n.end))
      .join('\n')
  } catch {
    return ts
  }
}

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

/** Everything that, when unchanged, makes an edit style-only (→ scoped-CSS hot swap). */
function structuralKey(d: AlpineDescriptor): string {
  return JSON.stringify([
    d.template?.content ?? '',
    d.template?.attrs ?? {},
    d.script?.content ?? '',
    d.clientScript?.content ?? '',
  ])
}

/**
 * The parts that, when changed, make a morph UNSAFE and force a full reload: the
 * root `x-data` expression (it compiles into the `Alpine.data` factory) and the
 * server/client scripts (loader + composables). When these are unchanged but the
 * template markup changed, the edit is a safe, morphable template-only edit.
 */
function reloadKey(d: AlpineDescriptor): string {
  return JSON.stringify([
    d.template?.attrs?.['x-data'] ?? '',
    d.script?.content ?? '',
    d.clientScript?.content ?? '',
  ])
}

/** The non-`x-data` root `<template>` attributes (x-init, x-effect, @events, …),
 *  carried in the morph payload so the rebuilt root keeps them (mirrors SSR). */
function rootAttrsOf(d: AlpineDescriptor): Record<string, string> {
  const attrs = { ...(d.template?.attrs ?? {}) }
  delete attrs['x-data']
  return attrs
}

interface StructureSnapshot {
  /** Style-only detection key (template + all attrs + scripts). */
  structural: string
  /** Morph-safety key (x-data + scripts); unchanged ⇒ a template edit is morphable. */
  reload: string
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
 * reload, state + scroll preserved) via a custom `apex:css` event. A template
 * markup edit (root x-data + scripts unchanged) ships the new markup via an
 * `apex:template` event and the client MORPHS the live DOM in place (fine-grained
 * HMR — Alpine state, form input and scroll preserved), see #20. Only an unsafe
 * change — root `x-data` shape or a `<script>` body — still triggers a full reload.
 */
export function apex(options: ApexPluginOptions = {}): Plugin {
  const clientRuntime = options.clientRuntime ?? '@apex-stack/kit/client'
  // Last-seen structure per file, so a hot update can classify an edit as
  // style-only, template-markup-only, or a full-reload change. Set on every transform.
  const structure = new Map<string, StructureSnapshot>()

  return {
    name: 'apexjs',
    async transform(code, id, transformOptions) {
      // Skip Vite virtual modules (\0-prefixed, e.g. html-proxy blocks).
      if (id.includes('\0')) return
      // Match the real file, ignoring any query suffix (?import, ?v=, …).
      const filePath = id.split('?', 1)[0] as string
      if (!filePath.endsWith('.alpine')) return

      const descriptor = parseAlpineFile(code, filePath)
      structure.set(filePath, {
        structural: structuralKey(descriptor),
        reload: reloadKey(descriptor),
      })
      const ssr = transformOptions?.ssr === true
      // For SSR, hand compileAlpine a declarations-only client body so client-only side
      // effects don't run during server eval (they still ship in the client module). #53
      const clientBody = descriptor.clientScript?.content?.trim()
      const ssrClientCode =
        ssr && clientBody ? await hoistClientDeclarations(clientBody, filePath) : undefined
      const { code: generated } = compileAlpine(descriptor, filePath, {
        ssr,
        clientRuntime,
        ssrClientCode,
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

      // Islands pages carry no HMR listener, so any custom event is dropped there —
      // always full-reload. Otherwise classify the edit against the last snapshot.
      if (!options.fullReloadOnly) {
        try {
          const next = parseAlpineFile(await ctx.read(), ctx.file)
          const prev = structure.get(ctx.file)
          if (prev !== undefined) {
            const { componentId, scopeId } = computeIds(ctx.file)

            // Style-only edit → swap the scoped CSS in place, no reload.
            if (prev.structural === structuralKey(next)) {
              ctx.server.ws.send({
                type: 'custom',
                event: 'apex:css',
                data: { scopeId, css: scopedCssOf(next, scopeId) },
              })
              return []
            }

            // Template-markup-only edit (root x-data + scripts unchanged) → ship the new
            // markup and let the client morph the live DOM in place, preserving Alpine
            // state (#20). A changed x-data/script falls through to a full reload.
            if (prev.reload === reloadKey(next)) {
              ctx.server.ws.send({
                type: 'custom',
                event: 'apex:template',
                data: {
                  componentId,
                  scopeId,
                  template: next.template?.content ?? '',
                  rootAttrs: rootAttrsOf(next),
                },
              })
              return []
            }
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
