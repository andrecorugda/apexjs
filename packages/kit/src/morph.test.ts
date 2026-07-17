// @vitest-environment jsdom
//
// Unit tests for the fine-grained HMR morph primitive. These exercise the DOM-level
// morph behaviour under jsdom: node identity (hence Alpine state) is preserved, live
// form input survives, reactive text is kept, and new nodes are initialized.
//
// NOTE: real end-to-end HMR — Vite pushing `apex:template` over a WS to a running
// browser with a live Alpine instance — needs a browser and is out of scope for these
// unit tests. Here we drive `morphView` directly against a jsdom document.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { morphView } from './morph.js'

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('morphView (morphdom fallback)', () => {
  it('patches changed content in place while keeping the existing node (Alpine state)', () => {
    document.body.innerHTML =
      '<div id="root"><button id="btn">old</button><span id="s">A</span></div>'
    const root = document.getElementById('root') as HTMLElement
    const btn = document.getElementById('btn') as HTMLElement
    // Simulate Alpine state stashed on the element node.
    ;(btn as unknown as { _x_state: string })._x_state = 'KEEP'

    morphView(root, '<div id="root"><button id="btn">old</button><span id="s">B</span></div>')

    // Same node object survived → any Alpine state on it survives too.
    expect(document.getElementById('btn')).toBe(btn)
    expect((btn as unknown as { _x_state: string })._x_state).toBe('KEEP')
    // The genuinely-changed sibling was patched.
    expect((document.getElementById('s') as HTMLElement).textContent).toBe('B')
  })

  it('preserves a live text/number input value across a template edit', () => {
    document.body.innerHTML =
      '<form id="f"><input id="name" name="name"><span id="s">x</span></form>'
    const input = document.getElementById('name') as HTMLInputElement
    input.value = 'typed by user'

    // New markup for the input carries no value attribute (the template default).
    morphView(
      document.getElementById('f') as HTMLElement,
      '<form id="f"><input id="name" name="name"><span id="s">y</span></form>',
    )

    expect((document.getElementById('name') as HTMLInputElement).value).toBe('typed by user')
    expect((document.getElementById('s') as HTMLElement).textContent).toBe('y')
  })

  it('preserves a live checkbox checked state', () => {
    document.body.innerHTML = '<div id="root"><input id="c" type="checkbox"><b id="b">A</b></div>'
    const box = document.getElementById('c') as HTMLInputElement
    box.checked = true

    morphView(
      document.getElementById('root') as HTMLElement,
      '<div id="root"><input id="c" type="checkbox"><b id="b">B</b></div>',
    )

    expect((document.getElementById('c') as HTMLInputElement).checked).toBe(true)
    expect((document.getElementById('b') as HTMLElement).textContent).toBe('B')
  })

  it('keeps Alpine-rendered x-text content when its binding is unchanged', () => {
    document.body.innerHTML = '<div id="root"><button x-text="count">5</button></div>'
    morphView(
      document.getElementById('root') as HTMLElement,
      '<div id="root"><button x-text="count"></button></div>',
    )
    // Not flashed back to the empty template value — Alpine keeps ownership.
    expect((document.querySelector('button') as HTMLElement).textContent).toBe('5')
  })

  it('runs Alpine.initTree on genuinely new nodes, not on existing ones', () => {
    document.body.innerHTML = '<div id="root"><p id="p">a</p></div>'
    const initTree = vi.fn()

    morphView(
      document.getElementById('root') as HTMLElement,
      '<div id="root"><p id="p">a</p><em id="new">b</em></div>',
      { alpine: { initTree } },
    )

    expect(document.getElementById('new')).not.toBeNull()
    expect(initTree).toHaveBeenCalledTimes(1)
    expect(initTree).toHaveBeenCalledWith(document.getElementById('new'))
  })
})

describe('morphView (Alpine.morph preferred)', () => {
  it('delegates to Alpine.morph when the plugin is present', () => {
    document.body.innerHTML = '<div id="root"><p>a</p></div>'
    const root = document.getElementById('root') as HTMLElement
    const morph = vi.fn()
    const html = '<div id="root"><p>b</p></div>'

    morphView(root, html, { alpine: { morph } })

    expect(morph).toHaveBeenCalledTimes(1)
    expect(morph).toHaveBeenCalledWith(root, html)
    // Delegated — the fallback did NOT run, so the DOM is left for Alpine.morph to patch.
    expect((root.querySelector('p') as HTMLElement).textContent).toBe('a')
  })
})
