// A tiny async key/value store with TTL — the shared primitive behind API idempotency and the
// store-backed rate limiter (#49). The in-memory default keeps single-process apps zero-config;
// pass a shared implementation (Redis, Cloudflare KV, a DB table) for multi-instance deployments.
// Named KvStore — NOT `Store` — so it can't be confused with the client-side `defineStore`/
// `ApexStore` (global state) exported from the main entry.

export interface KvStore {
  /** The stored value, or null when absent/expired. */
  get(key: string): Promise<string | null>
  /** Store a value with a time-to-live. Overwrites the value AND the TTL. */
  set(key: string, value: string, ttlMs: number): Promise<void>
  /**
   * Atomically increment a counter and return the new count. The TTL applies only when the
   * increment CREATES the key — later increments must not extend it (fixed windows depend on
   * this). Adapter guidance: Redis `INCR` + `PEXPIRE key ttl NX` (or expire only when the
   * result is 1). Incrementing a key previously `set` to a numeric string continues from it.
   */
  incr(key: string, ttlMs: number): Promise<number>
  /** Remove a key (optional; used to release locks early instead of waiting out the TTL). */
  delete?(key: string): Promise<void>
}

export interface MemoryStoreOptions {
  /** Wall clock (injectable for tests). */
  now?: () => number
}

/**
 * The built-in in-memory {@link KvStore} — per process, zero config. Expired entries are
 * evicted lazily on read, so the map never grows past the live working set. For serverless or
 * multi-instance deployments, provide a shared store instead.
 */
export function createMemoryStore(opts: MemoryStoreOptions = {}): KvStore {
  const now = opts.now ?? (() => Date.now())
  const entries = new Map<string, { value: string; expires: number }>()

  /** The live entry for a key, evicting it when expired. */
  const live = (key: string) => {
    const entry = entries.get(key)
    if (!entry) return undefined
    if (now() >= entry.expires) {
      entries.delete(key)
      return undefined
    }
    return entry
  }

  return {
    async get(key) {
      return live(key)?.value ?? null
    },
    async set(key, value, ttlMs) {
      entries.set(key, { value, expires: now() + ttlMs })
    },
    async incr(key, ttlMs) {
      const entry = live(key)
      if (!entry) {
        entries.set(key, { value: '1', expires: now() + ttlMs })
        return 1
      }
      const next = Number(entry.value) + 1 // continues from a numeric `set` value
      entry.value = String(next) // TTL only on create — do not extend
      return next
    },
    async delete(key) {
      entries.delete(key)
    },
  }
}
