import { describe, expect, it } from 'vitest'
import type { ApexConfig } from '../config/runtime.js'
import { imageConfigPresent, imageDefaultDirectives, imagePlugins } from './imagetools.js'

describe('image transform gating', () => {
  it('reports config presence only when an `image` block exists', () => {
    expect(imageConfigPresent(undefined)).toBe(false)
    expect(imageConfigPresent(null)).toBe(false)
    expect(imageConfigPresent({})).toBe(false)
    expect(imageConfigPresent({ image: {} })).toBe(true)
    expect(imageConfigPresent({ image: { formats: ['webp'] } })).toBe(true)
  })

  it('adds the vite-imagetools plugin when the image block is present', async () => {
    const config: ApexConfig = { image: { formats: ['webp'], quality: 70 } }
    const plugins = await imagePlugins(config)
    expect(plugins).toHaveLength(1)
    // vite-imagetools registers its plugin under the `imagetools` name.
    expect(plugins[0]?.name).toBe('imagetools')
  })

  it('adds no plugin when the image block is absent', async () => {
    expect(await imagePlugins(undefined)).toEqual([])
    expect(await imagePlugins({})).toEqual([])
  })

  it('maps formats + quality onto vite-imagetools default directives', () => {
    const d = imageDefaultDirectives({ formats: ['avif', 'webp'], quality: 80 })
    expect(d.get('format')).toBe('avif;webp')
    expect(d.get('quality')).toBe('80')
    expect(imageDefaultDirectives({}).toString()).toBe('')
  })
})
