---
"@apex-stack/core": minor
"create-apexjs": patch
---

PWA support (#15). 🟡 Experimental. Declare a `pwa` block and `apex build` makes the app
installable + offline:

```ts
export default defineConfig({
  pwa: { name: 'My Apex App' },
})
```

- The build emits `manifest.webmanifest` + a small generated **service worker** (`sw.js`) that
  precaches the built site — content-hashed cache name, so a new deploy activates a fresh cache
  and cleans the old one. The HTML shells (default + islands) automatically link the manifest and
  theme color and register the worker.
- `apex build` / `--islands` precache the whole dist (full offline). `apex build --server`
  precaches assets; pages are served network-first with a cache fallback, and `apex start` serves
  the correct `application/manifest+json` MIME + `Cache-Control: no-cache` on `/sw.js`.
- **`apex extend pwa`** scaffolds default icons (`public/icons/pwa-{192,512,maskable-512}.png`)
  and the config block; also offered by `apex new` (or `--pwa`). `gen-mobile-assets` emits the PWA
  sizes from `--icon` too.

Zero new dependencies — the worker is generated (~60 lines) rather than pulling in
vite-plugin-pwa/workbox, since Apex's HTML shells are string-built (no index.html to transform)
and the precache list is fully known at build time.
