// The disk-backed cache driver: one JSON file per key under `dir`. It lazy-imports
// `node:fs/promises` INSIDE each method so this module has no top-level `node:` import — the
// memory cache path (which statically imports this file via ./cache.ts) stays on-device safe.
import type { CacheDriver, CacheEntry } from './cache.js'

/**
 * Map an arbitrary cache key to a filesystem-safe basename. FNV-1a (32-bit) keeps it short and
 * deterministic; the length prefix further shrinks the already-tiny collision space for cache use.
 */
function hashKey(key: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `${key.length.toString(36)}-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

/**
 * Create a file-backed {@link CacheDriver}. Entries are JSON files under `dir` (created on first
 * write). Reads honor the stored TTL and delete the file on expiry. `now` is the injectable clock.
 */
export function createFileDriver(dir: string, now: () => number): CacheDriver {
  const pathFor = (key: string) => `${dir}/${hashKey(key)}.json`

  return {
    async read(key) {
      const fs = await import('node:fs/promises')
      const path = pathFor(key)
      let raw: string
      try {
        raw = await fs.readFile(path, 'utf8')
      } catch {
        return undefined // absent
      }
      let entry: CacheEntry
      try {
        entry = JSON.parse(raw) as CacheEntry
      } catch {
        await fs.rm(path, { force: true }) // corrupt file — drop it
        return undefined
      }
      if (entry.expires !== null && now() >= entry.expires) {
        await fs.rm(path, { force: true }) // lazy eviction
        return undefined
      }
      return entry
    },
    async write(key, entry) {
      const fs = await import('node:fs/promises')
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(pathFor(key), JSON.stringify(entry), 'utf8')
    },
    async remove(key) {
      const fs = await import('node:fs/promises')
      await fs.rm(pathFor(key), { force: true })
    },
    async clear() {
      const fs = await import('node:fs/promises')
      await fs.rm(dir, { recursive: true, force: true })
    },
  }
}
