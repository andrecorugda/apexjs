import { describe, expect, it } from 'vitest'
import { renderPage } from '../dev/renderPage.js'
import { defineMiddleware } from './define.js'
import { runMiddleware } from './run.js'

const base = {
  url: '/',
  method: 'GET',
  config: { public: {} },
  headers: {} as Record<string, string>,
}

describe('runMiddleware', () => {
  it('runs in order over a shared locals object', async () => {
    const order: string[] = []
    const mws = [
      defineMiddleware((ctx) => {
        order.push('a')
        ctx.locals.user = 'ada'
      }),
      defineMiddleware((ctx) => {
        order.push('b')
        ctx.locals.role = ctx.locals.user === 'ada' ? 'admin' : 'guest'
      }),
    ]
    const { locals, redirect } = await runMiddleware(mws, base)
    expect(order).toEqual(['a', 'b'])
    expect(locals).toEqual({ user: 'ada', role: 'admin' })
    expect(redirect).toBeUndefined()
  })

  it('short-circuits on the first redirect and skips the rest', async () => {
    let reached = false
    const mws = [
      defineMiddleware((ctx) => {
        if (!ctx.locals.user) return ctx.redirect('/login')
      }),
      defineMiddleware(() => {
        reached = true
      }),
    ]
    const { redirect } = await runMiddleware(mws, { ...base, url: '/admin' })
    expect(redirect).toEqual({ __apexRedirect: true, to: '/login', status: 302 })
    expect(reached).toBe(false)
  })

  it('honors a custom redirect status', async () => {
    const { redirect } = await runMiddleware(
      [defineMiddleware((ctx) => ctx.redirect('/new', 301))],
      base,
    )
    expect(redirect?.status).toBe(301)
  })
})

describe('renderPage — middleware locals', () => {
  it('threads middleware locals into the page loader', async () => {
    const html = await renderPage({
      loadModule: async () => ({
        loader: ({ locals }) => ({ who: (locals.user as string) ?? 'anon' }),
        template: '<p x-text="who"></p>',
        rootXData: null,
        componentId: 'c0',
        scopeId: 'data-apex-x',
        css: '',
      }),
      pageId: '/pages/index.alpine',
      url: '/',
      locals: { user: 'grace' },
    })
    expect(html).toContain('grace')
  })
})
