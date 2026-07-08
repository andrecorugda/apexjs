import { describe, expect, it } from 'vitest'
import { renderIslands } from './renderComponent.js'

const scope = 'data-apex-x'

describe('renderIslands', async () => {
  it('SSR-renders static content and island subtrees', async () => {
    const { html } = await renderIslands(
      '<h1 x-text="title"></h1><div x-data="{ n: 5 }" client:load><span x-text="n"></span></div>',
      { title: 'Hi' },
      scope,
    )
    expect(html).toContain('>Hi</h1>') // static, from data
    expect(html).toContain('>5</span>') // island subtree evaluated
  })

  it('marks each client mode and x-ignores every island', async () => {
    const { html, hydratingCount } = await renderIslands(
      [
        '<div x-data="{}" client:load></div>',
        '<div x-data="{}" client:idle></div>',
        '<div x-data="{}" client:visible></div>',
        '<div x-data="{}" client:none></div>',
      ].join(''),
      {},
      scope,
    )
    for (const mode of ['load', 'idle', 'visible', 'none']) {
      expect(html).toContain(`data-apex-client="${mode}"`)
    }
    // The original client:* attributes are consumed.
    expect(html).not.toContain('client:load')
    expect(html).not.toContain('client:visible')
    // All islands are x-ignore'd; three of four hydrate (not `none`).
    expect((html.match(/x-ignore/g) ?? []).length).toBe(4)
    expect(hydratingCount).toBe(3)
  })

  it('reports zero hydrating islands for a fully static page', async () => {
    const { hydratingCount } = await renderIslands('<p>hello</p>', {}, scope)
    expect(hydratingCount).toBe(0)
  })

  it('counts a none-only page as zero hydrating (ships no JS)', async () => {
    const { hydratingCount } = await renderIslands('<div x-data="{}" client:none></div>', {}, scope)
    expect(hydratingCount).toBe(0)
  })
})
