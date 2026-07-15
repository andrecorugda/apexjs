// #25 — the API/MCP error boundary: raw error messages only reach clients when
// `exposeErrors` is explicitly on (dev/tests); the default is the safe generic body.
import { createServer, type Server } from 'node:http'
import { createApp, toNodeListener } from 'h3'
import { afterAll, describe, expect, it } from 'vitest'
import { defineApexRoute } from './defineRoute.js'
import {
  type ApiEntry,
  type ApiHandlerOptions,
  createApiHandler,
  expandApiModule,
} from './routes.js'

function entries(): ApiEntry[] {
  const boom = defineApexRoute({
    handler: () => {
      const e = new Error('SECRET detail')
      ;(e as { cause?: unknown }).cause = new Error('no such table: things')
      throw e
    },
  })
  return [...expandApiModule('boom', boom)]
}

const servers: Server[] = []
afterAll(() => {
  for (const s of servers) {
    s.closeAllConnections()
    s.close()
  }
})

async function boot(opts?: ApiHandlerOptions): Promise<string> {
  const app = createApp()
  app.use('/api', createApiHandler(entries(), { public: {} }, undefined, opts))
  const server = createServer(toNodeListener(app))
  servers.push(server)
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  const addr = server.address()
  return `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`
}

describe('API error boundary (#25)', () => {
  it('defaults (opts unset) to the generic body — fail-safe', async () => {
    const base = await boot()
    const res = await fetch(`${base}/api/boom`)
    expect(res.status).toBe(500)
    const text = await res.text()
    expect(JSON.parse(text)).toEqual({ error: 'Internal server error' })
    expect(text).not.toContain('SECRET')
  })

  it('exposeErrors: true returns the real message + cause + migrate hint (dev/tests)', async () => {
    const base = await boot({ exposeErrors: true })
    const res = await fetch(`${base}/api/boom`)
    expect(res.status).toBe(500)
    const body = (await res.json()) as { error: string; hint?: string }
    expect(body.error).toContain('SECRET detail')
    expect(body.error).toContain('no such table: things')
    expect(body.hint).toContain('apex migrate')
  })

  it('onError receives the original error with kind/path/method', async () => {
    const seen: Array<{ error: unknown; ctx: { kind: string; path: string; method: string } }> = []
    const base = await boot({ onError: (error, ctx) => seen.push({ error, ctx }) })
    await fetch(`${base}/api/boom`)
    expect(seen).toHaveLength(1)
    expect((seen[0]?.error as Error | undefined)?.message).toBe('SECRET detail')
    expect(seen[0]?.ctx).toEqual({ kind: 'api', path: '/api/boom', method: 'GET' })
  })
})
