import { describe, expect, it } from 'vitest'
import { defaultThemeCss, defineTheme, renderThemeCss } from './index.js'
import { apexPreset } from './preset.js'

describe('defineTheme', () => {
  it('merges overrides onto the default, keeping untouched roles', () => {
    const t = defineTheme({ radius: '1rem', colors: { light: { primary: '#ff0000' } } })
    expect(t.radius).toBe('1rem')
    expect(t.colors.light.primary).toBe('#ff0000')
    expect(t.colors.light.bg).toBe('#ffffff') // untouched default preserved
    expect(t.colors.dark.primary).toBe('#818cf8') // dark scheme untouched
  })
})

describe('renderThemeCss', () => {
  it('emits :root light tokens, dark via prefers + data-theme', () => {
    const css = renderThemeCss(defineTheme({ colors: { light: { primary: '#123456' } } }))
    expect(css).toContain('--ax-primary: #123456;')
    expect(css).toContain('--ax-primary-fg:') // camelCase → kebab var
    expect(css).toContain('--ax-radius: 0.6rem;')
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\)/)
    expect(css).toContain(':root[data-theme="dark"]')
    // dark override present under the dark selectors
    expect(css).toContain('--ax-bg: #0a0e1a;')
  })

  it('exports a ready default stylesheet', () => {
    expect(defaultThemeCss).toContain(':root {')
    expect(defaultThemeCss).toContain('--ax-font-sans:')
  })
})

describe('apexPreset', () => {
  it('maps Tailwind color/radius utilities to the --ax-* vars', () => {
    const c = apexPreset.theme.extend.colors
    expect(c.primary.DEFAULT).toBe('var(--ax-primary)')
    expect(c.primary.fg).toBe('var(--ax-primary-fg)')
    expect(c.bg).toBe('var(--ax-bg)')
    expect(apexPreset.theme.extend.borderRadius.DEFAULT).toBe('var(--ax-radius)')
  })
})
