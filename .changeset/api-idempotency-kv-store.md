---
"@apex-stack/core": minor
---

Production APIs: idempotency + a pluggable KV store (#49). 🟡 Experimental.

- **`Idempotency-Key` support, automatic in `/api`** — send the header on a POST/PUT/PATCH/DELETE
  and the pipeline runs the handler once, replaying the cached `{status, body}` for retries (24h,
  replays carry `x-idempotent-replay: true`). A concurrent duplicate gets `409 request in
  progress`; 5xx outcomes are not cached so a retry re-executes. Keys are scoped per route + user
  (the check runs after auth). No header → zero cost, zero behavior change.
- **`KvStore`** — the tiny async key/value-with-TTL primitive behind both features, with a
  built-in `createMemoryStore()` (single process, zero config). Implement it over Redis (or any
  shared store) for multi-instance deployments: `createProdApp({ idempotencyStore })`, and
  `createTestApp({ entries, idempotencyStore })` for isolated tests.
- **`createRateLimiter({ store })`** — the existing limiter (unchanged and still synchronous
  without a store) now accepts a shared `KvStore` and returns an `AsyncRateLimiter` enforcing ONE
  global counter across instances, with epoch-aligned fixed windows.
