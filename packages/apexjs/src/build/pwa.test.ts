import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  buildServiceWorker,
  buildWebManifest,
  collectPrecacheUrls,
  emitPwaAssets,
  pwaHeadTags,
  pwaRegisterScript,
} from './pwa.js'

describe('buildWebManifest', () => {
  it('applies sensible defaults', () => {
    const m = JSON.parse(buildWebManifest({ name: 'My App' }))
    expect(m).toMatchObject({
      name: 'My App',
      short_name: 'My App',
      start_url: '/',
      display: 'standalone',
      theme_color: '#0a0e1a',
      background_color: '#0a0e1a',
    })
    expect(m.icons.map((i: { src: string }) => i.src)).toEqual([
      '/icons/pwa-192.png',
      '/icons/pwa-512.png',
      '/icons/pwa-maskable-512.png',
    ])
  })

  it('honours custom values (shortName, colors, icons)', () => {
    const m = JSON.parse(
      buildWebManifest({
        name: 'Long Name',
        shortName: 'LN',
        themeColor: '#123456',
        backgroundColor: '#ffffff',
        description: 'd',
        icons: [{ src: '/i.png', sizes: '512x512' }],
      }),
    )
    expect(m.short_name).toBe('LN')
    expect(m.theme_color).toBe('#123456')
    expect(m.background_color).toBe('#ffffff')
    expect(m.description).toBe('d')
    expect(m.icons).toEqual([{ src: '/i.png', sizes: '512x512' }])
  })
})

describe('precache collection + service worker', () => {
  const dist = mkdtempSync(join(tmpdir(), 'apex-pwa-'))
  afterAll(() => rmSync(dist, { recursive: true, force: true }))

  it('collects the dist tree, skipping server/mobile/.vite, maps, and sw.js itself', () => {
    writeFileSync(join(dist, 'index.html'), 'x')
    mkdirSync(join(dist, 'about'), { recursive: true })
    writeFileSync(join(dist, 'about', 'index.html'), 'x')
    mkdirSync(join(dist, 'assets'), { recursive: true })
    writeFileSync(join(dist, 'assets', 'app-abc123.js'), 'x')
    writeFileSync(join(dist, 'assets', 'app-abc123.js.map'), 'x') // skipped
    writeFileSync(join(dist, 'favicon.svg'), 'x')
    writeFileSync(join(dist, 'sw.js'), 'x') // skipped (the worker itself)
    for (const d of ['server', 'mobile', '.vite']) {
      mkdirSync(join(dist, d), { recursive: true })
      writeFileSync(join(dist, d, 'x.mjs'), 'x') // skipped dirs
    }
    expect(collectPrecacheUrls(dist)).toEqual([
      '/about/index.html',
      '/assets/app-abc123.js',
      '/favicon.svg',
      '/index.html',
    ])
  })

  it('the worker precaches URL aliases for index.html files and versions the cache by content', () => {
    const sw = buildServiceWorker(['/index.html', '/about/index.html', '/assets/a.js'])
    const list = JSON.parse(sw.match(/const PRECACHE = (\[.*?\])/s)?.[1] ?? '[]')
    expect(list).toEqual(['/', '/about/', '/about/index.html', '/assets/a.js', '/index.html'])
    expect(sw).toMatch(/const CACHE = 'apex-[0-9a-f]{12}'/)
    // Deterministic + content-addressed: same list → same version, different list → different.
    expect(buildServiceWorker(['/index.html'])).not.toContain(
      sw.match(/apex-[0-9a-f]{12}/)?.[0] ?? 'never',
    )
    expect(buildServiceWorker(['/index.html', '/about/index.html', '/assets/a.js'])).toContain(
      sw.match(/apex-[0-9a-f]{12}/)?.[0] ?? 'never',
    )
  })

  it('emitPwaAssets writes manifest.webmanifest + sw.js into dist', () => {
    const count = emitPwaAssets(dist, { name: 'App' })
    expect(count).toBeGreaterThan(0)
    expect(JSON.parse(readFileSync(join(dist, 'manifest.webmanifest'), 'utf8')).name).toBe('App')
    const sw = readFileSync(join(dist, 'sw.js'), 'utf8')
    expect(sw).toContain("const CACHE = 'apex-")
    expect(sw).toContain('/about/index.html') // precache list embedded
  })
})

describe('shell fragments', () => {
  it('head tags link the manifest + theme color', () => {
    const tags = pwaHeadTags({ name: 'x', themeColor: '#abc' })
    expect(tags).toContain('<link rel="manifest" href="/manifest.webmanifest" />')
    expect(tags).toContain('<meta name="theme-color" content="#abc" />')
  })
  it('the register script registers /sw.js after load', () => {
    const s = pwaRegisterScript()
    expect(s).toContain("navigator.serviceWorker.register('/sw.js')")
    expect(s).toContain("'serviceWorker' in navigator")
  })
})
