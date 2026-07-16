// h3 wiring for the production hardening layers — the glue between the pure config
// (./config.ts) and the built server (../prod/server.ts). Each factory returns an h3
// EventHandler that either short-circuits (429 / preflight 204) or sets headers and
// falls through (returns undefined → h3 continues to the next handler).
import {
  defineEventHandler,
  type EventHandler,
  getRequestHeader,
  getRequestURL,
  type H3Event,
  setResponseHeader,
  setResponseStatus,
} from 'h3'
import { hstsHeaderValue, type ResolvedSecurity } from './config.js'
import { applySecurityHeaders } from './headers.js'
import type { KvStore } from './kvStore.js'
import {
  type AsyncRateLimiter,
  createRateLimiter,
  type RateLimiter,
  rateLimitKey,
} from './rateLimit.js'

/** Minimal HTML-entity escape — kills reflected-XSS when echoing request-derived text. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** A best-effort URL-decode that never throws on a malformed sequence. */
export function safeDecode(input: string): string {
  try {
    return decodeURIComponent(input)
  } catch {
    return input
  }
}

/** A per-request id. Prefers WebCrypto's randomUUID; falls back on bare engines without it. */
export function generateRequestId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (c?.randomUUID) return c.randomUUID()
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** True when the path is served by the `/api` or `/mcp` surfaces (rate-limit + CORS scope). */
function isApiOrMcp(path: string): boolean {
  return path.startsWith('/api') || path === '/mcp' || path.startsWith('/mcp/')
}

/**
 * Request-id middleware: honor an inbound `x-request-id` (trace propagation, length-capped),
 * else mint one; stash it on `event.context.apexRequestId` and echo it in the response.
 */
export function requestIdHandler(): EventHandler {
  return defineEventHandler((event) => {
    const inbound = getRequestHeader(event, 'x-request-id')
    const id =
      inbound && inbound.length > 0 && inbound.length <= 200 ? inbound : generateRequestId()
    event.context.apexRequestId = id
    setResponseHeader(event, 'x-request-id', id)
    return undefined
  })
}

/** Security-headers middleware — applied to EVERY response (nosniff, frame-deny, CSP, +HSTS in prod). */
export function securityHeadersHandler(sec: ResolvedSecurity, isProd: boolean): EventHandler {
  const extra: Record<string, string> = { ...sec.headers.extra }
  if (sec.headers.contentSecurityPolicy) {
    extra['Content-Security-Policy'] = sec.headers.contentSecurityPolicy
  }
  // HSTS only makes sense over HTTPS — production only, never in dev/tests.
  const hsts = isProd ? hstsHeaderValue(sec.headers.hsts) : ''
  if (hsts) extra['Strict-Transport-Security'] = hsts
  return defineEventHandler((event) => {
    applySecurityHeaders(event, extra)
    return undefined
  })
}

/**
 * Rate-limit middleware in front of `/api` + `/mcp`. IP-keyed, fixed-window, two buckets:
 * a general bucket and a stricter one for auth/login paths. In-memory + single-process by
 * default; pass a shared {@link KvStore} for a global counter across instances.
 */
export function rateLimitHandler(sec: ResolvedSecurity, store?: KvStore): EventHandler {
  const rl = sec.rateLimit
  const make = (limit: number, windowMs: number): RateLimiter | AsyncRateLimiter =>
    store ? createRateLimiter({ limit, windowMs, store }) : createRateLimiter({ limit, windowMs })
  const general = make(rl.limit, rl.windowMs)
  const auth = make(rl.authLimit, rl.authWindowMs)

  return defineEventHandler(async (event) => {
    const path = getRequestURL(event).pathname
    if (!isApiOrMcp(path)) return undefined
    const isAuth = rl.authPaths.some((p) => path.startsWith(p))
    const limiter = isAuth ? auth : general
    const key = `${isAuth ? 'auth' : 'api'}:${rateLimitKey(event)}`
    const allowed = await Promise.resolve(limiter.allow(key))
    if (allowed) return undefined
    const retryMs = await Promise.resolve(limiter.retryAfter(key))
    setResponseHeader(event, 'Retry-After', Math.max(1, Math.ceil(retryMs / 1000)))
    setResponseStatus(event, 429)
    return { error: 'Too many requests' }
  })
}

/**
 * Deny-by-default CORS for `/api` + `/mcp`. Mount only when `cors.enabled`. Echoes an allowed
 * origin (or `*`), handles the preflight `OPTIONS` (204), and never sets a header for a
 * disallowed origin — so the browser blocks the cross-origin read.
 */
export function corsHandler(sec: ResolvedSecurity): EventHandler {
  const c = sec.cors
  const allowAny = c.origins.includes('*')
  return defineEventHandler((event) => {
    const path = getRequestURL(event).pathname
    if (!isApiOrMcp(path)) return undefined
    const origin = getRequestHeader(event, 'origin')
    const allowed = !!origin && (allowAny || c.origins.includes(origin))
    if (allowed) {
      // With credentials, `*` is illegal — always echo the concrete origin.
      setResponseHeader(
        event,
        'Access-Control-Allow-Origin',
        allowAny && !c.credentials ? '*' : origin,
      )
      setResponseHeader(event, 'Vary', 'Origin')
      if (c.credentials) setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
    }
    if (event.method === 'OPTIONS') {
      if (allowed) {
        setResponseHeader(event, 'Access-Control-Allow-Methods', c.methods.join(', '))
        setResponseHeader(event, 'Access-Control-Allow-Headers', c.headers.join(', '))
        setResponseHeader(event, 'Access-Control-Max-Age', c.maxAge)
      }
      setResponseStatus(event, 204)
      return ''
    }
    return undefined
  })
}

/** True when the request declares a body larger than `maxBytes` via `Content-Length`. */
export function bodyExceedsLimit(event: H3Event, maxBytes: number): boolean {
  const cl = getRequestHeader(event, 'content-length')
  if (cl === undefined) return false
  const n = Number(cl)
  return Number.isFinite(n) && n > maxBytes
}
