/**
 * @apex-stack/kit/client — fine-grained (DOM-morphing) HMR receiver.
 *
 * Symmetric to the scoped-CSS hot-swap the `@apex-stack/vite` plugin already does:
 * a style-only edit ships `apex:css` and swaps the `<style>` in place; a TEMPLATE
 * edit ships `apex:template` (the new markup) and this module MORPHS the live DOM
 * subtree to it — no page reload, so open dropdowns, form input and scroll survive.
 *
 * A root `x-data` / `<script>` change is unsafe to morph (the Alpine.data factory or
 * loader changed), so the plugin sends a `full-reload` for those instead — this
 * receiver only ever sees markup-only edits.
 */
import { type MorphOptions, morphView } from '../morph.js'

/** Payload the vite plugin sends over the WS for a `.alpine` template edit. */
export interface TemplatePatch {
  /** Stable component id, e.g. `c0` — matches the live root's `data-apex-root`. */
  componentId: string
  /** Scoped-CSS attribute name, e.g. `data-apex-a1b2c3`. */
  scopeId: string
  /** The new inner HTML of the SFC's top-level `<template>`. */
  template: string
  /** Root `<template>`'s directive attributes other than x-data (x-init, @events, …). */
  rootAttrs?: Record<string, string>
}

/**
 * Build the new root element for a component from a template patch, mirroring the
 * SSR root wrapper (`renderComponent`): a `<div x-data="apex_<id>"
 * data-apex-root="<id>" [scopeId] [rootAttrs…]>` hosting the template content, with
 * the scope attribute stamped on every descendant so scoped CSS keeps matching.
 * Returned detached — the caller morphs the live root into it.
 */
export function buildRootElement(patch: TemplatePatch, doc: Document = document): HTMLElement {
  const root = doc.createElement('div')
  root.setAttribute('x-data', `apex_${patch.componentId}`)
  root.setAttribute('data-apex-root', patch.componentId)
  root.setAttribute(patch.scopeId, '')
  for (const [k, v] of Object.entries(patch.rootAttrs ?? {})) {
    if (k !== 'x-data') root.setAttribute(k, v)
  }
  root.innerHTML = patch.template
  stampScope(root, patch.scopeId)
  return root
}

/** Stamp `scopeId` on every descendant element, stopping at nested component
 *  boundaries (each embedded component owns its own scope) — mirrors SSR. */
function stampScope(el: Element, scopeId: string): void {
  for (const child of Array.from(el.children)) {
    if (child.hasAttribute('data-apex-component')) continue
    child.setAttribute(scopeId, '')
    stampScope(child, scopeId)
  }
}

/**
 * Apply a template patch: morph every live root for the component to the new markup,
 * preserving Alpine state. Returns the number of roots patched (0 → nothing on the
 * page yet; the caller may choose to fall back to a reload).
 */
export function applyTemplatePatch(patch: TemplatePatch, opts: MorphOptions = {}): number {
  const roots = document.querySelectorAll(`[data-apex-root="${patch.componentId}"]`)
  roots.forEach((root) => {
    const doc = root.ownerDocument ?? document
    morphView(root, buildRootElement(patch, doc), opts)
  })
  return roots.length
}

/** Minimal shape of Vite's `import.meta.hot` we rely on (kit doesn't depend on vite). */
interface ViteHotApi {
  on(event: string, cb: (data: unknown) => void): void
}

/**
 * Wire the `apex:template` WS event to {@link applyTemplatePatch}. Dev-only: guarded
 * by `import.meta.hot`, which Vite strips from production builds. Idempotent — only
 * the first call registers a listener even though every page imports the runtime.
 *
 * NOTE: real end-to-end verification of the morph needs a browser + running dev
 * server (out of scope for the unit tests); the DOM-level morph logic above is what
 * the unit tests exercise under jsdom.
 */
export function installTemplateHmr(): void {
  const hot = (import.meta as unknown as { hot?: ViteHotApi }).hot
  if (!hot || typeof window === 'undefined') return
  const w = window as unknown as { __apexTemplateHmr?: boolean }
  if (w.__apexTemplateHmr) return
  w.__apexTemplateHmr = true
  hot.on('apex:template', (data) => {
    applyTemplatePatch(data as TemplatePatch)
  })
}
