import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  defineEventHandler,
  type EventHandler,
  getQuery,
  getRequestURL,
  readBody,
  setResponseHeader,
  setResponseStatus,
} from 'h3'
import { z } from 'zod'
import type { RuntimeConfig } from '../config/runtime.js'
import type { ApexRoute, HttpMethod } from './defineRoute.js'
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
  return []
}

/**
 * Discover `server/api/*.ts` modules and expand them into a flat entry table.
 * A default export is either a single `ApexRoute` (from `defineApexRoute`) or an
 * `ApexResource` (from `defineResource`), which expands to several entries.
 */
export async function loadApiRoutes(
  root: string,
  loadModule: (id: string) => Promise<{ default?: ApexRoute | ApexResource }>,
): Promise<ApiEntry[]> {
  const dir = join(root, 'server', 'api')
  if (!existsSync(dir)) return []

  const entries: ApiEntry[] = []
  for (const file of readdirSync(dir).filter((f) => /\.(ts|js|mjs)$/.test(f))) {
    const name = file.replace(/\.(ts|js|mjs)$/, '')
    const def = (await loadModule(`/server/api/${file}`)).default
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

/** A single h3 handler that routes, validates, and dispatches all `/api/*` requests. */
export function createApiHandler(entries: ApiEntry[], config?: RuntimeConfig): EventHandler {
  return defineEventHandler(async (event) => {
    const url = getRequestURL(event)
    const matched = matchApi(entries, url.pathname, event.method)
    if (!matched) {
      setResponseStatus(event, 404)
      return { error: `No API route for ${event.method} ${url.pathname}` }
    }

    const { entry, params } = matched
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

    let result: unknown
    try {
      result = await entry.route.handler({
        input,
        url: url.toString(),
        config: config ?? { public: {} },
        locals: (event.context.apexLocals as Record<string, unknown>) ?? {},
      })
    } catch (err) {
      // Surface the underlying error (esp. the common "table doesn't exist yet")
      // instead of an opaque 500 with an empty stack.
      const message = (err as Error)?.message ?? 'Handler error'
      setResponseStatus(event, 500)
      setResponseHeader(event, 'Content-Type', 'application/json')
      const missingTable = /no such table|does not exist|relation .* does not exist/i.test(message)
      return {
        error: message,
        ...(missingTable ? { hint: 'Table not found — run `apex migrate` to create it.' } : {}),
      }
    }
    // Serialize explicitly so a `null` result (e.g. get-by-id not found) is a
    // parseable `200 null` JSON body, not h3's default `204 No Content`.
    setResponseHeader(event, 'Content-Type', 'application/json')
    setResponseStatus(event, 200)
    return JSON.stringify(result ?? null)
  })
}
