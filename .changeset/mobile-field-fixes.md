---
"@apex-stack/core": patch
"create-apexjs": patch
---

Mobile fixes from a real on-device build (canvas game APK):

- **Build shims** (`apex build --mobile`): the bundled `fs/promises` shim now exports `rm` (and the
  full surface, so no lib's named import breaks the build), and `require('crypto')` / `require('node:crypto')`
  return a working shim (`randomBytes`/`randomUUID`/`getRandomValues`/`timingSafeEqual`; hash fns fail loud
  instead of crashing boot). `require()` also normalizes the `node:` prefix. Previously these were a build
  error (`rm` missing) and an on-device boot crash (`require('crypto')`).
- **Native shell asset serving** (Android `ApexInterceptor` + iOS `ApexSchemeHandler`): the WebView/scheme
  handler now serves **any** bundled static file (sprites, audio, images, fonts, manifest…), not just
  `/assets/` + favicon — extensionless paths still route to the SSR engine. Fixed the iOS nested-path bug
  (subdir was only the last component) and expanded the MIME map (image/audio/video/font/wasm). Previously
  non-`/assets/` files 404'd on-device → broken `<img>` → canvas `drawImage` threw.
- **Docs**: bumped the stale site version (v0.17 → v0.43) + example deps, and documented the
  `<script client>` island-scope gotcha (imports are page-root-only, not in `client:*` islands).
