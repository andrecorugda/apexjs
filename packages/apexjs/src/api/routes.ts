import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  defineEventHandler,
  type EventHandler,
  getQuery,
  getRequestURL,
  getResponseStatus,
  readBody,
  setResponseHeader,
  setResponseStatus,
} from 'h3'
import { z } from 'zod'
import { checkRouteAccess } from '../auth/check.js'
import type { AuthConfig } from '../auth/define.js'
import { getRequestUser } from '../auth/run.js'
import type { RuntimeConfig } from '../config/runtime.js'
import { checkCsrf } from '../security/csrf.js'
import { bodyExceedsLimit } from '../security/middleware.js'
import type { ApexRoute, HttpMethod } from './defineRoute.js'
import { beginIdempotency, type IdempotencyOptions } from './idempotency.js'
import { type ApexResource, isApexResource } from './resource.js'

interface Segment {
  literal?: string
  param?: string
}

export interface ApiEntry {
  /** Full mounted pattern, e.g. `/api/todos` or `/api/todos/:id`. */
  pattern: string
  segments: Segment[]
  method: HttpMethod
  /** MCP tool name (unique across the app). */
  mcpName: string
  route: ApexRoute
}

function toSegments(pattern: string): Segment[] {
  return pattern
    .split('/')
    .filter(Boolean)
    .map((p) => (p.startsWith(':') ? { param: p.slice(1) } : { literal: p }))
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)
}

function entryFor(
  pattern: string,
  method: HttpMethod,
  mcpName: string,
  route: ApexRoute,
): ApiEntry {
  return { pattern, segments: toSegments(pattern), method, mcpName, route }
}

/** Expand one API module's default export (single route or resource) into entries. */
export function expandApiModule(
  name: string,
  def: ApexRoute | ApexResource | undefined,
): ApiEntry[] {
  if (!def) return []
  if (isApexResource(def)) {
    return def.routes.map((r) =>
      entryFor(`/api/${def.name}${r.pathSuffix}`, r.route.method, r.mcpName, r.route),
    )
  }
  if (typeof def.handler === 'function') {
    return [entryFor(`/api/${name}`, def.method, sanitizeName(name), def)]
  }
  // Present, but not a route or resource — almost always a plain `export default function`, which
  // Apex can't serve (no method/validation). Warn loudly instead of a silent 404.
  const kind = typeof def === 'function' ? 'a plain function' : 'an unrecognized value'
  console.warn(
    `[apex] server/api/${name}.ts default-exports ${kind} — it will NOT be served (requests 404). ` +
      `Wrap it in defineApexRoute({ method, input?, handler }) (or export a defineResource).`,
  )
  return []
}

/**
 * Discover `server/api/*.ts` modules and expand them into a flat entry table.
 * A default export is either a single `ApexRoute` (from `defineApexRoute`) or an
 * `ApexResource` (from `defineResource`), which expands to several entries.
 */
/** Turn a module-load failure into an actionable message: name the route, the module that
 * couldn't resolve, and how to install it. A missing route dep otherwise surfaces as a raw
 * ESM "Cannot find module" with no hint about which route or what to do. */
function loadErrorMessage(file: string, err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  // Handle Node's "Cannot find package/module 'X'" and Vite's "Failed to resolve import 'X'".
  const dep =
    /Cannot find (?:package|module) ['"]([^'"]+)['"]/.exec(raw)?.[1] ??
    /Failed to resolve import ['"]([^'"]+)['"]/.exec(raw)?.[1]
  if (!dep) return `Failed to load server/api/${file}: ${raw}`
  const extra = dep === '@apex-stack/data' ? ' @libsql/client' : ''
  return (
    `Failed to load server/api/${file}: "${dep}" isn't installed. ` +
    `This route depends on it — run \`npm i ${dep}${extra}\` (or delete the route). ` +
    `Pass { lenientRoutes: true } to createTestApp to skip unresolvable routes in tests.`
  )
}

export async function loadApiRoutes(
  root: string,
  loadModule: (id: string) => Promise<{ default?: ApexRoute | ApexResource }>,
  opts: { lenient?: boolean } = {},
): Promise<ApiEntry[]> {
  const dir = join(root, 'server', 'api')
  if (!existsSync(dir)) return []

  const entries: ApiEntry[] = []
  for (const file of readdirSync(dir).filter((f) => /\.(ts|js|mjs)$/.test(f))) {
    const name = file.replace(/\.(ts|js|mjs)$/, '')
    let def: ApexRoute | ApexResource | undefined
    try {
      def = (await loadModule(`/server/api/${file}`)).default
    } catch (err) {
      // One route with an unresolvable import must not crash the whole surface with a
      // cryptic error: fail loud + legible (default), or skip it when `lenient`.
      const message = loadErrorMessage(file, err)
      if (opts.lenient) {
        console.warn(`[apex] skipping ${file} — ${message}`)
        continue
      }
      throw new Error(message)
    }
    entries.push(...expandApiModule(name, def))
  }
  return entries
}

interface Match {
  entry: ApiEntry
  params: Record<string, string>
}

/** Match a request path + method against the entry table. */
export function matchApi(entries: ApiEntry[], path: string, method: string): Match | null {
  const segs = (path.split('?')[0] ?? '/').split('/').filter(Boolean)
  for (const entry of entries) {
    if (entry.method !== method) continue
    if (entry.segments.length !== segs.length) continue
    const params: Record<string, string> = {}
    let ok = true
    for (let i = 0; i < entry.segments.length; i++) {
      const s = entry.segments[i] as Segment
      const v = segs[i] as string
      if (s.param) params[s.param] = decodeURIComponent(v)
      else if (s.literal !== v) {
        ok = false
        break
      }
    }
    if (ok) return { entry, params }
  }
  return null
}

export interface ApiHandlerOptions {
  /** Idempotency tuning — pass a shared `store` for multi-instance deployments. */
  idempotency?: IdempotencyOptions
  /**
   * Include the real error message (+ the migrate hint) in 500 bodies. The dev server and
   * test harness turn this ON; production leaves it off — clients get a generic
   * `Internal server error` and the detail goes to `onError` (fail-safe default).
   */
  exposeErrors?: boolean
  /** Receives the FULL error wherever the client got a safe generic response. */
  onError?: (
    error: unknown,
    ctx: { kind: 'api'; path: string; method: string; requestId?: string },
  ) => void
  /** Reject a request body larger than this many bytes with `413` (before parsing). */
  bodyLimitBytes?: number
}

/** A single h3 handler that routes, validates, and dispatches all `/api/*` requests. */
export function createApiHandler(
  entries: ApiEntry[],
  config?: RuntimeConfig,
  auth?: AuthConfig,
  opts?: ApiHandlerOptions,
): EventHandler {
  return defineEventHandler(async (event) => {
    const url = getRequestURL(event)
    const matched = matchApi(entries, url.pathname, event.method)
    if (!matched) {
      setResponseStatus(event, 404)
      return { error: `No API route for ${event.method} ${url.pathname}` }
    }

    const { entry, params } = matched

    // CSRF: reject a cookie-authenticated mutation whose Origin/Referer doesn't match
    // (bearer/tokenless clients are exempt — they can't be forged by a browser).
    if (!checkCsrf(event)) {
      setResponseStatus(event, 403)
      return { error: 'CSRF check failed' }
    }

    // Body-size cap: reject an oversized payload before reading/parsing it (DoS guard).
    if (
      entry.method !== 'GET' &&
      opts?.bodyLimitBytes &&
      bodyExceedsLimit(event, opts.bodyLimitBytes)
    ) {
      setResponseStatus(event, 413)
      return { error: 'Payload too large' }
    }

    const raw = {
      ...(entry.method === 'GET' ? getQuery(event) : ((await readBody(event)) ?? {})),
      ...params,
    }

    let input: unknown = raw
    if (entry.route.inputShape) {
      const parsed = z.object(entry.route.inputShape).safeParse(raw)
      if (!parsed.success) {
        setResponseStatus(event, 400)
        return { error: 'Invalid input', issues: parsed.error.issues }
      }
      input = parsed.data
    }

    // Authorization gate (§4.2) — resolve the user once, then apply auth/can.
    const user = await getRequestUser(event, auth, config)
    const decision = await checkRouteAccess(entry.route, user, input)
    if (!decision.ok) {
      setResponseStatus(event, decision.status)
      return { error: decision.message }
    }

    // Idempotency (#49): a mutation carrying an `Idempotency-Key` header runs once and its
    // outcome is replayed for retries. Deliberately AFTER auth — keys are user-scoped, so a
    // caller must authenticate before it can see (or probe) a cached response.
    const idem = await beginIdempotency(
      event,
      { method: entry.method, path: url.pathname },
      user,
      opts?.idempotency,
    )
    if (idem?.kind === 'replay') {
      setResponseHeader(event, 'x-idempotent-replay', 'true')
      setResponseHeader(event, 'Content-Type', 'application/json')
      setResponseStatus(event, idem.status)
      return JSON.stringify(idem.body ?? null)
    }
    if (idem?.kind === 'conflict') {
      setResponseStatus(event, 409)
      return { error: 'request in progress' }
    }

    let result: unknown
    try {
      result = await entry.route.handler({
        input,
        url: url.toString(),
        config: config ?? { public: {} },
        locals: (event.context.apexLocals as Record<string, unknown>) ?? {},
        user,
        event,
      })
    } catch (err) {
      // A thrown handler is a transient failure — release the idempotency lock so the
      // client's retry re-executes instead of being replayed a cached error.
      if (idem?.kind === 'proceed') await idem.release()
      // Surface the underlying error (esp. the common "table doesn't exist yet")
      // instead of an opaque 500 with an empty stack. The driver's real reason
      // (e.g. "no such table: event") is usually on `.cause`, not the top-level
      // "Failed query: …" message — include both.
      const e = err as { message?: string; cause?: { message?: string } }
      const causeMsg = e?.cause?.message ?? ''
      const message = [e?.message, causeMsg].filter(Boolean).join(' — ') || 'Handler error'
      // The FULL detail always goes server-side (the hook, or the console).
      if (opts?.onError)
        opts.onError(err, {
          kind: 'api',
          path: url.pathname,
          method: event.method,
          requestId: event.context.apexRequestId as string | undefined,
        })
      else console.error(`[apex] api ${event.method} ${url.pathname} failed:`, message)
      setResponseStatus(event, 500)
      setResponseHeader(event, 'Content-Type', 'application/json')
      // Clients only see the real message in dev/tests — production gets a generic body
      // so driver/internal details never leak (#25).
      if (!opts?.exposeErrors) return { error: 'Internal server error' }
      const missingTable = /no such table|does not exist|relation .* does not exist/i.test(message)
      return {
        error: message,
        ...(missingTable ? { hint: 'Table not found — run `apex migrate` to create it.' } : {}),
      }
    }
    // Serialize explicitly so a `null` result (e.g. get-by-id not found) is a
    // parseable `200 null` JSON body, not h3's default `204 No Content`. Preserve a
    // status the handler set itself (e.g. a login route returning 401) — only
    // default to 200 when the handler left a success status.
    setResponseHeader(event, 'Content-Type', 'application/json')
    if (getResponseStatus(event) < 400) setResponseStatus(event, 200)
    if (idem?.kind === 'proceed') {
      const status = getResponseStatus(event)
      // Cache deterministic outcomes (2xx–4xx); a handler-set 5xx is transient — release so
      // a retry re-executes.
      if (status < 500) await idem.commit(status, result ?? null)
      else await idem.release()
    }
    return JSON.stringify(result ?? null)
  })
}
