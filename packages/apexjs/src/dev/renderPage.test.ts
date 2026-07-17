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
    expect(html).toContain(
      '<meta name="description" content="An intro to Apex head tags." data-apex-head />',
    )
    expect(html).toContain('<meta property="og:title" content="My Post" data-apex-head />')
    expect(html).toContain(
      '<link rel="canonical" href="https://example.com/first" data-apex-head />',
    )
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

describe('renderPage — self-hosted fonts (#18)', () => {
  it('injects the pre-built font <head> fragment into the shell head', async () => {
    const fontHead =
      '<style>@font-face{font-family:"Inter";src:url("/fonts/Inter.woff2") format("woff2")}</style>\n  ' +
      '<link rel="preload" as="font" type="font/woff2" href="/fonts/Inter.woff2" crossorigin />'
    const html = await renderPage({
      loadModule: async () => makeModule(),
      pageId: '/pages/index.alpine',
      url: '/',
      fontHead,
    })
    expect(html).toContain('@font-face{font-family:"Inter"')
    expect(html).toContain('<link rel="preload" as="font" type="font/woff2"')
    // Injected inside <head>, before </head>.
    expect(html.indexOf(fontHead)).toBeLessThan(html.indexOf('</head>'))
  })

  it('emits no font tags when fontHead is absent (gated)', async () => {
    const html = await renderPage({
      loadModule: async () => makeModule(),
      pageId: '/pages/index.alpine',
      url: '/',
    })
    expect(html).not.toContain('@font-face')
    expect(html).not.toContain('rel="preload" as="font"')
  })
})

describe('renderPage — config.head (anti-flash / early head)', () => {
  it('injects config.head first in <head>, before the title (runs before paint)', async () => {
    const head = "<script>document.documentElement.classList.toggle('dark',true)</script>"
    const html = await renderPage({
      loadModule: async () => makeModule(),
      pageId: '/pages/index.alpine',
      url: '/',
      head,
    })
    expect(html).toContain(head)
    // Before <title> (and thus before the app bundle) so the theme applies pre-paint.
    expect(html.indexOf(head)).toBeLessThan(html.indexOf('<title>'))
  })
})

describe('renderPage — error boundary', () => {
  it('renders the error page with { error } when a loader throws', async () => {
    const boom = makeModule({
      loader: () => {
        const e = new Error('DB is down') as Error & { statusCode?: number }
        e.statusCode = 503
        throw e
      },
    })
    const errorPage: PageModule = {
      loader: ({ locals }) => ({ locals }),
      template: '<h1 id="err" x-text="error.statusCode + &quot;: &quot; + error.message"></h1>',
      rootXData: null,
      componentId: 'e0',
      scopeId: 'data-apex-err',
      css: '',
    }
    const load = async (id: string) => (id.includes('/error.alpine') ? errorPage : boom)
    const html = await renderPage({
      loadModule: load,
      pageId: '/pages/index.alpine',
      url: '/',
      errorPageId: '/pages/error.alpine',
    })
    expect(html).toContain('503: DB is down')
  })

  it('rethrows when no error boundary is configured', async () => {
    const boom = makeModule({
      loader: () => {
        throw new Error('unhandled')
      },
    })
    await expect(
      renderPage({ loadModule: async () => boom, pageId: '/pages/index.alpine', url: '/' }),
    ).rejects.toThrow('unhandled')
  })
})

describe('renderPage — per-scope style tags (style HMR)', () => {
  it('emits one <style data-apex-css> per source so dev can hot-swap exactly one', async () => {
    const page = makeModule({ template: '<p>x</p>', css: '.a{color:red}' })
    const layout: PageModule = {
      loader: () => ({}),
      template: '<div><slot></slot></div>',
      rootXData: null,
      componentId: 'l0',
      scopeId: 'data-apex-lay',
      css: '.site{margin:0}',
    }
    const load = async (id: string) => (id.startsWith('/layouts/') ? layout : page)
    const html = await renderPage({
      loadModule: load,
      pageId: '/pages/index.alpine',
      url: '/',
      layouts: ['default'],
      componentCssBlocks: [{ scopeId: 'data-apex-cmp', css: '.counter{cursor:pointer}' }],
    })
    expect(html).toContain('<style data-apex-css="data-apex-abc">.a{color:red}</style>')
    expect(html).toContain('<style data-apex-css="data-apex-lay">.site{margin:0}</style>')
    expect(html).toContain('<style data-apex-css="data-apex-cmp">.counter{cursor:pointer}</style>')
  })
})

describe('renderPage — client-side navigation', () => {
  it('wraps the body in the stable swap region and emits the page-module hint', async () => {
    const html = await renderPage({
      loadModule: async () => makeModule(),
      pageId: '/pages/index.alpine',
      url: '/',
    })
    expect(html).toContain('<div id="__apex" data-apex-root>')
    // dev: the module hint points at the page path Vite serves.
    expect(html).toContain('<meta name="apex:page-module" content="/pages/index.alpine" />')
  })

  it('installs the nav runtime in the dev boot script by default', async () => {
    const html = await renderPage({
      loadModule: async () => makeModule(),
      pageId: '/pages/index.alpine',
      url: '/',
    })
    expect(html).toContain("import { installNav } from '@apex-stack/core/client'")
    expect(html).toContain('installNav()')
  })

  it('omits the nav runtime when clientNav is false', async () => {
    const html = await renderPage({
      loadModule: async () => makeModule(),
      pageId: '/pages/index.alpine',
      url: '/',
      clientNav: false,
    })
    expect(html).not.toContain('installNav')
  })

  it('embeds the loading boundary when loadingHtml is provided', async () => {
    const html = await renderPage({
      loadModule: async () => makeModule(),
      pageId: '/pages/index.alpine',
      url: '/',
      loadingHtml: '<div class="spinner">Loading…</div>',
    })
    expect(html).toContain(
      '<template data-apex-loading><div class="spinner">Loading…</div></template>',
    )
  })

  it('points the module hint at the hashed bundle in a production build', async () => {
    const html = await renderPage({
      loadModule: async () => makeModule(),
      pageId: '/pages/index.alpine',
      url: '/',
      clientHref: '/assets/index-abc123.js',
    })
    expect(html).toContain('<meta name="apex:page-module" content="/assets/index-abc123.js" />')
    // Built bundle installs nav itself, so the shell doesn't inline it.
    expect(html).toContain('<script type="module" src="/assets/index-abc123.js"></script>')
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

  it('nests layouts when a layout declares its own parent layout', async () => {
    const page = makeModule({ template: '<p>page body</p>', layout: 'blog' })
    const blog: PageModule = {
      loader: () => ({}),
      template: '<section id="blog"><slot></slot></section>',
      rootXData: null,
      componentId: 'b0',
      scopeId: 'data-apex-blog',
      css: '.blog{}',
      layout: 'root', // blog layout is itself wrapped by root
    }
    const root: PageModule = {
      loader: () => ({}),
      template: '<div id="root"><slot></slot></div>',
      rootXData: null,
      componentId: 'r0',
      scopeId: 'data-apex-root',
      css: '.root{}',
    }
    const load = async (id: string) =>
      id.includes('/blog.alpine') ? blog : id.includes('/root.alpine') ? root : page
    const html = await renderPage({
      loadModule: load,
      pageId: '/pages/index.alpine',
      url: '/',
      layouts: ['default', 'blog', 'root'],
    })
    // Outermost (root) wraps blog wraps the page.
    expect(html).toMatch(
      /id="root"[\s\S]*id="blog"[\s\S]*page body[\s\S]*<\/section>[\s\S]*<\/div>/,
    )
    expect(html).toContain('.blog{}')
    expect(html).toContain('.root{}') // both layers' CSS included
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
