// Build-time image transform (#18, 🟡 Experimental). Wraps `vite-imagetools` and
// gates it on the presence of an `image` block in `apex.config.ts` — omit the block
// and no image plugin is ever added (images pass through untouched). The transform
// turns `?w=…&format=…` query candidates (emitted by the `<Image>` kit helper's
// `srcset`, or written directly on an import) into hashed, optimized variants in
// `dist/`.
//
// `vite-imagetools` is loaded dynamically and optionally — like the Tailwind plugin
// in buildClient.ts — so core stays dependency-light and a project that never uses
// the `image` block never pays for it.
import type { Plugin } from 'vite'
import type { ApexConfig, ImageConfig } from '../config/runtime.js'

/** True when the resolved config opts into image optimization. */
export function imageConfigPresent(config?: Pick<ApexConfig, 'image'> | null): boolean {
  return Boolean(config?.image)
}

/**
 * Default `vite-imagetools` directives derived from the `image` config: a global
 * `format`/`quality` applied to every transformed import unless the import overrides
 * them inline. Returned as a `URLSearchParams` (the shape imagetools expects).
 */
export function imageDefaultDirectives(image: ImageConfig): URLSearchParams {
  const params = new URLSearchParams()
  if (image.formats?.length) params.set('format', image.formats.join(';'))
  if (image.quality != null) params.set('quality', String(image.quality))
  return params
}

/**
 * The image-transform plugins for the Vite build, or `[]` when the `image` block is
 * absent or `vite-imagetools` isn't installed. Spread into the client/islands plugin
 * lists.
 */
export async function imagePlugins(config?: Pick<ApexConfig, 'image'> | null): Promise<Plugin[]> {
  if (!imageConfigPresent(config)) return []
  const image = config?.image as ImageConfig
  try {
    const mod = (await import('vite-imagetools')) as {
      imagetools?: (opts?: unknown) => Plugin
      default?: (opts?: unknown) => Plugin
    }
    const factory = mod.imagetools ?? mod.default
    if (typeof factory !== 'function') return []
    const defaults = imageDefaultDirectives(image)
    return [factory(defaults.toString() ? { defaultDirectives: defaults } : {})]
  } catch {
    // vite-imagetools not installed — opt-in, so skip gracefully (like Tailwind).
    return []
  }
}
