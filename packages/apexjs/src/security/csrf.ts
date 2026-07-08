// CSRF protection for cookie-authenticated mutations — the Next.js model: an
// Origin/Host check on unsafe methods. Requests that aren't cookie-based (bearer
// token, no cookie) can't be CSRF'd by a browser, so they're exempt.
import { getRequestHeaders, getRequestURL, type H3Event } from 'h3'

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Pure CSRF decision. A request is safe when it is a read method, OR it is not
 * cookie-authenticated (no cookie, or it carries an `Authorization` header — a
 * bearer client, not a browser form), OR its `Origin`/`Referer` host matches the
 * request `Host`. A cookie-based mutation with a missing/foreign origin is rejected.
 */
export function isCsrfSafe(input: {
  method: string
  origin?: string
  referer?: string
  host?: string
  hasCookie: boolean
  hasAuthHeader: boolean
}): boolean {
  if (!MUTATING.has(input.method.toUpperCase())) return true
  if (!input.hasCookie || input.hasAuthHeader) return true
  const source = input.origin ?? input.referer
  if (!source || !input.host) return false
  try {
    return new URL(source).host === input.host
  } catch {
    return false
  }
}

/** Enforce the CSRF check over an h3 event. Returns true if the request may proceed. */
export function checkCsrf(event: H3Event): boolean {
  const h = getRequestHeaders(event) as Record<string, string>
  return isCsrfSafe({
    method: event.method,
    origin: h.origin,
    referer: h.referer,
    host: h.host ?? getRequestURL(event).host,
    hasCookie: !!h.cookie,
    hasAuthHeader: !!h.authorization,
  })
}
