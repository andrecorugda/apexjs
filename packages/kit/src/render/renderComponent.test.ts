import { describe, expect, it } from 'vitest'
import { parseAlpineFile } from '../parse/parseAlpineFile.js'
import { renderComponent, renderFragment } from './renderComponent.js'

async function render(src: string, loaderData: Record<string, unknown> = {}): Promise<string> {
  const descriptor = parseAlpineFile(src, 'test.alpine')
  return (
    await renderComponent({
      template: descriptor.template?.content ?? '',
      rootXData: descriptor.template?.attrs['x-data'],
      componentId: 'c0',
      scopeId: 'data-apex-test',
      loaderData,
    })
  ).html
}

describe('renderComponent', async () => {
  it('renders x-text from loader data', async () => {
    const html = await render('<template x-data><h1 x-text="title"></h1></template>', {
      title: 'Hello',
    })
    expect(html).toContain('<h1')
    expect(html).toContain('>Hello</h1>')
    // Root carries the component reference for hydration.
    expect(html).toContain('x-data="apex_c0"')
    expect(html).toContain('data-apex-root="c0"')
  })

  it('escapes x-text output (no HTML injection)', async () => {
    const html = await render('<template x-data><p x-text="v"></p></template>', {
      v: '<script>alert(1)</script>',
    })
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('applies x-show as display:none when falsy', async () => {
    const shown = await render('<template x-data><p x-show="ok">hi</p></template>', { ok: true })
    expect(shown).not.toContain('display: none')
    const hidden = await render('<template x-data><p x-show="ok">hi</p></template>', { ok: false })
    expect(hidden).toContain('display: none')
  })

  it('renders x-for with a kept template marker and marked clones', async () => {
    const html = await render(
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

  it('supports (item, index) in x-for', async () => {
    const html = await render(
      '<template x-data><template x-for="(v, idx) in items"><span x-text="idx + \':\' + v"></span></template></template>',
      { items: ['x', 'y'] },
    )
    expect(html).toContain('>0:x</span>')
    expect(html).toContain('>1:y</span>')
  })

  it('renders x-if only when truthy', async () => {
    const yes = await render(
      '<template x-data><template x-if="show"><p>visible</p></template></template>',
      { show: true },
    )
    expect(yes).toMatch(/<p[^>]*data-apex-ssr[^>]*>visible<\/p>/)
    const no = await render(
      '<template x-data><template x-if="show"><p>visible</p></template></template>',
      { show: false },
    )
    // No rendered clone. The template's own inert content is left as-is (the
    // browser never renders <template> content), so we assert on the clone only.
    expect(no).not.toMatch(/<p[^>]*data-apex-ssr/)
  })

  it('applies :class object bindings merged with static class', async () => {
    const html = await render(
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

  it('applies boolean attribute bindings', async () => {
    // The applied boolean attribute serializes as disabled="" (the :disabled
    // source directive stays in both cases for the client).
    const on = await render('<template x-data><button :disabled="busy">go</button></template>', {
      busy: true,
    })
    expect(on).toMatch(/<button disabled/)
    const off = await render('<template x-data><button :disabled="busy">go</button></template>', {
      busy: false,
    })
    expect(off).not.toMatch(/<button disabled/)
  })

  it('stamps the scope id on rendered elements including clones', async () => {
    const html = await render(
      '<template x-data><ul><template x-for="i in items"><li x-text="i"></li></template></ul></template>',
      { items: [1] },
    )
    // root + ul + clone li all carry the scope attr
    expect((html.match(/data-apex-test/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })

  it('keeps @click / x-on handlers untouched for the client', async () => {
    const html = await render(
      '<template x-data><button @click="n++" x-text="n"></button></template>',
      {
        n: 3,
      },
    )
    expect(html).toContain('@click="n++"')
    expect(html).toContain('>3</button>')
  })

  it('merges authored x-data defaults under loader data', async () => {
    const html = await render(
      '<template x-data="{ n: 1, m: 2 }"><span x-text="n + m"></span></template>',
      {
        n: 10,
      },
    )
    // loader n=10 wins over authored n=1; authored m=2 remains → 12
    expect(html).toContain('>12</span>')
  })

  it('strips x-cloak', async () => {
    const html = await render('<template x-data><div x-cloak>hi</div></template>', {})
    expect(html).not.toContain('x-cloak')
  })

  it('carries root-template directives other than x-data onto the root div (#51)', async () => {
    const { html } = await renderComponent({
      template: '<p></p>',
      rootXData: '{}',
      rootAttrs: { 'x-init': "location.href='/next'", '@click': 'go()' },
      componentId: 'c0',
      scopeId: 'data-apex-test',
      loaderData: {},
    })
    expect(html).toContain(`x-init="location.href='/next'"`)
    expect(html).toContain('@click="go()"')
    expect(html).toContain('x-data="apex_c0"') // x-data stays the component ref
  })
})

describe('x-model initial state (zero-flash)', async () => {
  it('renders value= on a text input', async () => {
    const html = await render('<template x-data><input x-model="name"></template>', {
      name: 'Ada',
    })
    expect(html).toMatch(/<input[^>]*value="Ada"/)
    // The x-model directive stays for client rebinding.
    expect(html).toContain('x-model="name"')
  })

  it('renders an explicit input type value=', async () => {
    const html = await render(
      '<template x-data><input type="email" x-model="email"></template>',
      { email: 'a@b.com' },
    )
    expect(html).toMatch(/value="a@b\.com"/)
  })

  it('sets textarea text content', async () => {
    const html = await render('<template x-data><textarea x-model="bio"></textarea></template>', {
      bio: 'hello world',
    })
    expect(html).toMatch(/<textarea[^>]*>hello world<\/textarea>/)
  })

  it('adds checked to a boolean checkbox when truthy, omits when falsy', async () => {
    const on = await render(
      '<template x-data><input type="checkbox" x-model="agree"></template>',
      { agree: true },
    )
    expect(on).toMatch(/<input[^>]*checked/)
    const off = await render(
      '<template x-data><input type="checkbox" x-model="agree"></template>',
      { agree: false },
    )
    expect(off).not.toMatch(/<input[^>]*checked/)
  })

  it('checks an array-bound checkbox by value membership', async () => {
    const html = await render(
      '<template x-data><input type="checkbox" value="b" x-model="picks"></template>',
      { picks: ['a', 'b'] },
    )
    expect(html).toMatch(/<input[^>]*checked/)
    const miss = await render(
      '<template x-data><input type="checkbox" value="z" x-model="picks"></template>',
      { picks: ['a', 'b'] },
    )
    expect(miss).not.toMatch(/<input[^>]*checked/)
  })

  it('checks the radio whose value matches', async () => {
    const html = await render(
      '<template x-data><input type="radio" value="yes" x-model="answer"><input type="radio" value="no" x-model="answer"></template>',
      { answer: 'no' },
    )
    // Second radio (value="no") is checked, first is not.
    const radios = html.match(/<input[^>]*>/g) ?? []
    expect(radios[0]).not.toMatch(/checked/)
    expect(radios[1]).toMatch(/checked/)
  })

  it('marks the matching <select> option selected', async () => {
    const html = await render(
      '<template x-data><select x-model="color"><option value="red">Red</option><option value="green">Green</option></select></template>',
      { color: 'green' },
    )
    // Attribute order isn't guaranteed by the serializer; assert per-option.
    const greenOpt = /<option[^>]*value="green"[^>]*>/.exec(html)?.[0] ?? ''
    const redOpt = /<option[^>]*value="red"[^>]*>/.exec(html)?.[0] ?? ''
    expect(greenOpt).toMatch(/selected/)
    expect(redOpt).not.toMatch(/selected/)
  })

  it('does not emit a value when the model is undefined', async () => {
    const html = await render('<template x-data><input x-model="missing"></template>', {})
    expect(html).not.toMatch(/value=/)
  })
})

describe('$store during SSR (islands / fragments / nested)', async () => {
  it('resolves $store inside a rendered fragment', async () => {
    const html = await renderFragment(
      '<p x-text="$store.settings.title"></p>',
      {},
      'data-apex-test',
      {},
      { settings: { title: 'Dashboard' } },
    )
    expect(html).toContain('>Dashboard</p>')
  })

  it('resolves $store inside a nested component instance', async () => {
    const { html } = await renderComponent({
      template: '<Badge/>',
      rootXData: null,
      componentId: 'c0',
      scopeId: 'data-apex-test',
      loaderData: {},
      stores: { settings: { title: 'Pro' } },
      registry: {
        Badge: {
          template: '<span x-text="$store.settings.title"></span>',
          rootXData: null,
          scopeId: 'data-apex-badge',
        },
      },
    })
    expect(html).toContain('>Pro</span>')
  })
})

describe('component slots', async () => {
  const withCard = async (usage: string, cardTemplate: string) =>
    (
      await renderComponent({
        template: usage,
        rootXData: null,
        componentId: 'c0',
        scopeId: 'data-apex-test',
        loaderData: {},
        registry: { Card: { template: cardTemplate, rootXData: null, scopeId: 'data-apex-card' } },
      })
    ).html

  it('injects slot content from the usage children', async () => {
    const html = await withCard(
      '<Card><p>Slotted!</p></Card>',
      '<div class="card"><slot>fallback</slot></div>',
    )
    expect(html).toContain('class="card"')
    expect(html).toContain('Slotted!')
    expect(html).not.toContain('<slot')
    expect(html).not.toContain('fallback')
  })

  it('keeps the slot fallback when no content is provided', async () => {
    const html = await withCard('<Card />', '<div><slot>Default content</slot></div>')
    expect(html).toContain('Default content')
    expect(html).not.toContain('<slot')
  })
})
