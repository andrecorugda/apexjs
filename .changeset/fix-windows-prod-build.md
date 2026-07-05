---
'@apex-stack/core': patch
---

Fix `apex start` crashing on Windows with `TypeError: The "path" argument must be
of type string. Received undefined`.

`buildServer` matched built chunks to source pages by comparing `join(root, id)`
(backslashes on Windows) against rollup's `facadeModuleId` (always forward slashes).
On Windows the lookup missed, so every route's `serverFile` was `undefined` in the
manifest and the prod server threw on the first request. Both sides are now
normalized to forward slashes. No effect on macOS/Linux (already forward-slashed).
