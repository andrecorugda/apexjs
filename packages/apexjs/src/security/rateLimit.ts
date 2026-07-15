// A tiny fixed-window rate limiter — pure and clock-injectable so it's testable and
// deployable anywhere. Default store is in-memory (per process); pass a shared `store`
// (any KvStore — Redis, Cloudflare KV, …) for a GLOBAL counter across instances in
// distributed/serverless setups. Apply it in middleware or in front of `/api` + `/mcp`.
import { getRequestIP, type H3Event } from 'h3'
import type { KvStore } from './kvStore.js'

export interface RateLimitOptions {
  /** Max requests allowed per window. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
  /** Wall clock (injectable for tests). */
  now?: () => number
}

export interface RateLimiter {
  /** Returns true if this key is allowed to proceed; false if it's over the limit. */
  allow(key: string): boolean
  /** Milliseconds until the key's window resets (0 if not seen). */
  retryAfter(key: string): number
}

/** The store-backed variant: the same surface, async (the store is async). */
export interface AsyncRateLimiter {
  /** Resolves true if this key is allowed to proceed; false if it's over the limit. */
  allow(key: string): Promise<boolean>
  /** Milliseconds until the key's window resets (0 when under the limit). */
  retryAfter(key: string): Promise<number>
}

/** Create an in-memory fixed-window limiter (per process). */
export function createRateLimiter(opts: RateLimitOptions): RateLimiter
/**
 * Create a store-backed fixed-window limiter — one global counter shared by every instance
 * that uses the same store. Windows are epoch-aligned (`floor(now / windowMs)`), so all
 * instances agree on the window regardless of when each first saw the key.
 */
export function createRateLimiter(opts: RateLimitOptions & { store: KvStore }): AsyncRateLimiter
export function createRateLimiter(
  opts: RateLimitOptions & { store?: KvStore },
): RateLimiter | AsyncRateLimiter {
  const now = opts.now ?? (() => Date.now())

  if (opts.store) {
    const store = opts.store
    const bucketKey = (key: string, t: number) => `rl:${key}:${Math.floor(t / opts.windowMs)}`
    return {
      async allow(key) {
        // TTL = windowMs is enough: a bucket key created at any point inside its window is
        // dead at most windowMs later (the store's incr must not extend TTL on increment).
        return (await store.incr(bucketKey(key, now()), opts.windowMs)) <= opts.limit
      },
      async retryAfter(key) {
        const t = now()
        const count = Number((await store.get(bucketKey(key, t))) ?? 0)
        if (count < opts.limit) return 0
        // Time until the epoch-aligned window rolls over — identical on every instance.
        return (Math.floor(t / opts.windowMs) + 1) * opts.windowMs - t
      },
    } satisfies AsyncRateLimiter
  }

  const hits = new Map<string, { count: number; reset: number }>()
  return {
    allow(key) {
      const t = now()
      const entry = hits.get(key)
      if (!entry || t >= entry.reset) {
        hits.set(key, { count: 1, reset: t + opts.windowMs })
        return true
      }
      if (entry.count >= opts.limit) return false
      entry.count++
      return true
    },
    retryAfter(key) {
      const entry = hits.get(key)
      const t = now()
      return entry && entry.reset > t ? entry.reset - t : 0
    },
  }
}

/** Key a limiter by client IP for an h3 event (fallback to a constant). */
export function rateLimitKey(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
}
