import { describe, expect, it } from 'vitest'
import { type PageModule, renderPage } from './renderPage.js'

function makeModule(overrides: Partial<PageModule> = {}): PageModule {
  return {
    loader: () => ({ post: { title: 'My Post', excerpt: 'An intro to Apex head tags.' } }),
    template: '<h1 x-text="post.title"></h1>',
    rootXData: null,
    componentId: 'c0',
    scopeId: 'data-apex-abc',
    css: '',
    ...overrides,
  }
}

describe('renderPage — head/SEO', () => {
  it('injects title, meta and link tags from a page head() export', async () => {
    const mod = makeModule({
      head: ({ data }) => {
        const post = (data as { post: { title: string; excerpt: string } }).post
        return {
          title: `${post.title} — Blog`,
          meta: [
            { name: 'description', content: post.excerpt },
            { property: 'og:title', content: post.title },
          ] as Array<Record<string, string>>,
          link: [{ rel: 'canonical', href: 'https://example.com/first' }],
        }
      },
    })
    const html = await renderPage({
      loadModule: async () => mod,
      pageId: '/pages/index.alpine',
      url: '/',
    })

    expect(html).toContain('<title>My Post — Blog</title>')
    expect(html).toContain('<meta name="description" content="An intro to Apex head tags." />')
    expect(html).toContain('<meta property="og:title" content="My Post" />')
    expect(html).toContain('<link rel="canonical" href="https://example.com/first" />')
  })

  it('falls back to the default title when no head() is exported', async () => {
    const html = await renderPage({
      loadModule: async () => makeModule(),
      pageId: '/pages/index.alpine',
      url: '/',
    })
    expect(html).toContain('<title>Apex JS</title>')
  })

  it('escapes head values to prevent markup injection', async () => {
    const mod = makeModule({ head: () => ({ title: '<script>alert(1)</script>' }) })
    const html = await renderPage({
      loadModule: async () => mod,
      pageId: '/pages/index.alpine',
      url: '/',
    })
    expect(html).toContain('<title>&lt;script&gt;alert(1)&lt;/script&gt;</title>')
    expect(html).not.toContain('<title><script>alert(1)')
  })
})

const layoutMod = (): PageModule => ({
  loader: () => ({}),
  template: '<header>NAV</header><slot></slot><footer>FOOT</footer>',
  rootXData: null,
  componentId: 'l0',
  scopeId: 'data-apex-lay',
  css: '.site{}',
})

describe('renderPage — layouts', () => {
  it('wraps the page in the default layout, injecting at <slot>', async () => {
    const page = makeModule({ template: '<p>page body</p>' })
    const load = async (id: string) => (id.startsWith('/layouts/') ? layoutMod() : page)
    const html = await renderPage({
      loadModule: load,
      pageId: '/pages/index.alpine',
      url: '/',
      layouts: ['default'],
    })
    expect(html).toContain('NAV')
    expect(html).toContain('page body')
    expect(html).toContain('FOOT')
    expect(html.indexOf('NAV')).toBeLessThan(html.indexOf('page body'))
    expect(html.indexOf('page body')).toBeLessThan(html.indexOf('FOOT'))
    expect(html).toContain('.site{}') // layout CSS included
  })

  it('respects `export const layout` naming', async () => {
    const page = makeModule({ template: '<p>x</p>', layout: 'blog' })
    let requested = ''
    const load = async (id: string) => {
      if (id.startsWith('/layouts/')) {
        requested = id
        return layoutMod()
      }
      return page
    }
    await renderPage({
      loadModule: load,
      pageId: '/pages/index.alpine',
      url: '/',
      layouts: ['blog'],
    })
    expect(requested).toBe('/layouts/blog.alpine')
  })

  it('opts out of layouts with layout: false', async () => {
    const page = makeModule({ template: '<p>bare</p>', layout: false })
    const load = async (id: string) => (id.startsWith('/layouts/') ? layoutMod() : page)
    const html = await renderPage({
      loadModule: load,
      pageId: '/pages/index.alpine',
      url: '/',
      layouts: ['default'],
    })
    expect(html).toContain('bare')
    expect(html).not.toContain('NAV')
  })
})
