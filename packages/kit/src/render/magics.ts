import type { ScopeLayer } from './scope.js'

/**
 * The bottom scope layer providing Alpine "magic" properties during SSR.
 *
 * Only the magics that make sense before hydration are real; the rest are
 * inert stubs so an expression referencing them doesn't crash the render. Their
 * live behavior is restored by real Alpine in the browser.
 */
export function createMagics(el: unknown, idCounter: { n: number }): ScopeLayer {
  return {
    // `$el` is the element currently being rendered — works naturally.
    $el: el,
    // Deterministic id stub (Alpine's $id). Deterministic keeps SSR stable.
    $id: (name: string) => `${name}-ssr-${idCounter.n++}`,
    // Inert during SSR — no event loop, no reactivity yet.
    $refs: {},
    $dispatch: () => {},
    $nextTick: (cb?: () => void) => {
      if (typeof cb === 'function') cb()
    },
    $watch: () => {},
    // Not supported in Phase 0 — surfaces a clear error rather than undefined.
    get $store(): never {
      throw new Error('$store is not supported during SSR in Apex JS Phase 0')
    },
  }
}
