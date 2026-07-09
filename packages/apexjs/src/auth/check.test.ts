import { describe, expect, it } from 'vitest'
import { checkRouteAccess } from './check.js'
import type { RouteGate } from './define.js'

const user = { id: 1, roles: ['user'] }
const admin = { id: 2, roles: ['admin'] }

describe('checkRouteAccess', () => {
  it('allows an ungated route for anyone (public)', async () => {
    expect(await checkRouteAccess({}, null, {})).toEqual({ ok: true })
    expect(await checkRouteAccess({}, user, {})).toEqual({ ok: true })
  })

  it('401s an auth-gated route for an anonymous caller', async () => {
    const d = await checkRouteAccess({ auth: true }, null, {})
    expect(d).toEqual({ ok: false, status: 401, message: 'Authentication required' })
  })

  it('allows an auth-gated route for any authenticated caller', async () => {
    expect(await checkRouteAccess({ auth: true }, user, {})).toEqual({ ok: true })
  })

  it('403s when can() returns false for a present user', async () => {
    const gate: RouteGate = { auth: true, can: ({ user }) => !!user?.roles && false }
    const d = await checkRouteAccess(gate, user, {})
    expect(d).toEqual({ ok: false, status: 403, message: 'Forbidden' })
  })

  it('allows when can() returns true', async () => {
    const gate: RouteGate = { can: ({ user }) => (user?.roles as string[])?.includes('admin') }
    expect(await checkRouteAccess(gate, admin, {})).toEqual({ ok: true })
  })

  it('401s (not 403) when can() fails and there is no user', async () => {
    const gate: RouteGate = { can: () => false }
    const d = await checkRouteAccess(gate, null, {})
    expect(d).toEqual({ ok: false, status: 401, message: 'Authentication required' })
  })

  it('awaits an async can()', async () => {
    const gate: RouteGate = { can: async ({ input }) => (input as { ok: boolean }).ok }
    expect(await checkRouteAccess(gate, user, { ok: true })).toEqual({ ok: true })
    expect((await checkRouteAccess(gate, user, { ok: false })).ok).toBe(false)
  })

  it('is fail-closed at call time when can() throws', async () => {
    const gate: RouteGate = {
      can: ({ input }) => (input as { x: { y: number } }).x.y > 0, // throws on missing input.x
    }
    const d = await checkRouteAccess(gate, user, {})
    expect(d.ok).toBe(false)
    expect((d as { status: number }).status).toBe(403)
  })

  it('defers a throwing/input-dependent can() to call time at list time (stays visible)', async () => {
    const gate: RouteGate = { can: ({ input }) => (input as { x: number }).x > 0 }
    // undefined input would throw; list-time treats that as visible (deferred).
    expect(await checkRouteAccess(gate, user, undefined, { listTime: true })).toEqual({ ok: true })
  })

  it('still omits at list time when a pure role check returns false', async () => {
    const gate: RouteGate = {
      can: ({ user }) => ((user?.roles ?? []) as string[]).includes('admin'),
    }
    const d = await checkRouteAccess(gate, user, undefined, { listTime: true })
    expect(d.ok).toBe(false)
  })

  it('omits an auth-gated tool at list time for an anonymous caller', async () => {
    const d = await checkRouteAccess({ auth: true }, null, undefined, { listTime: true })
    expect(d.ok).toBe(false)
  })
})
