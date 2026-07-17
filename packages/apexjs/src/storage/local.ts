// The `local` driver — objects are files under a base `dir`. The zero-config default: no cloud
// account, works offline, ideal for dev and single-node apps. `url()` returns a route path served
// by the app (`/storage/<key>`), optionally HMAC-signed with an expiry (see ./signing.ts). Every
// key is resolved against the base dir and REJECTED if it escapes it — the guard against `..`
// path-traversal. Server-only (imports `node:fs`/`node:path`).
import { type Dirent, existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { normalizeKey, signedQuery } from './signing.js'
import type { LocalStorageConfig, PutOptions, Storage, StorageEntry, UrlOptions } from './types.js'

/** Thrown when a logical key resolves outside the store's base directory. */
export class StoragePathError extends Error {
  constructor(key: string) {
    super(`Storage path escapes the base directory: ${JSON.stringify(key)}`)
    this.name = 'StoragePathError'
  }
}

export function createLocalStorage(config: LocalStorageConfig): Storage {
  const baseDir = resolve(config.dir)
  const baseUrl = (config.baseUrl ?? '/storage').replace(/\/+$/, '')
  const secret = config.signingSecret

  /** Resolve a logical key to an absolute path INSIDE baseDir, or throw on traversal. */
  const resolveKey = (key: string): string => {
    const clean = normalizeKey(key)
    const abs = resolve(baseDir, clean)
    if (abs !== baseDir && !abs.startsWith(baseDir + sep)) throw new StoragePathError(key)
    return abs
  }

  const collect = async (dir: string, out: StorageEntry[]): Promise<void> => {
    let dirents: Dirent[]
    try {
      dirents = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const ent of dirents) {
      const abs = join(dir, ent.name)
      if (ent.isDirectory()) {
        await collect(abs, out)
      } else if (ent.isFile()) {
        const st = await stat(abs)
        out.push({ path: relative(baseDir, abs).split(sep).join('/'), size: st.size })
      }
    }
  }

  return {
    async put(path, data, _opts?: PutOptions) {
      const abs = resolveKey(path)
      await mkdir(dirname(abs), { recursive: true })
      const bytes = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data)
      await writeFile(abs, bytes)
    },

    async get(path) {
      const abs = resolveKey(path)
      try {
        const buf = await readFile(abs)
        return new Uint8Array(buf)
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
        throw err
      }
    },

    async getText(path) {
      const abs = resolveKey(path)
      try {
        return await readFile(abs, 'utf8')
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
        throw err
      }
    },

    async exists(path) {
      return existsSync(resolveKey(path))
    },

    async delete(path) {
      const abs = resolveKey(path)
      await rm(abs, { force: true })
    },

    async list(prefix?: string) {
      const out: StorageEntry[] = []
      await collect(baseDir, out)
      const p = prefix ? normalizeKey(prefix) : ''
      return p ? out.filter((e) => e.path.startsWith(p)) : out
    },

    async url(path, opts?: UrlOptions) {
      const key = normalizeKey(path)
      resolveKey(key) // validate — never hand out a URL for a traversing key
      const base = `${baseUrl}/${key}`
      if (!opts?.expiresInSeconds) return base
      if (!secret) {
        throw new Error('Local storage: signingSecret is required for signed (expiring) URLs')
      }
      return `${base}?${signedQuery(key, opts.expiresInSeconds, secret)}`
    },
  }
}
