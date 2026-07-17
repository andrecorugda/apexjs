/**
 * @apex-stack/kit — fine-grained DOM morphing for HMR.
 *
 * On a `.alpine` *template* edit the dev server ships the new markup over the WS
 * (see the `@apex-stack/vite` plugin's `handleHotUpdate`) instead of reloading the
 * page. This module patches the live DOM subtree to that new markup IN PLACE,
 * preserving Alpine component state (open dropdowns, form input, scroll position).
 *
 * Why a morph preserves state: Alpine stores a component's reactive state ON the
 * element node itself (`el._x_dataStack`, effects, listeners). A morph keeps the
 * existing element nodes and only patches their attributes/children, so an
 * un-replaced node keeps everything Alpine put on it. A full innerHTML replace
 * would throw those nodes away and reset every component.
 *
 * We use a PROVEN algorithm rather than a hand-rolled differ:
 *   - Preferred: Alpine's own `@alpinejs/morph` (`Alpine.morph`) when present — it
 *     understands Alpine directives (x-for clones, x-text ownership) natively.
 *   - Fallback: `morphdom`, with guards that keep live form-control values and run
 *     `Alpine.initTree` on genuinely new nodes so their directives bind.
 */
import morphdom from 'morphdom'

/** The subset of Alpine's global API the morph path uses (all optional). */
export interface MorphAlpine {
  /** `@alpinejs/morph`'s `Alpine.morph(el, html)` — the preferred engine when installed. */
  morph?: (from: Element, to: string | Node, options?: unknown) => void
  /** Initialize Alpine directives on a freshly-inserted subtree. */
  initTree?: (el: Element) => void
}

export interface MorphOptions {
  /** Alpine global (defaults to `window.Alpine` in the browser). */
  alpine?: MorphAlpine
}

const ELEMENT_NODE = 1

function isFormControl(
  el: Element,
): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function resolveAlpine(opts: MorphOptions): MorphAlpine | undefined {
  if (opts.alpine) return opts.alpine
  return typeof window !== 'undefined'
    ? (window as unknown as { Alpine?: MorphAlpine }).Alpine
    : undefined
}

/**
 * Morph the live element `from` into `to` (a markup string or a detached node) in
 * place, preserving Alpine state and user input.
 *
 * When `Alpine.morph` (`@alpinejs/morph`) is available it is used directly — it is
 * the most faithful, Alpine-aware patcher. Otherwise morphdom runs with two guards:
 *
 *  - **onBeforeElUpdated** — skips nodes that are already identical (keeps the node,
 *    hence its Alpine state), and for the nodes it does patch it preserves live
 *    form-control values and the text/html that Alpine reactively rendered (so a
 *    `x-text` node doesn't flash back to the un-evaluated template value).
 *  - **onNodeAdded** — a genuinely new element gets `Alpine.initTree` so its
 *    directives bind; existing nodes are never re-initialized (state kept).
 */
export function morphView(from: Element, to: string | Node, opts: MorphOptions = {}): void {
  const alpine = resolveAlpine(opts)

  if (alpine && typeof alpine.morph === 'function') {
    alpine.morph(from, to)
    return
  }

  morphdom(from, to, {
    onBeforeElUpdated(fromEl, toEl) {
      // Identical subtree → keep the existing node (and its Alpine state) untouched.
      if (fromEl.isEqualNode(toEl)) return false

      // Preserve live form-control values (what the user typed / selected) across the
      // patch: copy the live value onto the incoming node so morphdom's own input
      // handler becomes a no-op and never clobbers it back to the template default.
      if (isFormControl(fromEl) && fromEl.tagName === toEl.tagName) {
        if (
          fromEl instanceof HTMLInputElement &&
          (fromEl.type === 'checkbox' || fromEl.type === 'radio')
        ) {
          ;(toEl as HTMLInputElement).checked = fromEl.checked
        } else {
          ;(toEl as HTMLInputElement).value = (fromEl as HTMLInputElement).value
        }
      }

      // Preserve Alpine-rendered reactive content when its binding is unchanged, so the
      // node keeps the value Alpine evaluated instead of flashing to the raw template
      // expression until Alpine's next reactive tick. (Alpine.morph does this natively.)
      const xText = fromEl.getAttribute('x-text')
      if (xText !== null && xText === toEl.getAttribute('x-text')) {
        toEl.textContent = fromEl.textContent
      }
      const xHtml = fromEl.getAttribute('x-html')
      if (xHtml !== null && xHtml === toEl.getAttribute('x-html')) {
        toEl.innerHTML = fromEl.innerHTML
      }

      return true
    },
    onNodeAdded(node) {
      if (node.nodeType === ELEMENT_NODE && alpine?.initTree) alpine.initTree(node as Element)
    },
  })
}
