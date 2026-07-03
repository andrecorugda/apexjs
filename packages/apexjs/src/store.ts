// Apex global store — the Pinia / Nuxt-useState equivalent, Alpine-native.
//
// This module is intentionally dependency-free so it is safe to import in the
// BROWSER (store files load on both server and client). Keep it that way.

export type StoreState = Record<string, unknown>

export interface ApexStore {
  readonly __apexStore: true
  readonly name: string
  readonly factory: () => StoreState
}

/**
 * Define a global, SSR-safe store shared across every page, component, and island.
 *
 * ```ts
 * // stores/cart.ts
 * import { defineStore } from '@apex-stack/core'
 * export default defineStore('cart', () => ({
 *   items: [] as string[],
 *   get count() { return this.items.length },
 *   add(x: string) { this.items.push(x) },
 * }))
 * ```
 *
 * Access it anywhere as `$store.cart` — `$store.cart.count` renders on the server
 * and stays reactive after hydration.
 */
export function defineStore(name: string, factory: () => StoreState): ApexStore {
  if (!name || /[^a-zA-Z0-9_$]/.test(name)) {
    throw new Error(`defineStore: invalid store name "${name}" — use letters, digits, _ or $.`)
  }
  return { __apexStore: true, name, factory }
}

export function isApexStore(x: unknown): x is ApexStore {
  return typeof x === 'object' && x !== null && (x as { __apexStore?: unknown }).__apexStore === true
}
