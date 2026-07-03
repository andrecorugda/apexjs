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
