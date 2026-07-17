// The `<Image>` kit helper — a pure, dependency-free function that emits a
// responsive, layout-stable `<img>` string. It pairs with the build-time image
// transform (`vite-imagetools`, wired in @apex-stack/core's build) which turns
// the `?w=…&format=…` query candidates in `srcset` into hashed, optimized
// variants under `dist/`.
//
// Deliberately pure (no DOM, no node, no imports): it's browser-safe and runs the
// same way in an SSR loader, a template helper, or the client — mirroring how the
// rest of kit keeps its markup emitters side-effect free.

/** Options for {@link image} / {@link imageAttrs}. */
export interface ImageOptions {
  /** Image URL/import path. Query candidates are appended to build `srcset`. */
  src: string
  /** Intrinsic width in px. Emitted as the `width` attribute to reserve layout (avoid CLS). */
  width: number
  /** Intrinsic height in px. Emitted as the `height` attribute to reserve layout (avoid CLS). */
  height: number
  /** Alt text. Defaults to `""` (decorative) — always emitted so the attribute is present. */
  alt?: string
  /**
   * `srcset` candidate widths (px). Defaults to the intrinsic width plus its 2× retina
   * variant (`[width, width*2]`), de-duplicated. Pass an explicit list to match the
   * `image.sizes` you configured, or `[]` to omit `srcset` entirely.
   */
  widths?: number[]
  /**
   * The `sizes` attribute. Defaults to `100vw` when a `srcset` is emitted (the browser
   * then picks the best candidate). Ignored when there is no `srcset`.
   */
  sizes?: string
  /** Target format appended to each `srcset` candidate (`?format=webp`) for the transform. */
  format?: string
  /** Loading strategy. Defaults to `lazy`; use `eager` for above-the-fold hero images. */
  loading?: 'lazy' | 'eager'
  /** Decoding hint. Defaults to `async`. */
  decoding?: 'async' | 'sync' | 'auto'
  /** Fetch priority hint (`high` for LCP images). Omitted by default. */
  fetchpriority?: 'high' | 'low' | 'auto'
  /** `class` attribute passthrough. */
  class?: string
}

/** Append an image-transform query (`?w=…&format=…`) to a src, preserving any existing query. */
function withImageQuery(src: string, width: number, format?: string): string {
  const sep = src.includes('?') ? '&' : '?'
  const params = format ? `w=${width}&format=${format}` : `w=${width}`
  return `${src}${sep}${params}`
}

/** Minimal HTML-attribute escaping for values placed inside double quotes. */
function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/** Build the responsive `srcset` string for the given widths, or `''` when none. */
export function imageSrcset(src: string, widths: number[], format?: string): string {
  return widths.map((w) => `${withImageQuery(src, w, format)} ${w}w`).join(', ')
}

/**
 * Compute the resolved `<img>` attributes for an image — the structured form behind
 * {@link image}. Useful when you need to spread the attributes into another renderer.
 */
export function imageAttrs(opts: ImageOptions): Record<string, string> {
  const { src, width, height, alt = '', format, sizes } = opts
  const widths = [...new Set(opts.widths ?? [width, width * 2])].filter((w) => w > 0)
  const attrs: Record<string, string> = {
    src,
    width: String(width),
    height: String(height),
    alt,
    loading: opts.loading ?? 'lazy',
    decoding: opts.decoding ?? 'async',
  }
  if (widths.length > 0) {
    attrs.srcset = imageSrcset(src, widths, format)
    attrs.sizes = sizes ?? '100vw'
  }
  if (opts.fetchpriority) attrs.fetchpriority = opts.fetchpriority
  if (opts.class) attrs.class = opts.class
  return attrs
}

/**
 * Render a responsive, layout-stable `<img>` element as an HTML string.
 *
 * ```ts
 * image({ src: '/hero.png', width: 800, height: 600, alt: 'Hero', format: 'webp' })
 * // → <img src="/hero.png" width="800" height="600" alt="Hero"
 * //        loading="lazy" decoding="async"
 * //        srcset="/hero.png?w=800&format=webp 800w, /hero.png?w=1600&format=webp 1600w"
 * //        sizes="100vw" />
 * ```
 */
export function image(opts: ImageOptions): string {
  const attrs = imageAttrs(opts)
  // Stable, readable attribute order: src first, then the rest as inserted.
  const rendered = Object.entries(attrs)
    .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
    .join(' ')
  return `<img ${rendered} />`
}
