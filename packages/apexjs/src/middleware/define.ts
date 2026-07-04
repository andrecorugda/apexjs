// Route middleware — runs on every request before the page/API handler. Use it
// to attach request-scoped state (`ctx.locals`, read by loaders + route handlers)
// or to redirect. This module is client-safe (no node:fs); the loader/runner live
// in ./run.ts.
import type { RuntimeConfig } from '../config/runtime.js'

/** The short-circuit value returned by `ctx.redirect(...)`. */
export interface MiddlewareResult {
  readonly __apexRedirect: true
  to: string
  status: number
}

export interface MiddlewareContext {
  /** Request path (e.g. `/blog/hello`). Use it to scope a middleware to certain routes. */
  url: string
  /** HTTP method. */
  method: string
  /** Resolved runtime config (private + public on the server). */
  config: RuntimeConfig
  /** Request headers, lowercased keys. */
  headers: Record<string, string>
  /**
   * Mutable, request-scoped state. Whatever a middleware puts here is handed to
   * the page `loader({ locals })` and every route handler (`{ locals }`) — the
   * seam for attaching an authenticated user, a request id, feature flags, etc.
   */
  locals: Record<string, unknown>
  /** Return this to short-circuit the request with a redirect (default 302). */
  redirect(to: string, status?: number): MiddlewareResult
}

// A middleware returns a redirect to short-circuit, or nothing to continue.
// biome-ignore lint/suspicious/noConfusingVoidType: "nothing" (void) is a valid, intentional return here
type MiddlewareReturn = MiddlewareResult | void
export type Middleware = (ctx: MiddlewareContext) => MiddlewareReturn | Promise<MiddlewareReturn>

/** Author a middleware. Identity function — for types + discoverability. */
export function defineMiddleware(fn: Middleware): Middleware {
  return fn
}

/** Type guard: did a middleware return a redirect? */
export function isRedirect(value: unknown): value is MiddlewareResult {
  return !!value && typeof value === 'object' && (value as MiddlewareResult).__apexRedirect === true
}
