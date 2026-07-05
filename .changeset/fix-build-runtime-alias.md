---
'@apex-stack/core': patch
---

Fix `apex build` failing with `"installNav" is not exported by @apex-stack/core/client`
when the project's installed `@apex-stack/core` is older than the global CLI.

The client build now aliases the runtime leaf modules (`@apex-stack/core/client`,
`@apex-stack/kit/client`, `alpinejs`) to the CLI's own copies — the same thing the
dev server already does — so the bundle always uses the CLI's matching runtime
instead of a stale/mismatched one in the project's `node_modules`. Only the leaf
runtime modules are aliased (not the bare `@apex-stack/core` package), so a
`{ defineStore }` import can't drag the server CLI into the client bundle.
