// @apex-stack/core/testing — an in-process harness for testing an Apex app's API +
// MCP surface. Server-only (imports h3 + node:http). See the test-kit spec.
import { createServer, type Server } from 'node:http'
import { join } from 'node:path'
import { apex } from '@apex-stack/vite'
import {
  createApp,
  defineEventHandler,
  getRequestHeaders,
  setResponseHeader,
  setResponseStatus,
  toNodeListener,
} from 'h3'
import { createServer as createViteServer, type ViteDevServer } from 'vite'
import { type ApiEntry, createApiHandler, loadApiRoutes } from '../api/routes.js'
import { type ApexUser, type AuthConfig, defineAuth } from '../auth/define.js'
import { loadAuth } from '../auth/run.js'
import type { RuntimeConfig } from '../config/runtime.js'
import { createMcpHandler } from '../mcp/server.js'
import { loadMiddleware, runMiddleware } from '../middleware/run.js'
import type { KvStore } from '../security/kvStore.js'

/** Header the harness uses to inject a session — read by its test auth resolver. */
const TEST_USER_HEADER = 'x-apex-test-user'

export interface CallOptions {
  /** Authenticate this request as `user` (skips the login flow). Omit for anonymous / cookie auth. */
  user?: ApexUser | null
  /** Extra request headers. */
  headers?: Record<string, string>
}

export interface TestResponse<T = unknown> {
  status: number
  body: T
  headers: Headers
}

export interface TestApp {
  /** Base URL of the in-process server. */
  url: string
  get<T = unknown>(path: string, opts?: CallOptions): Promise<TestResponse<T>>
  post<T = unknown>(path: string, body?: unknown, opts?: CallOptions): Promise<TestResponse<T>>
  put<T = unknown>(path: string, body?: unknown, opts?: CallOptions): Promise<TestResponse<T>>
  patch<T = unknown>(path: string, body?: unknown, opts?: CallOptions): Promise<TestResponse<T>>
  delete<T = unknown>(path: string, opts?: CallOptions): Promise<TestResponse<T>>
  mcp: {
    /** The tools visible to `opts.user` (per-user filtered `tools/list`). */
    listTools(opts?: CallOptions): Promise<string[]>
    /** Call a tool; returns the JSON-RPC `result` (`{ content, isError }`). */
    call(
      name: string,
      args?: Record<string, unknown>,
      opts?: CallOptions,
    ): Promise<{
      content?: Array<{ type: string; text?: string }>
      isError?: boolean
    }>
  }
  /** Shut down the server. */
  close(): Promise<void>
}

export type CreateTestAppOptions =
  | {
      root: string
      config?: RuntimeConfig
      /**
       * Skip `server/api/*` routes whose imports don't resolve (e.g. a model route that
       * needs `@apex-stack/data` before it's installed) instead of failing the whole boot.
       * Off by default — an unresolvable route throws a clear, actionable error naming the
       * route + missing module. Turn on to test the rest of the surface in isolation.
       */
      lenientRoutes?: boolean
    }
  | {
      entries: ApiEntry[]
      auth?: AuthConfig
      config?: RuntimeConfig
      /** Isolated idempotency store for this app (default: the process-wide memory store). */
      idempotencyStore?: KvStore
    }

const MCP_INIT = {
  protocolVersion: '2025-06-18',
  capabilities: {},
  clientInfo: { name: 'apex-test', version: '0' },
}

/**
 * Boot an Apex app's API + MCP surface on an ephemeral in-process server for tests.
 * Pass `{ root }` to discover `server/api`, `server/auth.ts`, and `middleware/*`, or
 * `{ entries, auth }` to test a hand-built entry table with no filesystem.
 *
 * Authenticate a call with `{ user }` (a test header the harness resolves, bypassing
 * login); omit it for anonymous, or drive the real login flow — a cookie jar persists
 * `Set-Cookie` across calls. Auth gating, `scope`, and CSRF stay live.
 */
export async function createTestApp(opts: CreateTestAppOptions): Promise<TestApp> {
  const config = opts.config ?? { public: {} }

  let entries: ApiEntry[]
  let appAuth: AuthConfig | undefined
  let middleware: Awaited<ReturnType<typeof loadMiddleware>> = []
  let vite: ViteDevServer | undefined
  let idempotencyStore: KvStore | undefined

  if ('entries' in opts) {
    entries = opts.entries
    appAuth = opts.auth
    idempotencyStore = opts.idempotencyStore
  } else {
    const root = opts.root
    // Load the app's modules through Vite's SSR loader (like `apex dev`) so
    // extensionless + TypeScript imports across the whole graph resolve correctly —
    // native `import()` of a file:// URL would only handle the top file, not its deps.
    // The app's deps (@apex-stack/core, etc.) resolve from its own node_modules.
    vite = await createViteServer({
      root,
      appType: 'custom',
      configFile: false, // deterministic — don't pick up the app's vite/vitest config
      logLevel: 'silent',
      server: { middlewareMode: true, fs: { strict: false } },
      plugins: [apex({ clientRuntime: '@apex-stack/core/client' })],
    })
    const load = (id: string): Promise<Record<string, unknown>> => {
      const resolved =
        id[0] === '/' && !id.startsWith(root) ? join(root, id).replace(/\\/g, '/') : id
      return vite?.ssrLoadModule(resolved) as Promise<Record<string, unknown>>
    }
    entries = await loadApiRoutes(root, load as never, { lenient: opts.lenientRoutes })
    appAuth = await loadAuth(root, load as never)
    middleware = await loadMiddleware(root, load as never)
  }

  // Test auth: an injected `{ user }` wins; otherwise defer to the app's real resolver
  // (so real cookie login flows still work). Anonymous when neither is present.
  const auth: AuthConfig = defineAuth({
    resolve: async (ctx) => {
      const injected = ctx.headers[TEST_USER_HEADER]
      if (injected !== undefined) return JSON.parse(injected) as ApexUser | null
      return appAuth ? ((await appAuth.resolve(ctx)) ?? null) : null
    },
  })

  const app = createApp()
  if (middleware.length) {
    app.use(
      defineEventHandler(async (event) => {
        const { redirect, locals } = await runMiddleware(middleware, {
          url: event.path || '/',
          method: event.method,
          config,
          headers: getRequestHeaders(event) as Record<string, string>,
        })
        event.context.apexLocals = locals
        if (redirect) {
          setResponseStatus(event, redirect.status)
          setResponseHeader(event, 'Location', redirect.to)
          return ''
        }
      }),
    )
  }
  app.use(
    '/api',
    createApiHandler(entries, config, auth, {
      exposeErrors: true, // tests assert real messages
      ...(idempotencyStore ? { idempotency: { store: idempotencyStore } } : {}),
    }),
  )
  app.use('/mcp', createMcpHandler(entries, config, auth, { exposeErrors: true }))

  const server: Server = createServer(toNodeListener(app))
  await new Promise<void>((r) => server.listen(0, r))
  const addr = server.address()
  const url = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`

  const jar = { cookie: '' }
  const authHeaders = (opts?: CallOptions): Record<string, string> => {
    const h: Record<string, string> = { ...(opts?.headers ?? {}) }
    if (opts && 'user' in opts) h[TEST_USER_HEADER] = JSON.stringify(opts.user ?? null)
    if (jar.cookie) h.cookie = jar.cookie
    return h
  }

  const request = async <T>(
    method: string,
    path: string,
    body: unknown,
    opts?: CallOptions,
  ): Promise<TestResponse<T>> => {
    const headers = authHeaders(opts)
    if (body !== undefined) headers['content-type'] = 'application/json'
    // A cookie-authed mutation needs a same-origin Origin to pass CSRF (browsers send it).
    if (jar.cookie && method !== 'GET') headers.origin = url
    const res = await fetch(`${url}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) jar.cookie = setCookie.split(';')[0] ?? ''
    const text = await res.text()
    let parsed: unknown = text
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      // non-JSON body — return the raw text
    }
    return { status: res.status, body: parsed as T, headers: res.headers }
  }

  const rpc = async (
    method: string,
    params: unknown,
    opts?: CallOptions,
  ): Promise<Record<string, unknown>> => {
    const res = await fetch(`${url}/mcp`, {
      method: 'POST',
      headers: {
        ...authHeaders(opts),
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    })
    const json = (await res.json()) as { result?: Record<string, unknown> }
    return json.result ?? {}
  }

  return {
    url,
    get: (path, opts) => request('GET', path, undefined, opts),
    post: (path, body, opts) => request('POST', path, body, opts),
    put: (path, body, opts) => request('PUT', path, body, opts),
    patch: (path, body, opts) => request('PATCH', path, body, opts),
    delete: (path, opts) => request('DELETE', path, undefined, opts),
    mcp: {
      listTools: async (opts) => {
        await rpc('initialize', MCP_INIT, opts)
        const result = await rpc('tools/list', {}, opts)
        return ((result.tools as Array<{ name: string }>) ?? []).map((t) => t.name)
      },
      call: async (name, args, opts) => {
        await rpc('initialize', MCP_INIT, opts)
        return rpc('tools/call', { name, arguments: args ?? {} }, opts) as Promise<{
          content?: Array<{ type: string; text?: string }>
          isError?: boolean
        }>
      },
    },
    close: async () => {
      await new Promise<void>((r) => server.close(() => r()))
      if (vite) await vite.close()
    },
  }
}
