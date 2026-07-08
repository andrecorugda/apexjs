import { describe, expect, it } from 'vitest'
import { type ComponentModule, toComponentEntry } from './registry.js'

const base: ComponentModule = {
  template: '<div></div>',
  rootXData: null,
  scopeId: 'data-apex-x',
  componentId: 'c1',
}

describe('toComponentEntry', () => {
  it('carries a declared server loader into the registry entry', () => {
    const fn = () => ({ ok: true })
    const entry = toComponentEntry({ ...base, hasLoader: true, loader: fn })
    // Regression: the prod server used to drop this, so embedded loaders never
    // ran in `apex build --server`.
    expect(entry.loader).toBe(fn)
    expect(entry.componentId).toBe('c1')
    expect(entry.scopeId).toBe('data-apex-x')
  })

  it('drops the compiler-injected no-op loader (hasLoader === false)', () => {
    const entry = toComponentEntry({ ...base, hasLoader: false, loader: () => ({}) })
    expect(entry.loader).toBeUndefined()
  })

  it('has no loader when the component declares none', () => {
    expect(toComponentEntry(base).loader).toBeUndefined()
  })
})
