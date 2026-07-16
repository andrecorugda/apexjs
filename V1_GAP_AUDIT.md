# Apex JS — v1 Gap Register (real-apps reframe)

What a **big / complex production app** needs, not what a todo demo needs. Two primary tracks —
**Data layer** and **Platform pillars** — plus frontend fidelity, server hardening, and scaffold/docs.
`[v1]` blocks 1.0. `[1.1+]` = staged ecosystem. Severity 🔴 blocker · 🟠 high · 🟡 med.

> Origin: a 4-way parallel audit (data/Alpine/server/scaffold), then reframed around real-app usage
> (joins/aggregation, transactions, locking, list-API scale, platform subsystems) — the CRUD-shaped
> Eloquent checklist was necessary but not sufficient. **Route–model binding: DROPPED (not needed).**

---

## Track 1 — Data layer for real apps

### ✅ Shipped (cluster A spine, committed `feat/eloquent-parity`, 334 tests)
AR rebuilt on the Drizzle builder + a shared `repository.ts` pipeline. `Model.*` and REST/MCP go
through ONE path: hooks (timestamps/observers/audit), row-level `scope`, soft-delete, validation,
operators (eq/ne/gt/gte/lt/lte/like/in/notIn/isNull, orWhere), limit/offset, count/exists/pluck/
sum/avg/min/max, `upsert`, `raw()`. (Resolves A1–A5, A7.)

### v1 — must-add for real apps (I own these; coupled to query.ts/model.ts/repository.ts)
- 🔴 **Transactions + rollback** — `handle.transaction(async (tx) => …)` auto-commit / auto-rollback; AR ops take `tx` → atomic units. *NOTE (verified): works on pg/libsql via Drizzle, but on-device sql.js needs a manual `BEGIN/COMMIT/ROLLBACK` path (Drizzle's sync sql-js tx doesn't roll back an async body).* ← **IN PROGRESS**
- 🔴 **List-API pagination / filter / sort** — `Model.resource()` mounts `GET /api/x` that returns **every row**, no query params. Breaks on real data volume. *Most-hit real-app gap.* → page/perPage + `?filter[col]=` + `?sort=`.
- 🟠 **Query power: joins, `GROUP BY`/`HAVING`, subqueries, aggregation-over-groups, window fns** — AR is single-table where/order today; reporting/dashboards fall back to raw SQL. → expose a Drizzle-backed builder path.
- 🟠 **Locking** — optimistic (`version` column, conflict-on-stale) + pessimistic (`SELECT … FOR UPDATE`). Money/inventory correctness under concurrency.
- 🟠 **Bulk ops** — `insertMany` / `updateMany` / bulk `upsert` for imports/ETL.
- 🟠 **Schema depth** — foreign keys, composite/named indexes, unique-across-columns, check constraints, `ON DELETE CASCADE`. Today only per-column `unique`; without indexes real queries table-scan.
- 🟠 **Model instances + Collections** — `save()`/dirty/`refresh()`/`delete()`/`wasChanged()`; `Collection` (map/filter/pluck/groupBy/sum). *Foundation for casts/serialize/relations.*
- 🟠 **Serialization** — `hidden`/`visible`/`appends`/`toJSON` (hide password/secret over REST+MCP too — security). (A13)
- 🟠 **Casts** — enum/decimal/date/encrypted/custom `cast` per field beyond bool/JSON. (A12)
- 🟠 **Relationships + eager load** — `hasOne/hasMany/belongsTo/belongsToMany/through/polymorphic` + `with()`. Drizzle Relations. *Biggest single feature.* (A6)
- 🟠 **Local/named scopes** — `Model.scope('published')` chainable. (A14)
- 🟡 **JSON / array column querying** — `where('meta->plan','pro')`.
- 🟡 **Chunking / cursor / lazy** — iterate millions of rows without loading all. (A20)

### 1.1+
- Migrations diffing / `ALTER` generation (drizzle-kit, dev-time) (A16) · Multiple connections / read replicas · Factories & seeders (states/sequences/`has()`) (A19) · Full-text search.

---

## Track 2 — Platform pillars (independent subsystems → agent fan-out)

### v1 (universal — nearly every real app needs)
- 🟠 **Queues / background jobs** — enqueue + worker + retries + backoff + scheduling. Email/exports/webhooks/image-processing without blocking requests. *(driver: DB-backed default; on-device = inline.)*
- 🟠 **Cache** — driver abstraction (memory/file/redis) + TTL + tags + invalidation. Dashboards/hot reads.
- 🟠 **File / object storage** — local/S3 driver, signed URLs, streamed uploads, `Storage.put/get/url`.
- 🟠 **Observability** — per-request ID + `x-request-id`, structured logs, into `onError`/log hooks; basic metrics hook. *(partial: `onError` exists.)*
- 🟠 **Rate limiting wired** — the util exists but isn't mounted (see Track 4).

### 1.1+
- Mail (transactional + templates, queued) · Notifications (multi-channel) · Real-time (WS/SSE/presence) · RBAC/permissions + API tokens/OAuth/SSO + auth flows (reset/verify/2FA) · Feature flags · Broadcasting.

---

## Track 3 — Alpine / frontend fidelity  (`packages/kit/**`)
- 🔴 **[v1] `x-model` renders no initial value** → every controlled field flashes empty. `renderComponent.ts:245`.
- 🔴 **[v1] `$store` seeded only in the root render** → blank in islands/nested. `renderComponent.ts:143,181,331`.
- 🟠 **[v1] Scope proxy missing `ownKeys`/`getOwnPropertyDescriptor`** → `{...state}`/`Object.keys` empty in SSR. `scope.ts:33`.
- 🟠 Hydration nukes `x-for`/`x-if` DOM → `@alpinejs/morph` (`runtime.ts:98`) · SSR `x-teleport` · `$id` mismatch (`magics.ts:19`) · object-`x-for` key (`forExpression.ts:33`).
- 🟡 named slots · store serialize · `x-modelable` · `$root`/`$data` magics · custom-magic SSR · plugin SSR seam · async evaluator · silent SSR errors.

## Track 4 — Server hardening  (`packages/apexjs/src/{prod,security,auth,api}`)
- 🔴 **[v1] Security headers/CSP/HSTS, rate-limit, body-size cap, request timeouts** — all EXIST as utils, none wired into `createProdApp`. `prod/server.ts:184`, `security/{headers,rateLimit}.ts`.
- 🟠 **[v1]** Hand-rolled SHA-256/HMAC crypto (`auth/hmac.ts`) · session cookies no `Secure`/revocation (`auth/session.ts`) · device token no expiry.
- 🟠 h3 `serveStatic` (blocking sync I/O + no ETag/304, `prod/server.ts:230`) · CSRF logout-403 (`security/csrf.ts`) · 404 reflected-XSS (`:318`) · CORS · password-hash primitive (argon2/scrypt) · MCP bypasses `locals`+edge protections.

## Track 5 — Scaffold / docs / reinvention  (CLI/build/create-apexjs)
- 🔴 **[v1] `apex make model` scaffold is non-bundleable + non-portable** — `await createDb('data.db')` (TLA breaks `--mobile`, hardcoded file ignores `DATABASE_URL`). `make.ts:299`. → emit `lazyDb`+shared `db/index.ts`.
- 🟠 **[v1]** 4 contradictory `createDb`/driver signatures · `make model` under-installs deps (no drizzle/sql.js) · `db/README.md` teaches retired `defineResource` API · guestbook loader + `AGENTS.md` must teach the AR query API.
- 🟡 Hand-rolled dotenv (`config/resolve.ts`) → Vite `loadEnv` · 5 duplicated fs-walkers → `tinyglobby` · custom inflector → `pluralize` · 3 ANSI-color systems.

---

## Execution
Full sequence, **blockers + high**. **I own Track 1** (coupled: query.ts/model.ts/repository.ts/index.ts).
**Tracks 2 (pillars) + parts of 4/5 fan out to agents** (independent files/dirs). Manual-QA gate per track.
Order: T1 transactions → list-API → query power/locking/bulk/schema → instances/serialize/casts/relations;
then T2 pillars (queues/cache/storage) fan-out; then T3 zero-flash; T4 hardening; T5 scaffold/docs.
