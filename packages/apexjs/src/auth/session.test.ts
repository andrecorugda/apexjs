// End-to-end sealed-session flow over real HTTP, exercising the PUBLIC handler API
// (defineApexRoute handlers receive `event`): a login route writes the sealed cookie,
// a bad-credentials login returns 401, anonymous requests get no cookie, and a
// tampered cookie is rejected.
import { createServer, type Server } from 'node:http'
import { createApp, toNodeListener } from 'h3'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { defineApexRoute } from '../api/defineRoute.js'
import { createApiHandler, expandApiModule } from '../api/routes.js'
import { setStatus } from './respond.js'
import { login, logout, sessionAuth } from './session.js'

const PASSWORD = 'test-password-at-least-32-characters-long!!'
const auth = sessionAuth({ password: PASSWORD })

// Login/logout/me as real defineApexRoute handlers — the scaffold's pattern.
const loginRoute = defineApexRoute({
  method: 'POST',
  input: { user: z.string(), ok: z.boolean() },
  handler: async ({ input, event }) => {
    const { user, ok } = input as { user: string; ok: boolean }
    if (!ok) {
      setStatus(event, 401)
      return { error: 'Invalid credentials' }
    }
    await login(event, { user: { id: user } }, { password: PASSWORD })
    return { ok: true }
  },
})
const logoutRoute = defineApexRoute({
  method: 'POST',
  handler: async ({ event }) => {
    await logout(event, { password: PASSWORD })
    return { ok: true }
  },
})
const meRoute = defineApexRoute({ auth: true, handler: ({ user }) => user })

let server: Server
let base: string

beforeAll(async () => {
  const app = createApp()
  const table = [
    ...expandApiModule('login', loginRoute),
    ...expandApiModule('logout', logoutRoute),
    ...expandApiModule('me', meRoute),
  ]
  app.use('/api', createApiHandler(table, { public: {} }, auth))
  server = createServer(toNodeListener(app))
  await new Promise<void>((r) => server.listen(0, r))
  const addr = server.address()
  base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`
})

afterAll(() => new Promise<void>((r) => server.close(() => r())))

const post = (path: string, body: unknown, cookie?: string) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: base, // same-origin (real browsers always send this on POST)
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  })

describe('sealed-cookie session (public handler API)', () => {
  it('anonymous request is 401 AND gets no session cookie', async () => {
    const res = await fetch(`${base}/api/me`)
    expect(res.status).toBe(401)
    expect(res.headers.get('set-cookie')).toBeNull() // no cookie issued to anon
  })

  it('bad credentials → 401 (handler-set status is preserved)', async () => {
    const res = await post('/api/login', { user: 'ada', ok: false })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Invalid credentials' })
  })

  it('login writes an HttpOnly, SameSite=Lax sealed cookie → authenticated', async () => {
    const res = await post('/api/login', { user: 'ada', ok: true })
    expect(res.status).toBe(200)
    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).toContain('apex-session=')
    expect(cookie.toLowerCase()).toContain('httponly')
    expect(cookie.toLowerCase()).toContain('samesite=lax')

    const authed = await fetch(`${base}/api/me`, {
      headers: { cookie: cookie.split(';')[0] ?? '' },
    })
    expect(authed.status).toBe(200)
    expect(await authed.json()).toEqual({ id: 'ada' })
  })

  it('does not authenticate with a tampered cookie', async () => {
    const res = await fetch(`${base}/api/me`, {
      headers: { cookie: 'apex-session=not-a-valid-sealed-value' },
    })
    expect(res.status).toBe(401)
  })

  it('logout clears the cookie', async () => {
    const login = await post('/api/login', { user: 'ada', ok: true })
    const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
    const res = await post('/api/logout', {}, cookie)
    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie') ?? '').toContain('apex-session=')
  })
})
