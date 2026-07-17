// @vitest-environment jsdom
//
// Unit tests for the client-side template-morph HMR receiver. Drives the DOM logic
// (`buildRootElement` + `applyTemplatePatch`) directly under jsdom.
//
// NOTE: the WS wiring in `installTemplateHmr` (which listens for the vite plugin's
// `apex:template` event) needs a running dev server + browser to verify end to end —
// out of scope for unit tests. Here we call the patch application directly.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTemplatePatch, buildRootElement } from './hmr.js'

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('buildRootElement', () => {
  it('mirrors the SSR root wrapper (x-data / data-apex-root / scope / rootAttrs)', () => {
    const el = buildRootElement({
      componentId: 'c0',
      scopeId: 'data-apex-x',
      template: '<button>hi</button>',
      rootAttrs: { 'x-init': 'boot()' },
    })
    expect(el.getAttribute('x-data')).toBe('apex_c0')
    expect(el.getAttribute('data-apex-root')).toBe('c0')
    expect(el.hasAttribute('data-apex-x')).toBe(true)
    expect(el.getAttribute('x-init')).toBe('boot()')
    expect((el.querySelector('button') as HTMLElement).innerHTML).toBe('hi')
  })

  it('stamps the scope attribute on every descendant so scoped CSS keeps matching', () => {
    const el = buildRootElement({
      componentId: 'c0',
      scopeId: 'data-apex-x',
      template: '<div><button>hi</button></div>',
    })
    for (const node of Array.from(el.querySelectorAll('*'))) {
      expect(node.hasAttribute('data-apex-x')).toBe(true)
    }
  })

  it('does not stamp the scope past a nested component boundary', () => {
    const el = buildRootElement({
      componentId: 'c0',
      scopeId: 'data-apex-x',
      template: '<div data-apex-component="Foo"><i>x</i></div>',
    })
    const nested = el.querySelector('[data-apex-component]') as HTMLElement
    expect(nested.hasAttribute('data-apex-x')).toBe(false)
    expect((nested.querySelector('i') as HTMLElement).hasAttribute('data-apex-x')).toBe(false)
  })
})

describe('applyTemplatePatch', () => {
  it('morphs the live root in place, preserving node identity + reactive text', () => {
    document.body.innerHTML =
      '<div x-data="apex_c0" data-apex-root="c0" data-apex-x>' +
      '<button x-text="n" data-apex-x>1</button><span id="s" data-apex-x>old</span></div>'
    const span = document.getElementById('s') as HTMLElement
    ;(span as unknown as { _x_keep: boolean })._x_keep = true

    const patched = applyTemplatePatch({
      componentId: 'c0',
      scopeId: 'data-apex-x',
      template: '<button x-text="n"></button><span id="s">new</span>',
    })

    expect(patched).toBe(1)
    // Node identity (and its Alpine state) preserved.
    expect(document.getElementById('s')).toBe(span)
    expect((span as unknown as { _x_keep: boolean })._x_keep).toBe(true)
    // Reactive x-text kept, plain text patched.
    expect((document.querySelector('button') as HTMLElement).textContent).toBe('1')
    expect((document.getElementById('s') as HTMLElement).textContent).toBe('new')
  })

  it('returns 0 (patches nothing) when the component is not on the page', () => {
    document.body.innerHTML = '<div data-apex-root="other"></div>'
    const patched = applyTemplatePatch({
      componentId: 'c0',
      scopeId: 'data-apex-x',
      template: '<p>x</p>',
    })
    expect(patched).toBe(0)
  })

  it('forwards the Alpine handle to the morph engine', () => {
    document.body.innerHTML = '<div data-apex-root="c0" x-data="apex_c0"><p>a</p></div>'
    const morph = vi.fn()
    applyTemplatePatch(
      { componentId: 'c0', scopeId: 'data-apex-x', template: '<p>b</p>' },
      { alpine: { morph } },
    )
    expect(morph).toHaveBeenCalledTimes(1)
  })
})
