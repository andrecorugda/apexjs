---
"@apex-stack/vite": minor
"@apex-stack/core": minor
---

Plugin magics with a global form (e.g. `$persist`) now work in a page's **root**
`<template x-data>`.

A page root's `x-data` compiles into an `Alpine.data` factory (ordinary JS), where
a bare `$persist(0)` was a `ReferenceError` — even though it worked in a nested
`x-data`. Apex now rewrites non-core `$magic(…)` calls in the root expression to
Alpine's global form (`Alpine.$persist(…)`, the shape Alpine documents for use inside
a data factory): a server-safe no-op during SSR, re-bound to the real magic on
hydration, so it persists across reloads without throwing. A magic with no global
form degrades to a no-op at the root (use a nested `x-data` for those). Core magics
(`$el`, `$store`, `$refs`, …) and composable calls are left untouched. Fixes #47.
