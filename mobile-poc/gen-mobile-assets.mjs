// gen-mobile-assets.mjs — reference for `apex build --mobile` asset generation.
// One source icon (+ optional splash) → all native launcher/adaptive/appicon assets.
//   node gen-mobile-assets.mjs <icon.png> [--out ./native-shell/android] [--splash splash.png] [--bg '#0b0b0b']
//
// STATIC native assets only (icons + cold-start splash). The ANIMATED splash is a
// `pages/splash.alpine` route the shell renders first — no generation, it's just a page.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const args = process.argv.slice(2)
const srcIcon = args[0]
const outIdx = args.indexOf('--out')
const androidDir = outIdx >= 0 ? args[outIdx + 1] : './native-shell/android'
const out = `${androidDir}/app/src/main/res`
const splash = args.includes('--splash') ? args[args.indexOf('--splash') + 1] : null
const bg = args.includes('--bg') ? args[args.indexOf('--bg') + 1] : '#0b0b0b'
if (!srcIcon) throw new Error('usage: gen-mobile-assets.mjs <icon.png> [--out dir] [--splash s.png] [--bg #hex]')

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
write('./native-shell/android/play_store_512.png', await sharp(srcIcon).resize(512, 512).png().toBuffer())

// ── Static cold-start splash (Android 12+ theme uses a centered icon on bg) ─────────
if (splash) {
  for (const [d, px] of Object.entries({ mdpi: 288, hdpi: 432, xhdpi: 576, xxhdpi: 864, xxxhdpi: 1152 })) {
    write(join(out, `drawable-${d}`, 'splash.png'),
      await sharp(splash).resize(px, px, { fit: 'contain', background: bg }).png().toBuffer())
  }
}

// ── iOS AppIcon.appiconset (single-size 1024, Xcode 14+ format) ─────────────────────
const iosDir = './native-shell/ios/Assets.xcassets/AppIcon.appiconset'
write(join(iosDir, 'icon-1024.png'), await sharp(srcIcon).resize(1024, 1024).flatten({ background: bg }).png().toBuffer())
write(join(iosDir, 'Contents.json'), JSON.stringify({
  images: [{ filename: 'icon-1024.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }],
  info: { author: 'apex', version: 1 },
}, null, 2))

console.log('✓ Android: mipmap-* (5 densities) launcher + round + adaptive foreground + ic_launcher.xml + bg color')
console.log('✓ Android: play_store_512.png' + (splash ? ' + drawable-*/splash.png' : ''))
console.log('✓ iOS: AppIcon.appiconset (1024 + Contents.json)')
console.log('  (Animated splash = pages/splash.alpine — rendered by the shell first, no generation.)')
