import { describe, expect, it } from 'vitest'
import { parseAlpineFile } from '../parse/parseAlpineFile.js'
import { renderComponent } from './renderComponent.js'

function render(src: string, loaderData: Record<string, unknown> = {}) {
  const descriptor = parseAlpineFile(src, 'test.alpine')
  return renderComponent({
    template: descriptor.template?.content ?? '',
    rootXData: descriptor.template?.attrs['x-data'],
    componentId: 'c0',
    scopeId: 'data-apex-test',
    loaderData,
  }).html
}

describe('renderComponent', () => {
  it('renders x-text from loader data', () => {
    const html = render('<template x-data><h1 x-text="title"></h1></template>', { title: 'Hello' })
    expect(html).toContain('<h1')
    expect(html).toContain('>Hello</h1>')
    // Root carries the component reference for hydration.
    expect(html).toContain('x-data="apex_c0"')
    expect(html).toContain('data-apex-root="c0"')
  })

  it('escapes x-text output (no HTML injection)', () => {
    const html = render('<template x-data><p x-text="v"></p></template>', {
      v: '<script>alert(1)</script>',
    })
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('applies x-show as display:none when falsy', () => {
    const shown = render('<template x-data><p x-show="ok">hi</p></template>', { ok: true })
    expect(shown).not.toContain('display: none')
    const hidden = render('<template x-data><p x-show="ok">hi</p></template>', { ok: false })
    expect(hidden).toContain('display: none')
  })

  it('renders x-for with a kept template marker and marked clones', () => {
    const html = render(
      '<template x-data><ul><template x-for="i in items"><li x-text="i"></li></template></ul></template>',
      { items: ['a', 'b', 'c'] },
    )
    // Template marker retained for Alpine.
    expect(html).toContain('x-for="i in items"')
    // Three server-rendered <li> clones, each marked for remove-on-boot.
    const lis = html.match(/<li[^>]*data-apex-ssr[^>]*>/g) ?? []
    expect(lis).toHaveLength(3)
    expect(html).toContain('>a</li>')
    expect(html).toContain('>b</li>')
    expect(html).toContain('>c</li>')
  })

  it('supports (item, index) in x-for', () => {
    const html = render(
      '<template x-data><template x-for="(v, idx) in items"><span x-text="idx + \':\' + v"></span></template></template>',
      { items: ['x', 'y'] },
    )
    expect(html).toContain('>0:x</span>')
    expect(html).toContain('>1:y</span>')
  })

  it('renders x-if only when truthy', () => {
    const yes = render(
      '<template x-data><template x-if="show"><p>visible</p></template></template>',
      { show: true },
    )
    expect(yes).toMatch(/<p[^>]*data-apex-ssr[^>]*>visible<\/p>/)
    const no = render(
      '<template x-data><template x-if="show"><p>visible</p></template></template>',
      { show: false },
    )
    // No rendered clone. The template's own inert content is left as-is (the
    // browser never renders <template> content), so we assert on the clone only.
    expect(no).not.toMatch(/<p[^>]*data-apex-ssr/)
  })

  it('applies :class object bindings merged with static class', () => {
    const html = render(
      '<template x-data><div class="base" :class="{ active: on, off: !on }"></div></template>',
      { on: true },
    )
    // Assert on the rendered class attribute specifically (the :class source
    // expression legitimately still contains "off" for the client).
    const classAttr = /class="([^"]*)"/.exec(html)?.[1] ?? ''
    const tokens = classAttr.split(/\s+/)
    expect(tokens).toContain('base')
    expect(tokens).toContain('active')
    expect(tokens).not.toContain('off')
  })

  it('applies boolean attribute bindings', () => {
    // The applied boolean attribute serializes as disabled="" (the :disabled
    // source directive stays in both cases for the client).
    const on = render('<template x-data><button :disabled="busy">go</button></template>', {
      busy: true,
    })
    expect(on).toMatch(/<button disabled/)
    const off = render('<template x-data><button :disabled="busy">go</button></template>', {
      busy: false,
    })
    expect(off).not.toMatch(/<button disabled/)
  })

  it('stamps the scope id on rendered elements including clones', () => {
    const html = render(
      '<template x-data><ul><template x-for="i in items"><li x-text="i"></li></template></ul></template>',
      { items: [1] },
    )
    // root + ul + clone li all carry the scope attr
    expect((html.match(/data-apex-test/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })

  it('keeps @click / x-on handlers untouched for the client', () => {
    const html = render('<template x-data><button @click="n++" x-text="n"></button></template>', {
      n: 3,
    })
    expect(html).toContain('@click="n++"')
    expect(html).toContain('>3</button>')
  })

  it('merges authored x-data defaults under loader data', () => {
    const html = render(
      '<template x-data="{ n: 1, m: 2 }"><span x-text="n + m"></span></template>',
      {
        n: 10,
      },
    )
    // loader n=10 wins over authored n=1; authored m=2 remains → 12
    expect(html).toContain('>12</span>')
  })

  it('strips x-cloak', () => {
    const html = render('<template x-data><div x-cloak>hi</div></template>', {})
    expect(html).not.toContain('x-cloak')
  })
})

describe('component slots', () => {
  const withCard = (usage: string, cardTemplate: string) =>
    renderComponent({
      template: usage,
      rootXData: null,
      componentId: 'c0',
      scopeId: 'data-apex-test',
      loaderData: {},
      registry: { Card: { template: cardTemplate, rootXData: null, scopeId: 'data-apex-card' } },
    }).html

  it('injects slot content from the usage children', () => {
    const html = withCard(
      '<Card><p>Slotted!</p></Card>',
      '<div class="card"><slot>fallback</slot></div>',
    )
    expect(html).toContain('class="card"')
    expect(html).toContain('Slotted!')
    expect(html).not.toContain('<slot')
    expect(html).not.toContain('fallback')
  })

  it('keeps the slot fallback when no content is provided', () => {
    const html = withCard('<Card />', '<div><slot>Default content</slot></div>')
    expect(html).toContain('Default content')
    expect(html).not.toContain('<slot')
  })
})
