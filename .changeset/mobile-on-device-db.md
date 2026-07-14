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
  in-memory **sql.js** (WASM) SQLite (new optional peer `sql.js`); app code is unchanged.
- **`@apex-stack/core`** (`apex build --mobile`): the bundler now includes `@apex-stack/data`
  modules and bundles the sql.js WASM (only when the app uses the data layer); the runtime shim
  gained `URLSearchParams`, `FormData`, and a `Request.body` accessor so h3 body parsing works
  on the bare engine.

Limitation: the on-device database is in-memory (seeded at boot, reset on cold start) and
requires a WASM-capable engine; persistence is a later step.
