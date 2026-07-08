// End-to-end sealed-session flow over real HTTP: an anonymous request is 401, a
// login writes a sealed cookie, and a follow-up request bearing that cookie is
// authenticated — proving encrypt/sign round-trips and sessionAuth resolves it.
import { createServer, type Server } from 'node:http'
import { createApp, defineEventHandler, readBody, toNodeListener } from 'h3'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { defineApexRoute } from '../api/defineRoute.js'
import { createApiHandler, expandApiModule } from '../api/routes.js'
import { login, logout, sessionAuth } from './session.js'

const PASSWORD = 'test-password-at-least-32-characters-long!!'
const auth = sessionAuth({ password: PASSWORD })

let server: Server
let base: string

beforeAll(async () => {
  const app = createApp()
  // Login/logout as plain h3 routes (they set/clear the sealed cookie).
  app.use(
    '/login',
    defineEventHandler(async (event) => {
      const body = (await readBody(event)) as { id: string }
      await login(event, { user: { id: body.id } }, { password: PASSWORD })
      return { ok: true }
    }),
  )
  app.use(
    '/logout',
    defineEventHandler(async (event) => {
      await logout(event, { password: PASSWORD })
      return { ok: true }
    }),
  )
  const me = defineApexRoute({ auth: true, handler: ({ user }) => user })
  app.use('/api', createApiHandler(expandApiModule('me', me), { public: {} }, auth))
  server = createServer(toNodeListener(app))
  await new Promise<void>((r) => server.listen(0, r))
  const addr = server.address()
  base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`
})

afterAll(() => new Promise<void>((r) => server.close(() => r())))

describe('sealed-cookie session', () => {
  it('401 anonymous → login sets a sealed cookie → authenticated', async () => {
    expect((await fetch(`${base}/api/me`)).status).toBe(401)

    const res = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'ada' }),
    })
    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).toContain('apex-session=')
    expect(cookie.toLowerCase()).toContain('httponly')

    const authed = await fetch(`${base}/api/me`, {
      headers: { cookie: cookie.split(';')[0] ?? '' },
    })
    expect(authed.status).toBe(200)
    expect(await authed.json()).toEqual({ id: 'ada' })
  })

  it('does not authenticate with a tampered cookie', async () => {
    const tampered = await fetch(`${base}/api/me`, {
      headers: { cookie: 'apex-session=not-a-valid-sealed-value' },
    })
    expect(tampered.status).toBe(401)
  })
})
