import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

interface Segment {
  literal?: string
  param?: string
  /** Catch-all segment `[...name]` — captures all remaining path segments (joined by `/`). */
  catchAll?: string
}

export interface RouteDef {
  /** Module id for ssrLoadModule, e.g. `/pages/blog/[slug].alpine`. */
  pageId: string
  /** Human-readable pattern, e.g. `/blog/:slug`. */
  pattern: string
  segments: Segment[]
  isDynamic: boolean
}

export interface MatchedRoute {
  pageId: string
  params: Record<string, string>
}

function walkAlpine(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry)
    if (statSync(abs).isDirectory()) out.push(...walkAlpine(abs))
    else if (entry.endsWith('.alpine')) out.push(abs)
  }
  return out
}

/**
 * Scan `pages/**\/*.alpine` into a route table.
 *   pages/index.alpine        → /
 *   pages/about.alpine        → /about
 *   pages/blog/index.alpine   → /blog
 *   pages/blog/[slug].alpine  → /blog/:slug
 *   pages/docs/[...path].alpine → /docs/:path*  (catch-all)
 */
export function scanPages(root: string): RouteDef[] {
  const dir = join(root, 'pages')
  if (!existsSync(dir)) return []

  // Framework-reserved top-level pages, handled specially (error boundary /
  // slow-nav boundary) rather than as navigable routes.
  const RESERVED = new Set(['error.alpine', 'loading.alpine'])

  const routes = walkAlpine(dir)
    .filter((abs) => !RESERVED.has(relative(dir, abs).split(sep).join('/')))
    .map((abs): RouteDef => {
      const rel = relative(dir, abs).split(sep).join('/')
      const pageId = `/pages/${rel}`
      const parts = rel.replace(/\.alpine$/, '').split('/')
      // Drop a trailing `index` so blog/index → blog and index → "".
      if (parts[parts.length - 1] === 'index') parts.pop()

      const segments: Segment[] = parts.map((p) => {
        const catchAll = /^\[\.\.\.(.+)\]$/.exec(p)
        if (catchAll) return { catchAll: catchAll[1] }
        const m = /^\[(.+)\]$/.exec(p)
        return m ? { param: m[1] } : { literal: p }
      })
      const isDynamic = segments.some((s) => s.param !== undefined || s.catchAll !== undefined)
      const pattern = `/${segments
        .map((s) => (s.catchAll ? `:${s.catchAll}*` : s.param ? `:${s.param}` : s.literal))
        .join('/')}`
      return { pageId, pattern, segments, isDynamic }
    })

  // Precedence: static (0) < dynamic param (1) < catch-all (2).
  const rank = (r: RouteDef) => (r.segments.some((s) => s.catchAll) ? 2 : r.isDynamic ? 1 : 0)
  return routes.sort((a, b) => rank(a) - rank(b))
}

/** Split a URL path into non-empty segments. */
function pathSegments(url: string): string[] {
  const path = url.split('?')[0] ?? '/'
  return path.split('/').filter(Boolean)
}

/** Match a URL against the route table, returning the page module + params. */
export function matchRoute(routes: RouteDef[], url: string): MatchedRoute | null {
  const segs = pathSegments(url)
  for (const route of routes) {
    const last = route.segments[route.segments.length - 1]
    const isCatchAll = Boolean(last?.catchAll)

    if (isCatchAll) {
      // Leading segments match exactly; the catch-all captures the rest (>= 1 segment).
      const lead = route.segments.slice(0, -1)
      if (segs.length < lead.length + 1) continue
      const params: Record<string, string> = {}
      let ok = true
      for (let i = 0; i < lead.length; i++) {
        const rs = lead[i] as Segment
        const value = segs[i] as string
        if (rs.param) params[rs.param] = decodeURIComponent(value)
        else if (rs.literal !== value) {
          ok = false
          break
        }
      }
      if (!ok) continue
      params[last?.catchAll as string] = segs.slice(lead.length).map(decodeURIComponent).join('/')
      return { pageId: route.pageId, params }
    }

    if (route.segments.length !== segs.length) continue
    const params: Record<string, string> = {}
    let ok = true
    for (let i = 0; i < route.segments.length; i++) {
      const rs = route.segments[i] as Segment
      const value = segs[i] as string
      if (rs.param) params[rs.param] = decodeURIComponent(value)
      else if (rs.literal !== value) {
        ok = false
        break
      }
    }
    if (ok) return { pageId: route.pageId, params }
  }
  return null
}
