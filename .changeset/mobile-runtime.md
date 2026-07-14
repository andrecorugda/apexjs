---
"@apex-stack/core": minor
---

Mobile runtime (beta). Run Apex's full SSR + API pipeline on a phone.

- **`apex dev --mobile`** — the primary mobile dev loop: prints the LAN URL and wires
  `adb reverse` so an emulator/device WebView hits the dev server with live HMR (SSR + API run
  on your machine, like Metro).
- **`apex build --mobile`** — the offline release bundle: manifest → static module registry +
  a VFS + a pure-JS runtime shim → one self-contained `dist/mobile/server.mjs` that runs on a
  bare on-device engine (Hermes/QuickJS), no Node. Auto-detects + reports routes that need
  on-device drivers (`crypto.subtle` / `@libsql/client/web`).
- **`createProdApp` / `createProdWebHandler`** accept an optional `loadModule` — the mobile
  seam (a static registry instead of dynamic `import()`). Backward-compatible.
