/**
 * A layered scope stack, mirroring Alpine's `mergeProxies`.
 *
 * Alpine merges multiple data objects (component data, x-for item scope, magics)
 * into a single proxy where property reads walk the layers top-down and `has`
 * reports true only if some layer owns the key. We reproduce that so the `with`
 * block in the evaluator resolves identifiers exactly like Alpine does in the
 * browser: the top layer (innermost x-for scope) shadows outer layers, and any
 * identifier NOT owned by a layer falls through to the surrounding scope.
 *
 * During SSR "the surrounding scope" is Node's global scope. That is intentional
 * and safe: shared globals like `String`, `Math`, `Object`, `JSON` behave
 * identically in Node and the browser, so an expression like `String(post.title)`
 * or `Math.max(a, b)` yields the same value on both sides — preserving the
 * no-flash hydration guarantee. Genuinely browser-only globals (`window`,
 * `document`) simply throw a ReferenceError, which the evaluator catches; such
 * references belong in client-only directives, not server-rendered ones.
 */
export type ScopeLayer = Record<PropertyKey, unknown>

export function createScopeProxy(layers: ScopeLayer[]): Record<PropertyKey, unknown> {
  // Highest-priority layer last, so we search from the end.
  const ordered = layers

  const findOwner = (key: PropertyKey): ScopeLayer | undefined => {
    for (let i = ordered.length - 1; i >= 0; i--) {
      const layer = ordered[i]
      if (layer && key in layer) return layer
    }
    return undefined
  }

  return new Proxy(
    {},
    {
      get(_t, key) {
        const owner = findOwner(key)
        return owner ? owner[key] : undefined
      },
      set(_t, key, value) {
        // Writes land on the owning layer, or the top layer if brand new —
        // matches Alpine's behavior where `count++` mutates component data.
        const owner = findOwner(key) ?? ordered[ordered.length - 1]
        if (owner) owner[key] = value
        return true
      },
      has(_t, key) {
        // Symbols (notably Symbol.unscopables, which `with` probes) must fall
        // through, never be claimed by the scope.
        if (typeof key === 'symbol') return false
        return findOwner(key) !== undefined
      },
      // Enumeration traps mirror Alpine's `mergeProxies`, so `{...state}`,
      // `Object.keys(state)` and `for (k in state)` see the merged layers during
      // SSR expression evaluation (without them the underlying empty target is
      // enumerated → nothing). Own enumerable string keys only, matching Alpine's
      // `Object.keys(i)`-based union.
      ownKeys() {
        const keys = new Set<string>()
        for (const layer of ordered) {
          if (!layer) continue
          for (const k of Object.keys(layer)) keys.add(k)
        }
        return Array.from(keys)
      },
      getOwnPropertyDescriptor(_t, key) {
        // Search top-down so the descriptor matches what `get` returns.
        for (let i = ordered.length - 1; i >= 0; i--) {
          const layer = ordered[i]
          if (layer && Object.hasOwn(layer, key)) {
            const desc = Object.getOwnPropertyDescriptor(layer, key)
            // The proxy target is an empty `{}` that lacks this key, so the
            // descriptor MUST be configurable or the invariant check throws.
            if (desc) desc.configurable = true
            return desc
          }
        }
        return undefined
      },
    },
  )
}

/** Push a new layer on top of existing ones, returning a fresh stack. */
export function withLayer(layers: ScopeLayer[], layer: ScopeLayer): ScopeLayer[] {
  return [...layers, layer]
}
