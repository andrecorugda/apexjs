---
"@apex-stack/vite": patch
"@apex-stack/core": patch
---

Fix #53: a page's `<script client>` top-level side effects (`setTimeout`, `window.*`, event
wiring) no longer run during server-side rendering. The SSR module now receives a
declarations-only view of the client body — imports and `const`/`function`/`class`
declarations are kept so the root `x-data` can still resolve composables, while side-effect
statements are stripped (they still ship in the client module and run on hydration).
Previously the full body executed at SSR eval time, which was semantically wrong on the web
and crashed bare on-device engines (QuickJS/androidx.javascriptengine) with
`setTimeout is not defined`.

As defense-in-depth, the `apex build --mobile` runtime shim also stubs the common browser
globals (`document`, `window`, `localStorage`, `navigator`, `location`, `matchMedia`,
`requestAnimationFrame`) with inert no-ops, so a rare side-effectful *declaration* initializer
that the compiler keeps (e.g. `const t = document.title`, needed as a symbol by `rootData`)
can't brick the whole app's boot on a bare engine — the real behavior still runs client-side
in the WebView.
