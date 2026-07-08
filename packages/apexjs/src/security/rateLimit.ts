// A tiny fixed-window rate limiter — pure and clock-injectable so it's testable and
// deployable anywhere. Default store is in-memory (per process); pass your own `now`
// (and, later, a shared store) for distributed setups. Apply it in middleware or in
// front of `/api` + `/mcp`.
import { getRequestIP, type H3Event } from 'h3'

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

/** Create an in-memory fixed-window limiter. */
export function createRateLimiter(opts: RateLimitOptions): RateLimiter {
  const hits = new Map<string, { count: number; reset: number }>()
  const now = opts.now ?? (() => Date.now())
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
