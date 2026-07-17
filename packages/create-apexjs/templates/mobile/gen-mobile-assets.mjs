// gen-mobile-assets.mjs — reference for `apex build --mobile` asset generation.
// One source icon (+ optional splash) → all native launcher/adaptive/appicon assets.
//   node gen-mobile-assets.mjs <icon.png> [--out ./native-shell/android] [--splash splash.png] [--bg '#0b0b0b']
//
// STATIC native assets only (icons + cold-start splash). The ANIMATED splash is a
// `pages/splash.alpine` route the shell renders first — no generation, it's just a page.
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

// Resolve `sharp` from wherever the command RUNS (the app root), not this script's dir — ESM
// `import 'sharp'` (and NODE_PATH) resolve relative to the file, so a `sharp` installed in the
// app wouldn't be found. `npm i -D sharp` in your app, then run the assembler from the app root.
let sharp
try {
  sharp = (await import('sharp')).default
} catch {
  try {
    sharp = createRequire(pathToFileURL(join(process.cwd(), 'x.js')).href)('sharp')
  } catch {
    console.error('  ✗ `sharp` not found — run `npm i -D sharp` in your app, then re-run.')
    process.exit(1)
  }
}

const args = process.argv.slice(2)
const srcIcon = args[0]
const outIdx = args.indexOf('--out')
const androidDir = outIdx >= 0 ? args[outIdx + 1] : './native-shell/android'
const out = `${androidDir}/app/src/main/res`
const splash = args.includes('--splash') ? args[args.indexOf('--splash') + 1] : null
const bg = args.includes('--bg') ? args[args.indexOf('--bg') + 1] : '#0b0b0b'
if (!srcIcon)
  throw new Error(
    'usage: gen-mobile-assets.mjs <icon.png> [--out dir] [--splash s.png] [--bg #hex]',
  )

const write = (p, buf) => {
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, buf)
}

// ── Android launcher icons (legacy square, all densities) ─────────────────────────
const DENSITIES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
for (const [d, px] of Object.entries(DENSITIES)) {
  const png = await sharp(srcIcon).resize(px, px, { fit: 'cover' }).png().toBuffer()
  write(join(out, `mipmap-${d}`, 'ic_launcher.png'), png)
  write(join(out, `mipmap-${d}`, 'ic_launcher_round.png'), png)
}

// ── Adaptive icon (API 26+): foreground layer at 108dp per density + XML + bg color ──
// Foreground art occupies the inner ~66dp safe zone; we pad the source into 108dp.
const FG = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 }
for (const [d, px] of Object.entries(FG)) {
  const inner = Math.round(px * 0.62)
  const fg = await sharp(srcIcon)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: Math.round((px - inner) / 2),
      bottom: Math.round((px - inner) / 2),
      left: Math.round((px - inner) / 2),
      right: Math.round((px - inner) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
  write(join(out, `mipmap-${d}`, 'ic_launcher_foreground.png'), fg)
}
write(
  join(out, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <color name="ic_launcher_background">${bg}</color>\n</resources>\n`,
)
const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/ic_launcher_background" />
  <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>\n`
write(join(out, 'mipmap-anydpi-v26', 'ic_launcher.xml'), adaptiveXml)
write(join(out, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'), adaptiveXml)

// ── Play Store icon (512) ─────────────────────────────────────────────────────────
write(
  './native-shell/android/play_store_512.png',
  await sharp(srcIcon).resize(512, 512).png().toBuffer(),
)

// PWA icons (public/icons/) — the manifest set `apex build` links when `pwa` is configured.
// Maskable: the safe zone is the inner ~80% circle, so the mark sits at ~55% with padding.
const pwaOut = './public/icons'
for (const px of [192, 512]) {
  write(
    join(pwaOut, `pwa-${px}.png`),
    await sharp(srcIcon).resize(px, px, { fit: 'contain', background: bg }).png().toBuffer(),
  )
}
{
  const inner = Math.round(512 * 0.55)
  const mark = await sharp(srcIcon)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  write(
    join(pwaOut, 'pwa-maskable-512.png'),
    await sharp({ create: { width: 512, height: 512, channels: 4, background: bg } })
      .composite([{ input: mark, gravity: 'centre' }])
      .png()
      .toBuffer(),
  )
}
console.log('✓ PWA icons → public/icons/pwa-{192,512,maskable-512}.png')

// ── Static cold-start splash (Android 12+ theme uses a centered icon on bg) ─────────
if (splash) {
  for (const [d, px] of Object.entries({
    mdpi: 288,
    hdpi: 432,
    xhdpi: 576,
    xxhdpi: 864,
    xxxhdpi: 1152,
  })) {
    write(
      join(out, `drawable-${d}`, 'splash.png'),
      await sharp(splash).resize(px, px, { fit: 'contain', background: bg }).png().toBuffer(),
    )
  }
}

// ── iOS AppIcon.appiconset (single-size 1024, Xcode 14+ format) ─────────────────────
const iosDir = './native-shell/ios/Assets.xcassets/AppIcon.appiconset'
write(
  join(iosDir, 'icon-1024.png'),
  await sharp(srcIcon).resize(1024, 1024).flatten({ background: bg }).png().toBuffer(),
)
write(
  join(iosDir, 'Contents.json'),
  JSON.stringify(
    {
      images: [
        { filename: 'icon-1024.png', idiom: 'universal', platform: 'ios', size: '1024x1024' },
      ],
      info: { author: 'apex', version: 1 },
    },
    null,
    2,
  ),
)

console.log(
  '✓ Android: mipmap-* (5 densities) launcher + round + adaptive foreground + ic_launcher.xml + bg color',
)
console.log(`✓ Android: play_store_512.png${splash ? ' + drawable-*/splash.png' : ''}`)
console.log('✓ iOS: AppIcon.appiconset (1024 + Contents.json)')
console.log(
  '  (Animated splash = pages/splash.alpine — rendered by the shell first, no generation.)',
)
