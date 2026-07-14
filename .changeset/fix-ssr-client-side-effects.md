---
"@apex-stack/vite": patch
---

Fix #53: a page's `<script client>` top-level side effects (`setTimeout`, `window.*`, event
wiring) no longer run during server-side rendering. The SSR module now receives a
declarations-only view of the client body — imports and `const`/`function`/`class`
declarations are kept so the root `x-data` can still resolve composables, while side-effect
statements are stripped (they still ship in the client module and run on hydration).
Previously the full body executed at SSR eval time, which was semantically wrong on the web
and crashed bare on-device engines (QuickJS/androidx.javascriptengine) with
`setTimeout is not defined`.
