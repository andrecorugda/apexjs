// End-to-end: mount the real API + MCP handlers over an h3 app on a live port and
// drive them with actual HTTP requests, proving the gate enforces over the wire
// (identity resolved from headers, 401/403, per-user MCP tool visibility).
import { createServer, type Server } from 'node:http'
import { createApp, toNodeListener } from 'h3'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { defineApexRoute } from '../api/defineRoute.js'
import { type ApiEntry, createApiHandler, expandApiModule } from '../api/routes.js'
import { createMcpHandler } from '../mcp/server.js'
import { defineAuth } from './define.js'

// A test auth resolver: `x-user` header → identity. `admin` gets the admin role.
const auth = defineAuth({
  resolve({ headers }) {
    const name = headers['x-user']
    if (!name) return null
    return { id: name, role: name === 'admin' ? 'admin' : 'user' }
  },
})

function entries(): ApiEntry[] {
  const pub = defineApexRoute({ mcp: true, handler: () => ({ ok: 'public' }) })
  const secret = defineApexRoute({ auth: true, mcp: true, handler: ({ user }) => ({ me: user }) })
  const adminOnly = defineApexRoute({
    method: 'POST',
    auth: true,
    can: ({ user }) => (user as { role?: string } | null)?.role === 'admin',
    input: { note: z.string() },
    mcp: true,
    handler: ({ input }) => ({ did: (input as { note: string }).note }),
  })
  // Input-dependent gate: visible at list time (can't decide without input), but
  // re-checked at call time — the defense-in-depth path.
  const guarded = defineApexRoute({
    auth: true,
    input: { allow: z.boolean() },
    can: ({ input }) => (input as { allow: boolean }).allow === true,
    mcp: true,
    handler: () => ({ ok: true }),
  })
  return [
    ...expandApiModule('pub', pub),
    ...expandApiModule('secret', secret),
    ...expandApiModule('adminOnly', adminOnly),
    ...expandApiModule('guarded', guarded),
  ]
}

let server: Server
let base: string

beforeAll(async () => {
  const app = createApp()
  const table = entries()
  app.use('/api', createApiHandler(table, { public: {} }, auth))
  app.use('/mcp', createMcpHandler(table, { public: {} }, auth))
  server = createServer(toNodeListener(app))
  await new Promise<void>((r) => server.listen(0, r))
  const addr = server.address()
  const port = typeof addr === 'object' && addr ? addr.port : 0
  base = `http://127.0.0.1:${port}`
})

afterAll(() => new Promise<void>((r) => server.close(() => r())))

describe('REST auth gate (over HTTP)', () => {
  it('allows a public route for anyone', async () => {
    const res = await fetch(`${base}/api/pub`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: 'public' })
  })

  it('401s an auth route for anonymous, 200 + user for authenticated', async () => {
    expect((await fetch(`${base}/api/secret`)).status).toBe(401)
    const res = await fetch(`${base}/api/secret`, { headers: { 'x-user': 'ada' } })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ me: { id: 'ada', role: 'user' } })
  })

  it('403s a can()-gated route for the wrong role, 200 for admin', async () => {
    const body = JSON.stringify({ note: 'boom' })
    const headers = (u?: string) => ({
      'content-type': 'application/json',
      ...(u ? { 'x-user': u } : {}),
    })
    expect(
      (await fetch(`${base}/api/adminOnly`, { method: 'POST', headers: headers('ada'), body }))
        .status,
    ).toBe(403)
    expect(
      (await fetch(`${base}/api/adminOnly`, { method: 'POST', headers: headers(), body })).status,
    ).toBe(401)
    const ok = await fetch(`${base}/api/adminOnly`, {
      method: 'POST',
      headers: headers('admin'),
      body,
    })
    expect(ok.status).toBe(200)
    expect(await ok.json()).toEqual({ did: 'boom' })
  })
})

// Drive the MCP endpoint with a real JSON-RPC initialize → tools/list sequence.
async function rpc(
  method: string,
  params: unknown,
  user?: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...(user ? { 'x-user': user } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const json = (await res.json()) as { result?: Record<string, unknown> }
  return json.result ?? {}
}

const INIT = {
  protocolVersion: '2025-06-18',
  capabilities: {},
  clientInfo: { name: 't', version: '0' },
}

async function toolNames(user?: string): Promise<string[]> {
  await rpc('initialize', INIT, user)
  const result = await rpc('tools/list', {}, user)
  return ((result.tools as Array<{ name: string }>) ?? []).map((t) => t.name)
}

describe('MCP tools/list is filtered per-user (over HTTP)', () => {
  it('hides auth/role tools from anonymous callers', async () => {
    const names = await toolNames()
    expect(names).toContain('pub')
    expect(names).not.toContain('secret')
    expect(names).not.toContain('adminOnly')
  })

  it('shows auth tools to a user but hides the admin-only tool', async () => {
    const names = await toolNames('ada')
    expect(names).toContain('pub')
    expect(names).toContain('secret')
    expect(names).not.toContain('adminOnly')
  })

  it('shows the admin-only tool to an admin', async () => {
    const names = await toolNames('admin')
    expect(names).toEqual(expect.arrayContaining(['pub', 'secret', 'adminOnly', 'guarded']))
  })

  it('re-checks at tools/call: a visible tool is refused when call-time input fails can()', async () => {
    await rpc('initialize', INIT, 'ada')
    const denied = await rpc('tools/call', { name: 'guarded', arguments: { allow: false } }, 'ada')
    expect(denied.isError).toBe(true)
    expect(JSON.stringify(denied.content)).toContain('Access denied')

    await rpc('initialize', INIT, 'ada')
    const ok = await rpc('tools/call', { name: 'guarded', arguments: { allow: true } }, 'ada')
    expect(ok.isError).toBeFalsy()
    const text = (ok.content as Array<{ text: string }>)[0]?.text ?? '{}'
    expect(JSON.parse(text)).toEqual({ ok: true })
  })
})
