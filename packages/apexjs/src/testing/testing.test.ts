import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { defineApexRoute } from '../api/defineRoute.js'
import { type ApiEntry, expandApiModule } from '../api/routes.js'
import { createTestApp, type TestApp } from './index.js'

function entries(): ApiEntry[] {
  const pub = defineApexRoute({ mcp: true, handler: () => ({ ok: true }) })
  const whoami = defineApexRoute({ auth: true, mcp: true, handler: ({ user }) => user })
  const echo = defineApexRoute({
    method: 'POST',
    input: { msg: z.string() },
    handler: ({ input }) => ({ echo: (input as { msg: string }).msg }),
  })
  return [
    ...expandApiModule('pub', pub),
    ...expandApiModule('whoami', whoami),
    ...expandApiModule('echo', echo),
  ]
}

let app: TestApp

beforeAll(async () => {
  app = await createTestApp({ entries: entries() })
})
afterAll(() => app.close())

describe('createTestApp — REST', () => {
  it('GETs a public route', async () => {
    const res = await app.get('/api/pub')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('injects a user with { user } to pass auth: true (401 anonymous)', async () => {
    expect((await app.get('/api/whoami')).status).toBe(401)
    const res = await app.get('/api/whoami', { user: { id: 'ada', role: 'user' } })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: 'ada', role: 'user' })
  })

  it('POSTs a JSON body', async () => {
    const res = await app.post('/api/echo', { msg: 'hi' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ echo: 'hi' })
  })
})

describe('createTestApp — MCP', () => {
  it('lists tools per-user (anonymous omits auth-gated tools)', async () => {
    expect(await app.mcp.listTools()).not.toContain('whoami')
    expect(await app.mcp.listTools({ user: { id: 'ada' } })).toEqual(
      expect.arrayContaining(['pub', 'whoami']),
    )
  })

  it('calls a tool as a user', async () => {
    const res = await app.mcp.call('whoami', {}, { user: { id: 'ada' } })
    expect(res.isError).toBeFalsy()
    expect(JSON.parse(res.content?.[0]?.text ?? '{}')).toEqual({ id: 'ada' })
  })
})
