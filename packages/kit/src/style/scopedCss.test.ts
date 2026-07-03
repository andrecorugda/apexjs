import { describe, expect, it } from 'vitest'
import { scopeCss } from './scopedCss.js'

describe('scopeCss', () => {
  it('appends the scope attribute to a simple selector', () => {
    expect(scopeCss('h1 { color: red }', 'data-apex-x')).toContain('h1[data-apex-x]')
  })

  it('scopes only the last compound of a descendant selector', () => {
    const out = scopeCss('.card h1 { color: red }', 'data-apex-x')
    expect(out).toContain('.card h1[data-apex-x]')
    expect(out).not.toContain('.card[data-apex-x] h1')
  })

  it('handles combinators and pseudo-classes without breaking', () => {
    expect(scopeCss('ul > li { margin: 0 }', 'data-apex-x')).toContain('ul > li[data-apex-x]')
    expect(scopeCss('a:hover { color: blue }', 'data-apex-x')).toContain('a:hover[data-apex-x]')
  })

  it('scopes each selector in a comma list', () => {
    const out = scopeCss('h1, h2 { margin: 0 }', 'data-apex-x')
    expect(out).toContain('h1[data-apex-x]')
    expect(out).toContain('h2[data-apex-x]')
  })

  it('does not scope @keyframes stops', () => {
    const out = scopeCss('@keyframes spin { from { opacity: 0 } to { opacity: 1 } }', 'data-apex-x')
    expect(out).not.toContain('from[data-apex-x]')
    expect(out).not.toContain('to[data-apex-x]')
  })
})
