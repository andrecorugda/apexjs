---
"@apex-stack/kit": patch
"@apex-stack/vite": patch
"@apex-stack/core": patch
---

Fix #51: a page's root `<template>` now carries directives other than `x-data` (`x-init`,
`x-effect`, `@events`, …) onto the emitted root element, so Alpine runs them on hydration.
Previously they were silently dropped.

Fix #52 (mobile): the `apex build --mobile` runtime shim now provides `atob`/`btoa`, a correct
`Buffer.toString('binary'|'base64')`, and a 4-byte-safe `TextEncoder`/`TextDecoder`, so HTML
entities (`&nbsp;`, …) decode correctly on a bare on-device engine (they were over-escaped).
