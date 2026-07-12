import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  type ComponentModule,
  componentName,
  scanComponents,
  toComponentEntry,
} from './registry.js'

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

describe('componentName', () => {
  it('keeps top-level filenames exactly (backward compatible)', () => {
    expect(componentName('Card')).toBe('Card')
    expect(componentName('Counter')).toBe('Counter')
  })

  it('namespaces nested components by folder (Nuxt-style)', () => {
    expect(componentName('ui/Card')).toBe('UiCard')
    expect(componentName('forms/Input')).toBe('FormsInput')
    expect(componentName('my-widgets/Card')).toBe('MyWidgetsCard')
    expect(componentName('base/foo/Button')).toBe('BaseFooButton')
  })

  it('dedupes an overlapping folder + filename', () => {
    expect(componentName('base/BaseButton')).toBe('BaseButton')
    expect(componentName('ui/UiCard')).toBe('UiCard')
  })
})

describe('scanComponents', () => {
  let root: string
  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'apex-comp-'))
    const c = join(root, 'components')
    mkdirSync(join(c, 'ui'), { recursive: true })
    writeFileSync(join(c, 'Card.alpine'), '<template><slot></slot></template>')
    writeFileSync(join(c, 'ui', 'Panel.alpine'), '<template><slot></slot></template>')
  })
  afterAll(() => rmSync(root, { recursive: true, force: true }))

  it('finds top-level + nested components with resolved names and forward-slash ids', () => {
    const found = scanComponents(root).sort((a, b) => a.name.localeCompare(b.name))
    expect(found).toEqual([
      { id: '/components/Card.alpine', rel: 'Card.alpine', name: 'Card' },
      { id: '/components/ui/Panel.alpine', rel: 'ui/Panel.alpine', name: 'UiPanel' },
    ])
  })

  it('throws on a tag-name collision', () => {
    const dir = mkdtempSync(join(tmpdir(), 'apex-clash-'))
    const c = join(dir, 'components')
    mkdirSync(join(c, 'ui'), { recursive: true })
    // components/UiCard.alpine and components/ui/Card.alpine both → <UiCard/>.
    writeFileSync(join(c, 'UiCard.alpine'), 'x')
    writeFileSync(join(c, 'ui', 'Card.alpine'), 'x')
    expect(() => scanComponents(dir)).toThrow(/resolve to <UiCard\/>/)
    rmSync(dir, { recursive: true, force: true })
  })
})
