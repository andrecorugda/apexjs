import { describe, expect, it } from 'vitest'
import { AlpineEvalError, evaluate } from './evaluator.js'

describe('evaluate', () => {
  it('reads a simple identifier from data', () => {
    expect(evaluate('count', [{ count: 5 }])).toBe(5)
  })

  it('resolves member access and expressions', () => {
    expect(evaluate('post.title', [{ post: { title: 'Hi' } }])).toBe('Hi')
    expect(evaluate('a + b * 2', [{ a: 1, b: 3 }])).toBe(7)
  })

  it('lets outer layers be shadowed by inner ones (x-for scope)', () => {
    // outer defines i=0, inner x-for layer overrides i=99
    expect(evaluate('i', [{ i: 0 }, { i: 99 }])).toBe(99)
  })

  it('falls through to shared globals (String, Math, JSON)', () => {
    expect(evaluate('String(n)', [{ n: 42 }])).toBe('42')
    expect(evaluate('Math.max(a, b)', [{ a: 2, b: 9 }])).toBe(9)
    expect(evaluate('JSON.stringify(o)', [{ o: { x: 1 } }])).toBe('{"x":1}')
  })

  it('evaluates an object literal (x-data shape)', () => {
    expect(evaluate('{ open: false, items: [1,2] }', [{}])).toEqual({
      open: false,
      items: [1, 2],
    })
  })

  it('returns undefined for unknown identifiers by default (no throw)', () => {
    expect(evaluate('nope', [{}])).toBeUndefined()
  })

  it('swallows browser-only globals during SSR (window)', () => {
    // `window` is undefined in Node → ReferenceError → swallowed to undefined.
    expect(evaluate('window.location.href', [{}])).toBeUndefined()
  })

  it('throws a helpful error when throwOnError is set', () => {
    expect(() => evaluate('window.x', [{}], { throwOnError: true })).toThrow(AlpineEvalError)
  })

  it('supports truthiness checks used by x-if / x-show', () => {
    expect(evaluate('items.length > 0', [{ items: [1] }])).toBe(true)
    expect(evaluate('items.length > 0', [{ items: [] }])).toBe(false)
  })
})
