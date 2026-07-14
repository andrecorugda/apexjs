---
"@apex-stack/data": minor
"@apex-stack/core": patch
---

On-device database for `apex build --mobile`. DB-backed pages and API routes now run offline on
a bare engine instead of being dropped from the bundle:

- **`@apex-stack/data`**: a new `lazyDb(config, { init })` opens a database without top-level
  await (required by the classic-script mobile bundle) — `dialect` is known synchronously and
  the connection opens + seeds on first use, with a deferred Drizzle proxy so `defineResource`
  works unchanged. On-device, `createDb`'s `libsql`/`sqlite` driver transparently uses an
  in-memory **sql.js** SQLite (new optional peer `sql.js`), using its **asm.js** build (pure JS,
  no WebAssembly) so it runs on engines that can't compile WASM — androidx.javascriptengine's
  sandboxed V8 SIGSEGVs on WASM, and QuickJS/Hermes lack it entirely. App code is unchanged.
- **`@apex-stack/core`** (`apex build --mobile`): the bundler now includes `@apex-stack/data`
  modules (bundling the asm.js SQLite; output is minified); the runtime shim gained
  `URLSearchParams`, `FormData`, a `Request.body` accessor, and `new URL(path, base)`
  base-resolution — so h3 body parsing, query parsing, and host/CSRF resolution work on the
  bare engine.

Limitation: the on-device database is in-memory (seeded at boot, reset on cold start);
persistence is a later step.
