// The single authorization decision, shared by REST (createApiHandler) and MCP
// (createMcpHandler) so both surfaces enforce one policy. Pure + client-safe.

import type { ApexUser, RouteGate } from './define.js'

/** The outcome of a gate check. `status` is the HTTP code to use for REST. */
export type AccessDecision = { ok: true } | { ok: false; status: 401 | 403; message: string }

const DENY_401: AccessDecision = { ok: false, status: 401, message: 'Authentication required' }
const DENY_403: AccessDecision = { ok: false, status: 403, message: 'Forbidden' }

/**
 * Decide whether `user` may invoke a gated route with `input`.
 *
 * - `auth: true` with no user → 401.
 * - `can(...)` returning false → 403 (or 401 if there's no user at all).
 * - At **list time** (building MCP `tools/list`) we don't yet have real input, so a
 *   `can` that throws or needs input is treated as *visible* and deferred to the
 *   call-time check — the real gate. `can` returning false for `input: undefined`
 *   (e.g. a pure role check) still omits the tool. Call time is always fail-closed.
 */
export async function checkRouteAccess(
  gate: RouteGate,
  user: ApexUser | null,
  input: unknown,
  opts?: { listTime?: boolean },
): Promise<AccessDecision> {
  if (gate.auth && !user) return DENY_401
  if (gate.can) {
    try {
      const allowed = await gate.can({ user, input })
      if (!allowed) return user ? DENY_403 : DENY_401
    } catch {
      // At list time, defer an input-dependent/throwing check to call time (show it).
      // At call time, a throwing check is a denial (fail-closed).
      if (!opts?.listTime) return user ? DENY_403 : DENY_401
    }
  }
  return { ok: true }
}
