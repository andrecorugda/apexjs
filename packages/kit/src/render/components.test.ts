import { describe, expect, it } from 'vitest'
import type { ComponentRegistry } from './components.js'
import { rewriteComponentTags } from './components.js'
import { renderComponent } from './renderComponent.js'

describe('rewriteComponentTags', () => {
  it('rewrites self-closing and paired PascalCase tags', () => {
    expect(rewriteComponentTags('<Counter start="5"/>', ['Counter'])).toBe(
      '<apex-component data-apex-name="Counter" start="5"></apex-component>',
    )
    expect(rewriteComponentTags('<Card>hi</Card>', ['Card'])).toBe(
      '<apex-component data-apex-name="Card">hi</apex-component>',
    )
  })

  it('preserves attribute values containing > (quoted)', () => {
    const out = rewriteComponentTags('<Counter :max="n > 5"/>', ['Counter'])
    expect(out).toContain('data-apex-name="Counter"')
    expect(out).toContain(':max="n > 5"')
  })

  it('leaves unknown / lowercase tags alone', () => {
    expect(rewriteComponentTags('<div></div><counter></counter>', ['Counter'])).toBe(
      '<div></div><counter></counter>',
    )
  })
})

describe('component embedding via renderComponent', () => {
  const registry: ComponentRegistry = {
    Counter: {
      template: '<button @click="count++" x-text="label + \': \' + count"></button>',
      rootXData: '{ count: Number(start) }',
      scopeId: 'data-apex-counter',
    },
  }

  function render(template: string) {
    return renderComponent({
      template,
      componentId: 'c0',
      scopeId: 'data-apex-page',
      loaderData: {},
      registry,
    }).html
  }

  it('renders an embedded component with props applied server-side', () => {
    const html = render('<main><Counter start="5" label="Hits"/></main>')
    expect(html).toContain('data-apex-component="Counter"')
    expect(html).toContain('>Hits: 5</button>') // x-data count from Number(start), label prop
  })

  it('bakes resolved data as a prop-free x-data literal for hydration', () => {
    const html = render('<Counter start="3" label="N"/>')
    // The wrapper carries a JSON literal (no reference to `start`) so the client
    // hydrates without the parent scope.
    expect(html).toMatch(/x-data="{[^"]*&quot;count&quot;:3[^"]*}"|x-data="{[^"]*"count":3[^"]*}"/)
    expect(html).not.toContain('Number(start)')
  })

  it('leaves an unregistered tag untouched (not treated as a component)', () => {
    const html = render('<Missing/>')
    expect(html).not.toContain('data-apex-component')
    expect(html).toContain('<missing') // passes through as plain (lowercased) markup
  })

  it('forwards a client directive to the wrapper (for islands)', () => {
    const html = render('<Counter start="0" label="X" client:visible/>')
    expect(html).toContain('client:visible')
  })
})

describe('components inside x-for / x-if (structural expansion)', () => {
  const registry: ComponentRegistry = {
    Card: {
      template: '<div class="card"><slot></slot></div>',
      scopeId: 'data-apex-card',
    },
    Counter: {
      template: '<button x-text="label + \': \' + count"></button>',
      rootXData: '{ count: Number(start) }',
      scopeId: 'data-apex-counter',
    },
  }
  const render = (template: string, loaderData: Record<string, unknown> = {}) =>
    renderComponent({
      template,
      componentId: 'c0',
      scopeId: 'data-apex-page',
      loaderData,
      registry,
    }).html

  it('expands a slot-only component inside x-for so Alpine clones real markup', () => {
    const html = render(
      '<ul><template x-for="p in items" :key="p.id"><li><Card><span x-text="p.name"></span></Card></li></template></ul>',
      {
        items: [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ],
      },
    )
    // The kept <template> holds the EXPANDED card markup (not a raw component tag)
    // + the unresolved binding — so client-side clones render styled.
    expect(html).toContain('class="card"')
    expect(html).toContain('x-text="p.name"')
    expect(html).not.toContain('<apex-component')
    expect(html).not.toContain('<card')
    // SSR clones are resolved per item.
    expect(html).toContain('data-apex-ssr')
    expect(html).toContain('>A</span>')
    expect(html).toContain('>B</span>')
  })

  it('reconstructs props + component x-data for a component inside x-for', () => {
    const html = render('<template x-for="n in nums"><Counter :start="n" label="C"/></template>', {
      nums: [1, 2],
    })
    // The kept template carries a runtime x-data that rebuilds props + x-data per clone.
    expect(html).toContain('Object.assign')
    // SSR clones resolve count from the loop value.
    expect(html).toContain('>C: 1</button>')
    expect(html).toContain('>C: 2</button>')
  })

  it('stamps the component scope on NESTED elements inside x-for (so <style scoped> matches)', () => {
    const reg: ComponentRegistry = {
      Sidebar: { template: '<aside class="sb"><button>x</button></aside>', scopeId: 'data-apex-sb' },
    }
    const html = renderComponent({
      template: '<ul><template x-for="p in items" :key="p"><li><Sidebar/></li></template></ul>',
      componentId: 'c0',
      scopeId: 'data-apex-page',
      loaderData: { items: [1, 2] },
      registry: reg,
    }).html
    // Every rendered <button> (kept template + SSR clones) must carry the
    // component's OWN scope. Regression: in-loop clones only got the enclosing
    // page scope, so a component's `button[data-apex-sb]` scoped CSS never matched.
    const buttons = html.match(/<button[^>]*>/g) ?? []
    expect(buttons.length).toBeGreaterThanOrEqual(2)
    for (const b of buttons) expect(b).toContain('data-apex-sb')
  })

  it('expands a component inside x-if', () => {
    const shown = render('<template x-if="ok"><Card><b x-text="msg"></b></Card></template>', {
      ok: true,
      msg: 'Hi',
    })
    expect(shown).toContain('class="card"')
    expect(shown).toContain('>Hi</b>')
    expect(shown).not.toContain('<apex-component')
    // Even when the condition is false, the kept template is still expanded.
    const hidden = render('<template x-if="ok"><Card>x</Card></template>', { ok: false })
    expect(hidden).toContain('class="card"')
    expect(hidden).not.toContain('<apex-component')
  })
})
