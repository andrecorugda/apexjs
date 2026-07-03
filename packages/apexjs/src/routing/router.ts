import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

interface Segment {
  literal?: string
  param?: string
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
 */
export function scanPages(root: string): RouteDef[] {
  const dir = join(root, 'pages')
  if (!existsSync(dir)) return []

  const routes = walkAlpine(dir).map((abs): RouteDef => {
    const rel = relative(dir, abs).split(sep).join('/')
    const pageId = `/pages/${rel}`
    const parts = rel.replace(/\.alpine$/, '').split('/')
    // Drop a trailing `index` so blog/index → blog and index → "".
    if (parts[parts.length - 1] === 'index') parts.pop()

    const segments: Segment[] = parts.map((p) => {
      const m = /^\[(.+)\]$/.exec(p)
      return m ? { param: m[1] } : { literal: p }
    })
    const isDynamic = segments.some((s) => s.param !== undefined)
    const pattern = `/${segments.map((s) => (s.param ? `:${s.param}` : s.literal)).join('/')}`
    return { pageId, pattern, segments, isDynamic }
  })

  // Static routes take precedence over dynamic ones.
  return routes.sort((a, b) => Number(a.isDynamic) - Number(b.isDynamic))
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
