import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { matchRoute, type RouteDef, scanPages } from './router.js'

describe('matchRoute', () => {
  const routes: RouteDef[] = [
    { pageId: '/pages/index.alpine', pattern: '/', segments: [], isDynamic: false },
    {
      pageId: '/pages/about.alpine',
      pattern: '/about',
      segments: [{ literal: 'about' }],
      isDynamic: false,
    },
    {
      pageId: '/pages/blog/index.alpine',
      pattern: '/blog',
      segments: [{ literal: 'blog' }],
      isDynamic: false,
    },
    {
      pageId: '/pages/blog/[slug].alpine',
      pattern: '/blog/:slug',
      segments: [{ literal: 'blog' }, { param: 'slug' }],
      isDynamic: true,
    },
  ]

  it('matches the index route', () => {
    expect(matchRoute(routes, '/')).toEqual({ pageId: '/pages/index.alpine', params: {} })
  })

  it('matches a static route', () => {
    expect(matchRoute(routes, '/about')?.pageId).toBe('/pages/about.alpine')
  })

  it('matches a dynamic route and captures the param', () => {
    expect(matchRoute(routes, '/blog/hello-world')).toEqual({
      pageId: '/pages/blog/[slug].alpine',
      params: { slug: 'hello-world' },
    })
  })

  it('prefers the static route over the dynamic one at the same depth', () => {
    // /blog matches both /blog (static) and would-be nothing dynamic; static wins
    expect(matchRoute(routes, '/blog')?.pageId).toBe('/pages/blog/index.alpine')
  })

  it('returns null when nothing matches', () => {
    expect(matchRoute(routes, '/nope/deep/path')).toBeNull()
  })

  it('ignores the query string', () => {
    expect(matchRoute(routes, '/about?foo=1')?.pageId).toBe('/pages/about.alpine')
  })
})

describe('scanPages', () => {
  const root = mkdtempSync(join(tmpdir(), 'apex-routes-'))
  afterAll(() => rmSync(root, { recursive: true, force: true }))

  it('derives routes from the pages directory', () => {
    mkdirSync(join(root, 'pages', 'blog'), { recursive: true })
    for (const f of ['index.alpine', 'about.alpine', 'blog/index.alpine', 'blog/[slug].alpine']) {
      writeFileSync(join(root, 'pages', f), '<template></template>')
    }
    const patterns = scanPages(root)
      .map((r) => r.pattern)
      .sort()
    expect(patterns).toEqual(['/', '/about', '/blog', '/blog/:slug'])
  })

  it('returns an empty table when there is no pages directory', () => {
    const empty = mkdtempSync(join(tmpdir(), 'apex-empty-'))
    expect(scanPages(empty)).toEqual([])
    rmSync(empty, { recursive: true, force: true })
  })
})
