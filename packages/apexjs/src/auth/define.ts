// Auth definitions — the client-safe half of Apex's auth system.
//
// This module is dependency-light (no `node:fs`, no h3) so it can be imported
// anywhere. The server-only resolver/loader lives in ./run.ts and is never
// bundled to the client. See docs/architecture/auth.md for the full model.

import type { RuntimeConfig } from '../config/runtime.js'

/**
 * The authenticated identity. Bring-your-own shape — Apex only cares that a
 * value is *present* (authenticated) vs `null` (anonymous). Type it yourself by
 * what your `resolve` returns; `id` is conventional but not required.
 */
export interface ApexUser {
  [key: string]: unknown
}

/** What `defineAuth.resolve` receives — everything needed to identify the request. */
export interface AuthResolveContext {
  /** Request headers, lowercased keys. */
  headers: Record<string, string>
  /** Parsed request cookies. */
  cookies: Record<string, string>
  /** The full request URL. */
  url: string
  /** HTTP method. */
  method: string
  /** Resolved runtime config (private + public on the server). */
  config: RuntimeConfig
  /**
   * The raw h3 request event (server-only, typed loosely to keep this module
   * dependency-free). Pass it to the sealed-session helpers in
   * `@apex-stack/core/server` — e.g. `sessionAuth` reads the session from it.
   */
  event: unknown
}

export interface AuthConfig {
  /**
   * Verify the request and return the caller's identity, or `null` for anonymous.
   * Runs once per request; the result is injected as `ctx.user` into every loader,
   * route handler, and MCP tool call. Bring-your-own: read a cookie/JWT/header, or
   * delegate to an adapter (Lucia / Better-Auth / Auth.js). Throwing is treated as
   * anonymous (fail-closed).
   */
  resolve: (ctx: AuthResolveContext) => ApexUser | null | Promise<ApexUser | null>
}

/**
 * Author `server/auth.ts`. Identity function — exists for types + discoverability.
 *
 * ```ts
 * export default defineAuth({
 *   async resolve({ cookies }) {
 *     return await getUserFromSession(cookies.session) // → { id, roles } | null
 *   },
 * })
 * ```
 */
export function defineAuth(config: AuthConfig): AuthConfig {
  return config
}

/** The gate a route may declare. Both are optional; absent ⇒ the route is public. */
export interface RouteGate {
  /** Require an authenticated user. Anonymous → 401 (REST) / omitted from MCP tools. */
  auth?: boolean
  /**
   * Fine-grained check evaluated with the resolved user and the (validated) input.
   * Return false → 403. Runs after `auth`. May be async. Throwing = denied
   * (fail-closed) at call time.
   */
  can?: (ctx: { user: ApexUser | null; input: unknown }) => boolean | Promise<boolean>
}
