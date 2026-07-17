import { describe, expect, it } from 'vitest'
import { image, imageAttrs, imageSrcset } from './image.js'

describe('image() helper', () => {
  it('emits src, explicit dimensions, alt, lazy loading + async decoding', () => {
    const html = image({ src: '/hero.png', width: 800, height: 600, alt: 'Hero' })
    expect(html).toMatch(/^<img /)
    expect(html).toMatch(/ \/>$/)
    expect(html).toContain('src="/hero.png"')
    expect(html).toContain('width="800"')
    expect(html).toContain('height="600"')
    expect(html).toContain('alt="Hero"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('decoding="async"')
  })

  it('builds a retina srcset (width + 2×) and a default sizes when none given', () => {
    const html = image({ src: '/hero.png', width: 400, height: 300 })
    expect(html).toContain('srcset="/hero.png?w=400 400w, /hero.png?w=800 800w"')
    expect(html).toContain('sizes="100vw"')
  })

  it('appends the target format to every srcset candidate as a transform query', () => {
    expect(imageSrcset('/a.png', [640, 1280], 'webp')).toBe(
      '/a.png?w=640&format=webp 640w, /a.png?w=1280&format=webp 1280w',
    )
  })

  it('honours explicit widths, sizes, eager loading, and fetchpriority', () => {
    const html = image({
      src: '/lcp.jpg',
      width: 1200,
      height: 630,
      widths: [640, 1200],
      sizes: '(max-width: 640px) 100vw, 1200px',
      loading: 'eager',
      fetchpriority: 'high',
    })
    expect(html).toContain('srcset="/lcp.jpg?w=640 640w, /lcp.jpg?w=1200 1200w"')
    expect(html).toContain('sizes="(max-width: 640px) 100vw, 1200px"')
    expect(html).toContain('loading="eager"')
    expect(html).toContain('fetchpriority="high"')
  })

  it('omits srcset/sizes when widths is empty', () => {
    const html = image({ src: '/x.png', width: 100, height: 100, widths: [] })
    expect(html).not.toContain('srcset')
    expect(html).not.toContain('sizes')
  })

  it('preserves an existing query on src when adding width candidates', () => {
    expect(imageSrcset('/x.png?v=2', [200], 'avif')).toBe('/x.png?v=2&w=200&format=avif 200w')
  })

  it('escapes alt text and always emits the attribute (decorative default)', () => {
    expect(image({ src: '/x.png', width: 1, height: 1, alt: 'A & "B"' })).toContain(
      'alt="A &amp; &quot;B&quot;"',
    )
    expect(image({ src: '/x.png', width: 1, height: 1 })).toContain('alt=""')
  })

  it('imageAttrs returns the structured attribute map', () => {
    const attrs = imageAttrs({ src: '/x.png', width: 320, height: 240, format: 'webp' })
    expect(attrs).toMatchObject({
      src: '/x.png',
      width: '320',
      height: '240',
      loading: 'lazy',
      decoding: 'async',
      sizes: '100vw',
    })
    expect(attrs.srcset).toBe('/x.png?w=320&format=webp 320w, /x.png?w=640&format=webp 640w')
  })

  it('de-duplicates identical default + explicit widths', () => {
    // width*2 === an explicit candidate should not double up.
    expect(
      imageAttrs({ src: '/x.png', width: 400, widths: [400, 400, 800], height: 1 }).srcset,
    ).toBe('/x.png?w=400 400w, /x.png?w=800 800w')
  })
})
