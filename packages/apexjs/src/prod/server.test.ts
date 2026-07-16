// Production-server reliability tests (#25) — boots createProdApp from a hand-written
// dist fixture (manifest + dependency-free .mjs modules), so the prod path (health, error
// boundary, request log, hooks) is exercised end-to-end without a Vite build.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { toNodeListener } from 'h3'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { ApexServerHooks, ErrorContext, RequestLogEntry } from '../hooks/define.js'
import { createProdApp } from './server.js'

const PAGE_MJS = `export const loader = () => ({ n: 1 })
export const template = '<p x-text="n"></p>'
export const rootXData = '{ n: 0 }'
export const componentId = 'apex_p1'
export const scopeId = 'x1'
export const css = ''
`

const BOOM_PAGE_MJS = `export const loader = () => { throw new Error('SECRET page detail') }
export const template = '<p>never</p>'
export const rootXData = null
export const componentId = 'apex_p2'
export const scopeId = 'x2'
export const css = ''
`

const API_MJS = `export default {
  method: 'GET',
  description: 'boom',
  mcp: false,
  handler: () => { const e = new Error('SECRET api detail'); e.cause = new Error('no such table: things'); throw e },
}
`

function writeFixture(): string {
  const dist = mkdtempSync(join(tmpdir(), 'apex-prod-'))
  mkdirSync(join(dist, 'server'), { recursive: true })
  writeFileSync(join(dist, 'server', 'page.mjs'), PAGE_MJS)
  writeFileSync(join(dist, 'server', 'boom-page.mjs'), BOOM_PAGE_MJS)
  writeFileSync(join(dist, 'server', 'api-boom.mjs'), API_MJS)
  const manifest = {
    islands: false,
    routes: [
      {
        pageId: '/pages/index.alpine',
        pattern: '/',
        segments: [],
        isDynamic: false,
        serverFile: 'page.mjs',
      },
      {
        pageId: '/pages/boom.alpine',
        pattern: '/boom',
        segments: [{ literal: 'boom' }],
        isDynamic: false,
        serverFile: 'boom-page.mjs',
      },
    ],
    components: {},
    api: [{ name: 'boom', serverFile: 'api-boom.mjs' }],
    runtimeConfig: { public: {} },
  }
  writeFileSync(join(dist, 'apex-manifest.json'), JSON.stringify(manifest, null, 2))
  return dist
}

describe('createProdApp — reliability (#25)', () => {
  let dist: string
  let server: Server
  let base: string
  const requests: RequestLogEntry[] = []
  const errors: Array<{ error: unknown; ctx: ErrorContext }> = []
  const hooks: ApexServerHooks = {
    onRequest: (entry) => requests.push(entry),
    onError: (error, ctx) => errors.push({ error, ctx }),
  }

  beforeAll(async () => {
    dist = writeFixture()
    const app = await createProdApp({ dir: dist, hooks })
    server = createServer(toNodeListener(app))
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
    const addr = server.address()
    base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`
  })
  afterAll(() => {
    server.closeAllConnections()
    server.close()
    rmSync(dist, { recursive: true, force: true })
  })

  it('GET /health and /healthz return 200 with status + uptime', async () => {
    for (const path of ['/health', '/healthz']) {
      const res = await fetch(`${base}${path}`)
      expect(res.status).toBe(200)
      const body = (await res.json()) as { status: string; uptime: number }
      expect(body.status).toBe('ok')
      expect(body.uptime).toBeGreaterThan(0)
    }
  })

  it('a page renders (fixture sanity) and is not browser-cacheable', async () => {
    const res = await fetch(`${base}/`)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<p')
    // SSR HTML embeds per-request/session data → must not be cached (else stale after edits).
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  it('an API 500 is generic to the client; the hook gets the full detail', async () => {
    errors.length = 0
    const res = await fetch(`${base}/api/boom`)
    expect(res.status).toBe(500)
    const body = await res.text()
    expect(JSON.parse(body)).toEqual({ error: 'Internal server error' })
    expect(body).not.toContain('SECRET') // no message leak
    expect(body).not.toContain('no such table') // no cause leak
    expect(body).not.toContain('apex migrate') // no hint leak
    // …but the observability hook received everything.
    const reported = errors.find((e) => e.ctx.kind === 'api')
    expect(reported).toBeTruthy()
    expect((reported?.error as Error | undefined)?.message).toContain('SECRET api detail')
  })

  it('a throwing page loader leaks neither message nor stack; hook gets kind=page', async () => {
    errors.length = 0
    const res = await fetch(`${base}/boom`)
    expect(res.status).toBeGreaterThanOrEqual(500)
    const body = await res.text()
    expect(body).not.toContain('SECRET page detail')
    expect(body).not.toContain('at ') // no stack frames
    const reported = errors.find((e) => e.ctx.kind === 'page')
    expect(reported).toBeTruthy()
    expect((reported?.error as Error | undefined)?.message).toContain('SECRET page detail')
  })

  it('onRequest receives {time, method, path, status, ms} and skips health probes', async () => {
    requests.length = 0
    await fetch(`${base}/`)
    await fetch(`${base}/health`)
    expect(requests).toHaveLength(1) // /health skipped
    const entry = requests[0] as RequestLogEntry
    expect(entry.method).toBe('GET')
    expect(entry.path).toBe('/')
    expect(entry.status).toBe(200)
    expect(entry.ms).toBeGreaterThanOrEqual(0)
    expect(new Date(entry.time).getTime()).toBeGreaterThan(0)
  })
})
