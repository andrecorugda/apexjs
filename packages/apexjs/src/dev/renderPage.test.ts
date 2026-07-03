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
          ],
          link: [{ rel: 'canonical', href: 'https://example.com/first' }],
        }
      },
    })
    const html = await renderPage({ loadModule: async () => mod, pageId: '/pages/index.alpine', url: '/' })

    expect(html).toContain('<title>My Post — Blog</title>')
    expect(html).toContain('<meta name="description" content="An intro to Apex head tags." />')
    expect(html).toContain('<meta property="og:title" content="My Post" />')
    expect(html).toContain('<link rel="canonical" href="https://example.com/first" />')
  })

  it('falls back to the default title when no head() is exported', async () => {
    const html = await renderPage({ loadModule: async () => makeModule(), pageId: '/pages/index.alpine', url: '/' })
    expect(html).toContain('<title>Apex JS</title>')
  })

  it('escapes head values to prevent markup injection', async () => {
    const mod = makeModule({ head: () => ({ title: '<script>alert(1)</script>' }) })
    const html = await renderPage({ loadModule: async () => mod, pageId: '/pages/index.alpine', url: '/' })
    expect(html).toContain('<title>&lt;script&gt;alert(1)&lt;/script&gt;</title>')
    expect(html).not.toContain('<title><script>alert(1)')
  })
})
