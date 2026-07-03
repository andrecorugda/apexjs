import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { type ApexStore, isApexStore } from '../store.js'

export interface LoadedStore {
  /** Module id for the client import, e.g. `/stores/cart.ts`. */
  id: string
  name: string
  factory: () => Record<string, unknown>
}

/** Discover and load `stores/*.ts` into a list of registered stores. */
export async function loadStores(
  root: string,
  loadModule: (id: string) => Promise<{ default?: unknown }>,
): Promise<LoadedStore[]> {
  const dir = join(root, 'stores')
  if (!existsSync(dir)) return []

  const out: LoadedStore[] = []
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts') || f.endsWith('.js'))) {
    const id = `/stores/${file}`
    const mod = await loadModule(id)
    const def = mod.default
    if (isApexStore(def)) {
      const store = def as ApexStore
      out.push({ id, name: store.name, factory: store.factory })
    }
  }
  return out
}

/** Evaluate each store's factory for its initial state (used for SSR `$store` reads). */
export function storesInitialState(stores: LoadedStore[]): Record<string, unknown> {
  const state: Record<string, unknown> = {}
  for (const s of stores) {
    try {
      state[s.name] = s.factory()
    } catch {
      state[s.name] = {}
    }
  }
  return state
}
