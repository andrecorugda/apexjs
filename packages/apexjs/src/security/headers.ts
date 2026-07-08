// Sensible security response headers. Opt-in: call `applySecurityHeaders(event)` in
// middleware (or per response). Kept conservative so it won't break apps out of the box
// — a strict CSP is app-specific, so it's left for you to add via `extra`.
import { type H3Event, setResponseHeader } from 'h3'

/** The default header set (merge/override via `extra`). */
export function securityHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-DNS-Prefetch-Control': 'off',
    ...extra,
  }
}

/** Apply the default (plus any `extra`) security headers to an h3 response. */
export function applySecurityHeaders(event: H3Event, extra?: Record<string, string>): void {
  for (const [key, value] of Object.entries(securityHeaders(extra))) {
    setResponseHeader(event, key, value)
  }
}
