// Self-hosted font build outputs (#18, 🟡 Experimental). Declare a `fonts` block in
// `apex.config.ts` and `apex build` copies the declared font files into `dist/fonts/`,
// emits the matching `@font-face` rules, and injects `<link rel="preload" as="font"
// crossorigin>` hints into the page shell — so web text paints without a third-party
// request and without a flash of invisible/unstyled text.
//
// The head-tag builder ({@link fontHeadTags}) is a pure string function (no node deps),
// so a renderer can embed it; the copy step ({@link emitFontAssets}) uses node:fs and
// only runs at build time.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import type { FontConfig, FontFamily } from '../config/runtime.js'

/** The public URL a declared font resolves to once copied under `dist/fonts/`. */
export function fontHref(font: FontFamily): string {
  return `/fonts/${basename(font.src)}`
}

/** CSS `@font-face` `src` format() keyword inferred from the file extension. */
export function fontFormat(font: FontFamily): string {
  if (font.format) return font.format
  const ext = font.src.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'woff2':
      return 'woff2'
    case 'woff':
      return 'woff'
    case 'ttf':
      return 'truetype'
    case 'otf':
      return 'opentype'
    case 'eot':
      return 'embedded-opentype'
    default:
      return ext ?? 'woff2'
  }
}

/** The `type` attribute for a preload `<link>` (`font/woff2`, …). */
export function fontMime(font: FontFamily): string {
  const ext = font.src.split('.').pop()?.toLowerCase()
  return `font/${ext ?? 'woff2'}`
}

/** One `@font-face` CSS rule for a declared family. */
export function fontFaceRule(font: FontFamily, display: string): string {
  const parts = [
    `font-family:"${font.family}"`,
    `font-style:${font.style ?? 'normal'}`,
    `font-weight:${font.weight ?? 400}`,
    `font-display:${display}`,
    `src:url("${fontHref(font)}") format("${fontFormat(font)}")`,
  ]
  return `@font-face{${parts.join(';')}}`
}

/**
 * The `<head>` fragment for a `fonts` config: a `<style>` with every `@font-face` rule
 * plus (unless `preload:false`) a `<link rel="preload" as="font" crossorigin>` per face.
 * Pure string builder — safe to call from a renderer.
 */
export function fontHeadTags(fonts: FontConfig): string {
  if (!fonts.families?.length) return ''
  const display = fonts.display ?? 'swap'
  const style = `<style>${fonts.families.map((f) => fontFaceRule(f, display)).join('')}</style>`
  if (fonts.preload === false) return style
  const preloads = fonts.families
    .map(
      (f) =>
        `<link rel="preload" as="font" type="${fontMime(f)}" href="${fontHref(f)}" crossorigin />`,
    )
    .join('\n  ')
  return `${style}\n  ${preloads}`
}

/**
 * Copy every declared font file into `<distDir>/fonts/`. `root` is the project root the
 * `src` paths are resolved against. Returns the number of files copied (missing sources
 * are skipped — the `@font-face`/preload tags still reference the expected href).
 */
export function emitFontAssets(distDir: string, root: string, fonts: FontConfig): number {
  if (!fonts.families?.length) return 0
  const fontsDir = join(distDir, 'fonts')
  mkdirSync(fontsDir, { recursive: true })
  let copied = 0
  const seen = new Set<string>()
  for (const font of fonts.families) {
    const name = basename(font.src)
    if (seen.has(name)) continue
    seen.add(name)
    const from = join(root, font.src)
    if (!existsSync(from)) continue
    copyFileSync(from, join(fontsDir, name))
    copied++
  }
  return copied
}
