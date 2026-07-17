import { describe, expect, it } from 'vitest'
import { evaluate } from './evaluator.js'
import { createScopeProxy } from './scope.js'

describe('createScopeProxy enumeration traps', () => {
  it('Object.keys() sees the union of all layers', () => {
    const proxy = createScopeProxy([{ a: 1 }, { b: 2 }])
    expect(Object.keys(proxy).sort()).toEqual(['a', 'b'])
  })

  it('spread `{...scope}` copies every layer value (top layer wins on collision)', () => {
    const proxy = createScopeProxy([
      { a: 1, shared: 'low' },
      { b: 2, shared: 'high' },
    ])
    expect({ ...proxy }).toEqual({ a: 1, b: 2, shared: 'high' })
  })

  it('for..in enumerates the merged scope', () => {
    const proxy = createScopeProxy([{ a: 1 }, { b: 2 }])
    const seen: string[] = []
    for (const k in proxy) seen.push(k)
    expect(seen.sort()).toEqual(['a', 'b'])
  })

  it('getOwnPropertyDescriptor resolves to the top-most owner', () => {
    const proxy = createScopeProxy([{ x: 'low' }, { x: 'high' }])
    const desc = Object.getOwnPropertyDescriptor(proxy, 'x')
    expect(desc?.value).toBe('high')
    expect(desc?.enumerable).toBe(true)
  })
})

describe('enumeration inside SSR expressions', () => {
  it('spreads a scope object into a new object', () => {
    // The merged scope is what every expression runs against; enumerating a
    // scope-resolved object must see its keys.
    const result = evaluate('Object.keys(state)', [{ state: { one: 1, two: 2 } }])
    expect(result).toEqual(['one', 'two'])
  })

  it('spread over a nested scope object works', () => {
    const result = evaluate('({ ...form, extra: true })', [{ form: { a: 1, b: 2 } }])
    expect(result).toEqual({ a: 1, b: 2, extra: true })
  })
})
