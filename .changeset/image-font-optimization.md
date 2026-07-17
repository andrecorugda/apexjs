---
"@apex-stack/core": minor
"@apex-stack/kit": minor
---

Build-time image & font optimization (🟡 Experimental) — Apex matches Next/Nuxt on the
`Image / font optimization` axis.

- **`<Image>` kit helper** (`@apex-stack/kit` → `image`, `imageAttrs`, `imageSrcset`) — a pure,
  browser-safe function that emits a responsive, layout-stable `<img>`: `srcset` candidates
  (retina by default, or your configured widths), `sizes`, explicit `width`/`height` to avoid CLS,
  and `loading="lazy"`/`decoding="async"` defaults.
- **Image transform** — an optional `image` block in `apex.config.ts` wires `vite-imagetools` into
  the client build for the default (`apex build`, prerender+hydrate) and `--server` targets (gated on
  config presence), turning `?w=…&format=…` candidates into
  hashed, optimized variants under `dist/`.
- **Self-hosted fonts** — a `fonts` block copies declared font files into `dist/fonts/`, emits the
  matching `@font-face` rules, and injects `<link rel="preload" as="font" crossorigin>` hints into
  the page shell — no third-party request, no FOIT/FOUT.
- Types-only `image?` / `fonts?` blocks added to `ApexConfig` (runtime.ts stays browser-safe).
