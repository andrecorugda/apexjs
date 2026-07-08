---
"@apex-stack/core": patch
---

Fix `createTestApp({ root })` — load the app's modules through Vite's SSR loader (like
`apex dev`) instead of a native `import()` of a `file://` URL. The native path only
transformed the top file, so any extensionless or TypeScript relative import in the
route graph (idiomatic in Vite/Apex — e.g. `import { X } from '../../services/X'`) threw
`ERR_MODULE_NOT_FOUND`. The whole graph now resolves correctly; Vite is closed on
`app.close()`.
