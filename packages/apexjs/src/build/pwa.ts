// PWA build outputs (#15, 🟡 Experimental) — a web manifest + a small hand-rolled service
// worker. Deliberately NOT vite-plugin-pwa/workbox: Apex has no index.html for a plugin to
// transform (the HTML shells are string-built in renderPage/islands), and the full precache
// list is known right here at build time — so a ~60-line generated worker keeps core
// dependency-light while covering the install/offline story.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { PwaConfig } from '../config/runtime.js'

// Re-exported for convenience — defined in config/runtime.ts (dependency-light) so the
// renderers can import them without dragging node:fs/crypto into the mobile bundle.
export { pwaHeadTags, pwaRegisterScript } from '../config/runtime.js'

/** The default icon set `apex extend pwa` scaffolds into `public/icons/`. */
const DEFAULT_ICONS = [
  { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
  { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
  { src: '/icons/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
]

/** Build the `manifest.webmanifest` JSON for a `pwa` config block. */
export function buildWebManifest(pwa: PwaConfig): string {
  const themeColor = pwa.themeColor ?? '#0a0e1a'
  return JSON.stringify(
    {
      name: pwa.name,
      short_name: pwa.shortName ?? pwa.name,
      start_url: '/',
      display: 'standalone',
      theme_color: themeColor,
      background_color: pwa.backgroundColor ?? themeColor,
      ...(pwa.description ? { description: pwa.description } : {}),
      icons: pwa.icons ?? DEFAULT_ICONS,
    },
    null,
    2,
  )
}

/** The icons `generatePwaIcons` produces from the app's favicon (matches DEFAULT_ICONS). */
const GENERATED_ICONS = [
  { file: 'pwa-192.png', size: 192, maskable: false },
  { file: 'pwa-512.png', size: 512, maskable: false },
  { file: 'pwa-maskable-512.png', size: 512, maskable: true },
] as const

/** Lazily load the SVG rasterizer. Optional — `apex extend pwa` adds it, but an app that
 * hand-writes a `pwa` block may not have it, so we degrade gracefully with a hint. */
type ResvgCtor = new (
  svg: string,
  opts?: { fitTo?: { mode: 'width'; value: number }; background?: string },
) => { render(): { asPng(): Buffer } }
async function loadResvg(): Promise<ResvgCtor | null> {
  try {
    return ((await import('@resvg/resvg-js')) as { Resvg: ResvgCtor }).Resvg
  } catch {
    return null
  }
}

/** Rasterize an SVG string to a square PNG of `size` px (transparent background). */
function renderIcon(Resvg: ResvgCtor, svg: string, size: number): Buffer {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)',
  })
    .render()
    .asPng()
}

/** A maskable icon: the favicon centered at 80% on a solid background (10% safe-zone padding),
 * so the OS mask (circle / squircle) never clips the mark. Wraps the favicon in a nested <svg>. */
function renderMaskable(Resvg: ResvgCtor, svg: string, size: number, bg: string): Buffer {
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1] ?? '0 0 64 64'
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  const pad = Math.round(size * 0.1)
  const innerSize = size - pad * 2
  const wrapped = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${bg}"/><svg x="${pad}" y="${pad}" width="${innerSize}" height="${innerSize}" viewBox="${viewBox}">${inner}</svg></svg>`
  return new Resvg(wrapped, { fitTo: { mode: 'width', value: size } }).render().asPng()
}

/**
 * Generate PWA icons from the app's `public/favicon.svg` into `<dist>/icons/`, so the installed
 * app icon matches the app's own brand — change the favicon, the icons follow. Skips any icon the
 * user already supplied (a `public/icons/pwa-*.png` copied into dist) and does nothing when the
 * `pwa.icons` config is set explicitly. Returns the number of icons generated. Requires
 * `@resvg/resvg-js` (added by `apex extend pwa`); without it, warns and leaves icons to the user.
 */
export async function generatePwaIcons(
  root: string,
  distDir: string,
  pwa: PwaConfig,
): Promise<number> {
  if (pwa.icons) return 0 // explicit config wins — never touch it
  const iconsDir = join(distDir, 'icons')
  const missing = GENERATED_ICONS.filter((t) => !existsSync(join(iconsDir, t.file)))
  if (!missing.length) return 0 // user provided their own icons (already copied from public/)

  const favicon = join(root, 'public', 'favicon.svg')
  if (!existsSync(favicon)) {
    console.warn(
      '  ⚠ PWA: no public/favicon.svg to generate icons from — add public/icons/pwa-{192,512,maskable-512}.png yourself.',
    )
    return 0
  }
  const Resvg = await loadResvg()
  if (!Resvg) {
    console.warn(
      '  ⚠ PWA: install @resvg/resvg-js to auto-generate icons from your favicon, or add public/icons/pwa-{192,512,maskable-512}.png.',
    )
    return 0
  }

  mkdirSync(iconsDir, { recursive: true })
  const svg = readFileSync(favicon, 'utf8')
  const bg = pwa.backgroundColor ?? pwa.themeColor ?? '#0a0e1a'
  for (const t of missing) {
    const png = t.maskable ? renderMaskable(Resvg, svg, t.size, bg) : renderIcon(Resvg, svg, t.size)
    writeFileSync(join(iconsDir, t.file), png)
  }
  return missing.length
}

/** Files that don't belong in a precache (the worker itself, build metadata, sourcemaps). */
const SKIP = new Set(['sw.js'])
const SKIP_DIRS = new Set(['.vite', 'server', 'mobile'])

/** Every precache-able file under `dist`, as root-relative URLs (`/about/index.html`, …). */
export function collectPrecacheUrls(distDir: string): string[] {
  const urls: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) {
        if (!SKIP_DIRS.has(name)) walk(full)
        continue
      }
      if (SKIP.has(name) || name.endsWith('.map')) continue
      urls.push(`/${relative(distDir, full).replace(/\\/g, '/')}`)
    }
  }
  walk(distDir)
  return urls.sort()
}

/**
 * The generated service worker. Precached URLs are served cache-first; navigations are
 * network-first with a cache fallback (offline). The cache name carries a content hash of
 * the precache list, so a new deploy activates a fresh cache and deletes the old one.
 */
export function buildServiceWorker(urls: string[]): string {
  // `/x/index.html` is reachable as `/x/` (and `/`), so cache those keys too.
  const withAliases = [
    ...new Set(
      urls.flatMap((u) => {
        if (!u.endsWith('/index.html')) return [u]
        const dir = u.slice(0, -'index.html'.length)
        return [u, dir === '/' ? '/' : dir]
      }),
    ),
  ].sort()
  const version = createHash('sha256').update(withAliases.join('\n')).digest('hex').slice(0, 12)
  return `// Generated by \`apex build\` — do not edit. Precache-and-offline service worker.
const CACHE = 'apex-${version}'
const PRECACHE = ${JSON.stringify(withAliases)}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Navigations: network-first (fresh content online), cache fallback (offline).
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
          return res
        })
        .catch(() =>
          caches.match(req).then(
            (hit) => hit ?? caches.match(url.pathname.endsWith('/') ? url.pathname + 'index.html' : '/'),
          ),
        ),
    )
    return
  }

  // Everything else (hashed assets, manifest, icons): cache-first.
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ??
        fetch(req).then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
          return res
        }),
    ),
  )
})
`
}

/** Write `manifest.webmanifest` + `sw.js` into a built `dist` dir. Returns the file count precached. */
export function emitPwaAssets(distDir: string, pwa: PwaConfig): number {
  writeFileSync(join(distDir, 'manifest.webmanifest'), buildWebManifest(pwa))
  const urls = collectPrecacheUrls(distDir)
  writeFileSync(join(distDir, 'sw.js'), buildServiceWorker(urls))
  return urls.length
}
