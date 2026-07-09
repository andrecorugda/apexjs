import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type TestApp, createTestApp } from '@apex-stack/core/testing'

// Boots the whole app in-process (server/api + server/auth.ts) against the real
// in-memory DB — no running server, no network. Exercises every backend pillar.
describe('showcase app', () => {
  let app: TestApp
  beforeAll(async () => {
    app = await createTestApp({ root: '.' })
  })
  afterAll(() => app.close())

  it('data: create + list a message via the DB-backed model resource', async () => {
    const created = await app.post('/api/messages', { author: 'Tester', body: 'hello from the test' })
    expect(created.status).toBe(200)
    const list = await app.get('/api/messages')
    expect(list.status).toBe(200)
    expect(JSON.stringify(list.body)).toContain('hello from the test')
  })

  it('auth: /api/whoami is 401 anonymous, 200 for a session user', async () => {
    expect((await app.get('/api/whoami')).status).toBe(401)
    const res = await app.get('/api/whoami', { user: { id: 'ada', name: 'Ada' } })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ user: { id: 'ada', name: 'Ada' } })
  })

  it('mcp: the model + gated route are exposed as tools', async () => {
    const tools = await app.mcp.listTools({ user: { id: 'ada', name: 'Ada' } })
    expect(tools).toContain('messages_create')
    expect(tools).toContain('whoami')
  })
})
