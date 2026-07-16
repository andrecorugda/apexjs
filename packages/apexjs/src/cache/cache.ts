// A small async cache subsystem for hot reads (dashboards, computed aggregates, API responses).
// Two drivers: `memory` (default — an in-process Map with lazy TTL eviction) and `file` (one JSON
// file per key under a dir). The factory + interface + config-object shape mirrors the security
// primitives (see security/kvStore.ts, security/rateLimit.ts).
//
// On-device safe: this module has NO top-level `node:` import, so the `memory` path runs on a bare
// JS engine (QuickJS et al.). The `file` driver lives in ./fileDriver.ts and lazy-imports
// `node:fs/promises` inside its methods — importing that module never pulls fs in at load time.

import { createFileDriver } from './fileDriver.js'

/**
 * A stored cache record. `expires` is an absolute epoch-ms deadline, or `null` for no expiry.
 * The driver owns eviction: `read` returns `undefined` for a missing OR expired key.
 */
export interface CacheEntry {
  value: unknown
  expires: number | null
}

/**
 * The raw storage backend behind a {@link Cache}. Keys map to {@link CacheEntry} records; TTL is
 * expressed as the absolute `expires` deadline so the driver only needs the wall clock to evict.
 * Implement this to add a backend (Redis, KV, …) — the {@link Cache} surface wraps it unchanged.
 */
export interface CacheDriver {
  /** The live entry for a key, or `undefined` when absent/expired (expired entries are evicted). */
  read(key: string): Promise<CacheEntry | undefined>
  /** Store (or overwrite) an entry, value AND deadline. */
  write(key: string, entry: CacheEntry): Promise<void>
  /** Remove a single key (no-op if absent). */
  remove(key: string): Promise<void>
  /** Remove every key. */
  clear(): Promise<void>
}

/**
 * The cache surface. All operations are async so one API covers both the synchronous memory Map
 * and the disk-backed file driver. A `tags([...])` view is itself a `Cache` whose `flush()` is
 * scoped to those tags — see {@link Cache.tags}.
 */
export interface Cache {
  /** The stored value for a key, or `undefined` when absent/expired. */
  get<T>(key: string): Promise<T | undefined>
  /** Store a value. `ttlSeconds` omitted ⇒ no expiry; overwrites value AND TTL. */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  /** True when a live (unexpired) entry exists for the key. */
  has(key: string): Promise<boolean>
  /** Remove a single key. */
  delete(key: string): Promise<void>
  /** Remove every key in this scope — the whole cache, or only the tagged keys on a tag view. */
  flush(): Promise<void>
  /**
   * Get-or-compute: return the cached value if present, otherwise run `factory`, store its result
   * under `key` (with `ttlSeconds`, omit/undefined ⇒ no expiry), and return it. The factory runs
   * at most once per miss.
   */
  remember<T>(key: string, ttlSeconds: number | undefined, factory: () => T | Promise<T>): Promise<T>
  /**
   * A scoped view over the same storage. Values `set` through the view are associated with the
   * given tag names; calling `flush()` on the view invalidates ONLY the keys written under those
   * tags, leaving every other key (and other tags) intact. Nesting merges tag names.
   */
  tags(names: string[]): Cache
}

/** Config for {@link createCache}. `memory` is the default; `file` needs a `dir`. */
export type CacheConfig =
  | { driver?: 'memory'; now?: () => number }
  | { driver: 'file'; dir: string; now?: () => number }

/**
 * The built-in in-memory {@link CacheDriver} — per process, zero config. Expired entries are
 * evicted lazily on read, so the map never grows past the live working set.
 */
export function createMemoryDriver(now: () => number): CacheDriver {
  const entries = new Map<string, CacheEntry>()
  return {
    async read(key) {
      const entry = entries.get(key)
      if (!entry) return undefined
      if (entry.expires !== null && now() >= entry.expires) {
        entries.delete(key) // lazy eviction
        return undefined
      }
      return entry
    },
    async write(key, entry) {
      entries.set(key, entry)
    },
    async remove(key) {
      entries.delete(key)
    },
    async clear() {
      entries.clear()
    },
  }
}

/** Build the {@link Cache} surface over a driver, carrying the tag index and the active tag set. */
function makeCache(
  driver: CacheDriver,
  now: () => number,
  tagIndex: Map<string, Set<string>>,
  activeTags: readonly string[],
): Cache {
  const self: Cache = {
    async get<T>(key: string): Promise<T | undefined> {
      const entry = await driver.read(key)
      return entry === undefined ? undefined : (entry.value as T)
    },
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
      const expires = ttlSeconds === undefined ? null : now() + ttlSeconds * 1000
      await driver.write(key, { value, expires })
      for (const tag of activeTags) {
        let keys = tagIndex.get(tag)
        if (!keys) {
          keys = new Set<string>()
          tagIndex.set(tag, keys)
        }
        keys.add(key)
      }
    },
    async has(key: string): Promise<boolean> {
      return (await driver.read(key)) !== undefined
    },
    async delete(key: string): Promise<void> {
      await driver.remove(key)
    },
    async flush(): Promise<void> {
      if (activeTags.length === 0) {
        await driver.clear()
        tagIndex.clear()
        return
      }
      for (const tag of activeTags) {
        const keys = tagIndex.get(tag)
        if (!keys) continue
        for (const key of keys) await driver.remove(key)
        tagIndex.delete(tag)
      }
    },
    async remember<T>(
      key: string,
      ttlSeconds: number | undefined,
      factory: () => T | Promise<T>,
    ): Promise<T> {
      const existing = await driver.read(key)
      if (existing !== undefined) return existing.value as T
      const value = await factory() // runs only on a miss
      await self.set(key, value, ttlSeconds) // registers tags when this is a tag view
      return value
    },
    tags(names: string[]): Cache {
      return makeCache(driver, now, tagIndex, [...activeTags, ...names])
    },
  }
  return self
}

/**
 * Create a {@link Cache}. `{ driver: 'memory' }` (the default) is in-process and on-device safe;
 * `{ driver: 'file', dir }` persists one JSON file per key under `dir`. Pass `now` to inject the
 * clock in tests.
 */
export function createCache(config: CacheConfig = { driver: 'memory' }): Cache {
  const now = config.now ?? (() => Date.now())
  const driver =
    config.driver === 'file' ? createFileDriver(config.dir, now) : createMemoryDriver(now)
  return makeCache(driver, now, new Map<string, Set<string>>(), [])
}
