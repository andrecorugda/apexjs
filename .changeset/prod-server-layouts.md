---
'@apex-stack/core': patch
---

Apply layouts in the `apex build --server` production target.

The Node-server target rendered pages without their `layouts/*.alpine` wrapper — so
the shared navbar/footer/theme chrome went missing in `apex start` (static `apex build`
already applied layouts). `buildServer` now SSR-builds layout modules, the manifest
carries them, and the prod server passes the layout chain to the renderer — matching
dev and the static build. Verified: navbar + footer render on every route in a built
`--server` app.
