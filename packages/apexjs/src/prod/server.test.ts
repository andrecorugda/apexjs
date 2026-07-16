// Production-server reliability + hardening tests — boots createProdApp from a hand-written
// dist fixture (manifest + dependency-free .mjs modules), so the prod path (health, error
// boundary, request log, hooks, security layers) is exercised end-to-end without a Vite build.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp, defineEventHandler, toNodeListener, toWebHandler } from 'h3'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../auth/password.js'
import { login } from '../auth/session.js'
import type { ApexServerHooks, ErrorContext, RequestLogEntry } from '../hooks/define.js'
import { resolveSecurityConfig } from '../security/config.js'
import { createProdApp, startProdServer } from './server.js'

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

// A POST route that echoes its parsed body — exercises the body-size cap + CORS.
const ECHO_MJS = `export default {
  method: 'POST',
  description: 'echo',
  mcp: false,
  handler: (ctx) => ({ ok: true, got: ctx.input }),
}
`

// A POST /api/login route — the stricter rate-limit bucket.
const LOGIN_MJS = `export default {
  method: 'POST',
  description: 'login',
  mcp: false,
  handler: () => ({ ok: true }),
}
`

interface FixtureOpts {
  security?: Record<string, unknown>
  /** Add the POST /api/echo + /api/login routes. */
  extraApi?: boolean
}

function writeFixture(opts: FixtureOpts = {}): string {
  const dist = mkdtempSync(join(tmpdir(), 'apex-prod-'))
  mkdirSync(join(dist, 'server'), { recursive: true })
  writeFileSync(join(dist, 'server', 'page.mjs'), PAGE_MJS)
  writeFileSync(join(dist, 'server', 'boom-page.mjs'), BOOM_PAGE_MJS)
  writeFileSync(join(dist, 'server', 'api-boom.mjs'), API_MJS)
  const api = [{ name: 'boom', serverFile: 'api-boom.mjs' }]
  if (opts.extraApi) {
    writeFileSync(join(dist, 'server', 'echo.mjs'), ECHO_MJS)
    writeFileSync(join(dist, 'server', 'login.mjs'), LOGIN_MJS)
    api.push({ name: 'echo', serverFile: 'echo.mjs' }, { name: 'login', serverFile: 'login.mjs' })
  }
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
    api,
    runtimeConfig: { public: {}, ...(opts.security ? { security: opts.security } : {}) },
  }
  writeFileSync(join(dist, 'apex-manifest.json'), JSON.stringify(manifest, null, 2))
  return dist
}

async function boot(
  fixtureOpts: FixtureOpts,
  hooks?: ApexServerHooks,
): Promise<{ dist: string; server: Server; base: string }> {
  const dist = writeFixture(fixtureOpts)
  const app = await createProdApp({ dir: dist, ...(hooks ? { hooks } : {}) })
  const server = createServer(toNodeListener(app))
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  const addr = server.address()
  const base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`
  return { dist, server, base }
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

  // --- Track 4 hardening (defaults) ---

  it('applies default security headers to every response', async () => {
    const res = await fetch(`${base}/`)
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN')
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'")
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
    // HSTS is production-only — absent in this (non-prod) test env.
    expect(res.headers.get('strict-transport-security')).toBeNull()
  })

  it('echoes a per-request id and threads it into the request-log entry', async () => {
    requests.length = 0
    const res = await fetch(`${base}/`)
    const id = res.headers.get('x-request-id')
    expect(id).toBeTruthy()
    const entry = requests[0] as RequestLogEntry & { requestId?: string }
    expect(entry.requestId).toBe(id)
  })

  it('honors an inbound x-request-id (trace propagation)', async () => {
    const res = await fetch(`${base}/`, { headers: { 'x-request-id': 'trace-abc-123' } })
    expect(res.headers.get('x-request-id')).toBe('trace-abc-123')
  })

  it('HTML-escapes the reflected path in the 404 body (no reflected XSS)', async () => {
    const res = await fetch(`${base}/%3Cscript%3Ealert(1)%3C%2Fscript%3E`)
    expect(res.status).toBe(404)
    const body = await res.text()
    expect(body).not.toContain('<script>')
    expect(body).toContain('&lt;script&gt;')
  })
})

describe('createProdApp — rate limiting', () => {
  let dist: string
  let server: Server
  let base: string
  beforeAll(async () => {
    ;({ dist, server, base } = await boot({
      extraApi: true,
      security: { rateLimit: { limit: 2, authLimit: 2 } },
    }))
  })
  afterAll(() => {
    server.closeAllConnections()
    server.close()
    rmSync(dist, { recursive: true, force: true })
  })

  it('429s the general /api bucket past the limit, with Retry-After', async () => {
    // limit=2 → the 3rd request in the window is rejected.
    await fetch(`${base}/api/boom`)
    await fetch(`${base}/api/boom`)
    const res = await fetch(`${base}/api/boom`)
    expect(res.status).toBe(429)
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThanOrEqual(1)
    expect((await res.json()).error).toBe('Too many requests')
  })

  it('uses a separate stricter bucket for /api/login', async () => {
    // The auth bucket is independent of the (already-exhausted) general bucket.
    await fetch(`${base}/api/login`, { method: 'POST', body: '{}' })
    await fetch(`${base}/api/login`, { method: 'POST', body: '{}' })
    const res = await fetch(`${base}/api/login`, { method: 'POST', body: '{}' })
    expect(res.status).toBe(429)
  })

  it('does not rate-limit non-API paths', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${base}/`)
      expect(res.status).toBe(200)
    }
  })
})

describe('createProdApp — body-size cap + CORS', () => {
  let dist: string
  let server: Server
  let base: string
  beforeAll(async () => {
    ;({ dist, server, base } = await boot({
      extraApi: true,
      security: {
        bodyLimitBytes: 50,
        rateLimit: { limit: 1000 },
        cors: { enabled: true, origins: ['https://good.example'] },
      },
    }))
  })
  afterAll(() => {
    server.closeAllConnections()
    server.close()
    rmSync(dist, { recursive: true, force: true })
  })

  it('accepts a small body (200) but rejects an oversized one (413)', async () => {
    const small = await fetch(`${base}/api/echo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ a: 1 }),
    })
    expect(small.status).toBe(200)
    const big = await fetch(`${base}/api/echo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ a: 'x'.repeat(200) }),
    })
    expect(big.status).toBe(413)
    expect((await big.json()).error).toBe('Payload too large')
  })

  it('echoes an allowed CORS origin and answers preflight', async () => {
    const res = await fetch(`${base}/api/echo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://good.example' },
      body: '{}',
    })
    expect(res.headers.get('access-control-allow-origin')).toBe('https://good.example')

    const pre = await fetch(`${base}/api/echo`, {
      method: 'OPTIONS',
      headers: { origin: 'https://good.example' },
    })
    expect(pre.status).toBe(204)
    expect(pre.headers.get('access-control-allow-origin')).toBe('https://good.example')
    expect(pre.headers.get('access-control-allow-methods')).toContain('POST')
  })

  it('denies a disallowed CORS origin (no ACAO header)', async () => {
    const res = await fetch(`${base}/api/echo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      body: '{}',
    })
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })
})

describe('createProdApp — HSTS in production', () => {
  let dist: string
  let server: Server
  let base: string
  let prev: string | undefined
  beforeAll(async () => {
    prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    ;({ dist, server, base } = await boot({}))
  })
  afterAll(() => {
    if (prev === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = prev
    server.closeAllConnections()
    server.close()
    rmSync(dist, { recursive: true, force: true })
  })

  it('emits Strict-Transport-Security only in production', async () => {
    const res = await fetch(`${base}/`)
    expect(res.headers.get('strict-transport-security')).toContain('max-age=')
    expect(res.headers.get('strict-transport-security')).toContain('includeSubDomains')
  })
})

describe('startProdServer — Node server timeouts', () => {
  it('sets requestTimeout / headersTimeout / keepAliveTimeout / maxConnections', async () => {
    const dist = writeFixture({
      security: {
        requestTimeoutMs: 12345,
        headersTimeoutMs: 23456,
        keepAliveTimeoutMs: 3456,
        maxConnections: 42,
      },
    })
    const { server, close } = await startProdServer({ dir: dist, port: 0, requestLog: false })
    expect(server.requestTimeout).toBe(12345)
    expect(server.headersTimeout).toBe(23456)
    expect(server.keepAliveTimeout).toBe(3456)
    expect(server.maxConnections).toBe(42)
    await close()
    rmSync(dist, { recursive: true, force: true })
  })
})

describe('resolveSecurityConfig — defaults', () => {
  it('fills sane defaults and honors the master kill-switch', () => {
    const def = resolveSecurityConfig()
    expect(def.enabled).toBe(true)
    expect(def.headers.enabled).toBe(true)
    expect(def.rateLimit.limit).toBe(120)
    expect(def.rateLimit.authLimit).toBe(10)
    expect(def.cors.enabled).toBe(false) // deny-by-default
    expect(def.bodyLimitBytes).toBe(1_000_000)
    expect(resolveSecurityConfig({ enabled: false }).enabled).toBe(false)
    expect(resolveSecurityConfig({ headers: { enabled: false } }).headers.enabled).toBe(false)
  })
})

describe('password primitive — scrypt hash/verify', () => {
  it('hashes then verifies; rejects a wrong password and a malformed hash', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(hash.startsWith('scrypt$')).toBe(true)
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true)
    expect(await verifyPassword('wrong', hash)).toBe(false)
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false)
    // A fresh hash of the same password differs (random salt).
    const hash2 = await hashPassword('correct horse battery staple')
    expect(hash2).not.toBe(hash)
  })
})

describe('session cookie — Secure flag', () => {
  async function setCookieFor(secure: boolean): Promise<string> {
    const app = createApp()
    app.use(
      '/login',
      defineEventHandler(async (event) => {
        await login(event, { user: { id: 1 } }, { password: 'x'.repeat(32), secure })
        return 'ok'
      }),
    )
    const handler = toWebHandler(app)
    const res = await handler(new Request('http://localhost/login'))
    const jar = res.headers.getSetCookie?.() ?? [res.headers.get('set-cookie') ?? '']
    return jar.join(' ; ')
  }

  it('sets Secure when opted in and omits it otherwise', async () => {
    expect(await setCookieFor(true)).toContain('Secure')
    expect(await setCookieFor(false)).not.toContain('Secure')
  })
})
