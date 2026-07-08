---
'@apex-stack/core': patch
---

Fix component-level server loaders never running in `apex build --server`.

The prod server built its component registry inline and dropped the `loader` (and
`componentId`) — so an embedded component's `<script server>` loader never ran under
`apex start`: its data was missing, inner `x-for` didn't populate, and a throwing
loader silently returned 200. (Dev worked; only the built Node-server target was
affected.) Dev and prod now share one `toComponentEntry(mod)` mapping, so the loader
can't be dropped in one path. Verified against a built prod module + regression tests.
