import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import type { FontConfig } from '../config/runtime.js'
import { emitFontAssets, fontFaceRule, fontFormat, fontHeadTags } from './fonts.js'

const inter: FontConfig = {
  families: [{ family: 'Inter', src: 'fonts/Inter.woff2', weight: 400 }],
}

describe('fontHeadTags', () => {
  it('emits an @font-face rule + a crossorigin preload link', () => {
    const tags = fontHeadTags(inter)
    expect(tags).toContain('@font-face{')
    expect(tags).toContain('font-family:"Inter"')
    expect(tags).toContain('font-weight:400')
    expect(tags).toContain('font-display:swap') // default
    expect(tags).toContain('src:url("/fonts/Inter.woff2") format("woff2")')
    expect(tags).toContain(
      '<link rel="preload" as="font" type="font/woff2" href="/fonts/Inter.woff2" crossorigin />',
    )
  })

  it('honours font-display + style/weight overrides', () => {
    const tags = fontHeadTags({
      display: 'optional',
      families: [{ family: 'Roman', src: 'fonts/x.ttf', style: 'italic', weight: '100 900' }],
    })
    expect(tags).toContain('font-display:optional')
    expect(tags).toContain('font-style:italic')
    expect(tags).toContain('font-weight:100 900')
    expect(tags).toContain('format("truetype")') // .ttf inferred
  })

  it('omits the preload links when preload:false, keeping the @font-face style', () => {
    const tags = fontHeadTags({ ...inter, preload: false })
    expect(tags).toContain('@font-face{')
    expect(tags).not.toContain('rel="preload"')
  })

  it('returns empty for an empty families list', () => {
    expect(fontHeadTags({ families: [] })).toBe('')
  })

  it('infers the format() keyword from the extension (or an explicit hint)', () => {
    expect(fontFormat({ family: 'a', src: 'a.woff' })).toBe('woff')
    expect(fontFormat({ family: 'a', src: 'a.otf' })).toBe('opentype')
    expect(fontFormat({ family: 'a', src: 'a.bin', format: 'woff2' })).toBe('woff2')
  })

  it('fontFaceRule composes the declared parts', () => {
    expect(fontFaceRule({ family: 'A', src: 'a.woff2' }, 'block')).toBe(
      '@font-face{font-family:"A";font-style:normal;font-weight:400;font-display:block;src:url("/fonts/a.woff2") format("woff2")}',
    )
  })
})

describe('emitFontAssets', () => {
  const root = mkdtempSync(join(tmpdir(), 'apex-fonts-root-'))
  const dist = mkdtempSync(join(tmpdir(), 'apex-fonts-dist-'))
  afterAll(() => {
    rmSync(root, { recursive: true, force: true })
    rmSync(dist, { recursive: true, force: true })
  })

  it('copies declared font files into dist/fonts, skipping missing sources', () => {
    mkdirSync(join(root, 'fonts'), { recursive: true })
    writeFileSync(join(root, 'fonts', 'Inter.woff2'), 'FONTDATA')
    const copied = emitFontAssets(dist, root, {
      families: [
        { family: 'Inter', src: 'fonts/Inter.woff2' },
        { family: 'Ghost', src: 'fonts/Missing.woff2' }, // missing → skipped
      ],
    })
    expect(copied).toBe(1)
    expect(existsSync(join(dist, 'fonts', 'Inter.woff2'))).toBe(true)
    expect(readdirSync(join(dist, 'fonts'))).toEqual(['Inter.woff2'])
  })

  it('returns 0 for an empty families list', () => {
    expect(emitFontAssets(dist, root, { families: [] })).toBe(0)
  })
})
