import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { defaultThemeCss, defineTheme, renderThemeCss } from './index.js'

describe('defineTheme', () => {
  it('merges overrides onto the default, keeping untouched tokens', () => {
    const t = defineTheme({ radius: '1rem', colors: { primary: '#ff0000' } })
    expect(t.radius).toBe('1rem')
    expect(t.colors.primary).toBe('#ff0000')
    expect(t.colors.surface).toBe('#ffffff') // untouched default preserved
    expect(t.colors['primary-dark']).toBe('#ffffff') // dark token untouched
  })
})

describe('renderThemeCss', () => {
  it('emits a Tailwind v4 @theme block with the PenguinUI token vocabulary', () => {
    const css = renderThemeCss(defineTheme({ colors: { primary: '#123456' } }))
    expect(css).toContain('@theme {')
    expect(css).toContain('--color-primary: #123456;')
    expect(css).toContain('--color-on-surface-strong:')
    expect(css).toContain('--color-primary-dark:')
    expect(css).toContain('--radius-radius: 0.25rem;')
    expect(css).toContain('--font-title:')
  })

  it('defaultThemeCss ships the dark variant + the theme block', () => {
    expect(defaultThemeCss).toContain('@custom-variant dark')
    expect(defaultThemeCss).toContain('@theme {')
  })
})

describe('shipped theme.css', () => {
  it('stays in sync with defaultThemeCss (regenerate on drift)', () => {
    const file = readFileSync(fileURLToPath(new URL('../theme.css', import.meta.url)), 'utf8')
    expect(file.trim()).toBe(defaultThemeCss.trim())
  })
})
