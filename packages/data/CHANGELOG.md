# @apex-stack/data

## 0.11.3

### Patch Changes

- Updated dependencies [62c02bc]
  - @apex-stack/core@0.43.2

## 0.11.2

### Patch Changes

- Updated dependencies [1a93618]
  - @apex-stack/core@0.43.1

## 0.11.1

### Patch Changes

- Updated dependencies [1250ffe]
  - @apex-stack/core@0.43.0

## 0.11.0

### Minor Changes

- 1abe29e: Active-record query API on `defineModel` (P1), built on Drizzle + the shared write
  pipeline. A model is now its own query builder AND its writes fire the same behaviors
  as REST/MCP — no hand-written SQL, no bypass.

  Reads (through the Drizzle builder, typed columns hydrate bool/JSON automatically):

  - `Model.first(handle)` / `find(handle, id)` / `all(handle)`
  - `Model.where({ team: 'A', plays: { gt: 5, lte: 100 }, tag: { in: [...] } }).orderBy(col, dir).limit(n).offset(m)`
    with terminals `.all() | .first() | .count() | .exists() | .pluck(col) | .sum/avg/min/max(col) | .delete()`
  - operators: eq/ne/gt/gte/lt/lte/like/in/notIn/isNull, plus `.orWhere(...)`

  Writes (through the shared `repository()` pipeline — the SAME one `defineResource` uses):

  - `Model.create/update/updateOrCreate(handle, …)` fire lifecycle hooks (timestamps,
    observers, audit), apply row-level `scope` (owner stamped, tenant-isolated), respect
    soft-delete, and validate the payload against the model's shape (mass-assignment safe).
  - `Model.delete(handle, conds)` is soft-delete aware and hides trashed rows from reads.
  - `Model.upsert(handle, conflictKeys, values, { keep: { col: 'max' } })` — portable
    cross-dialect ON CONFLICT via Drizzle (fast bulk primitive; bypasses per-row hooks,
    like Eloquent `upsert`).
  - `opts.user` drives row-level scope isolation; `raw('plays + 1')` for a trusted expr.

  Internally, `defineResource`'s write/read path was extracted into `repository()` and is
  now shared with the active-record layer, so the two can't diverge. Verified identical on
  sqlite (incl. on-device sql.js) and Postgres (pglite). Also exported: `raw`, `Raw`,
  `QueryBuilder`, and the `Row` / `Values` / `WhereConds` / `Op` / `Cond` / `QueryOpts` /
  `UpsertOptions` types.

- 5b8006d: Bulk operations on models for imports/ETL: `Model.insertMany(handle, rows[])` inserts in
  one statement (scope-stamped, returns the rows) and `Model.updateMany(handle, conds, values)`
  updates every row matching `conds` (returns the count). Both are fast bulk primitives that
  bypass per-row hooks (like Eloquent's bulk `insert`/`update`) — use `create`/`update` when you
  need timestamps/observers.
- 6d48a5f: Attribute casts: `defineModel('events', { fields: {...}, casts: { publishedAt: 'date', prefs: 'json' } })`.
  Built-ins `date` / `number` / `boolean` / `json`, or a custom `{ get, set }` pair — `get` runs when
  hydrating an instance (e.g. stored ISO string → `Date`), `set` runs before a write (e.g. `Date` →
  ISO string, object → JSON). Applies to `Model.*` reads/writes on top of the column's storage type.
- a179d4f: Model instances + Collections + serialization. Reads now return hydrated **instances**
  (`Model.first/find`, `create/update/updateOrCreate`) and a **Collection** (`Model.all`,
  `.where().all()`), matching Eloquent's feel:

  - Instance methods: `save()` (persists only dirty attributes through the write pipeline —
    hooks/timestamps/scope), `delete()` (soft-delete aware), `refresh()`, `isDirty(col?)`,
    `changes()`, and `toJSON()`.
  - `Collection<T>` extends Array (length/iteration/spread work) with `pluck`, `keyBy`,
    `groupBy`, `sum`, `isEmpty`, `toArray`, `toJSON`; `.map`/`.filter` return plain arrays.
  - **Serialization**: model `hidden: ['password', …]` omits those columns from
    `instance.toJSON()`/`JSON.stringify` AND from every REST/MCP resource response
    (list/get/create/update) — so secrets never leak over the API.

  Exported: `Collection`, `collect`, and the `ModelInstance` type.

- 7133e03: Concurrency + large-table helpers on the query builder: `.lockForUpdate()` emits
  `SELECT … FOR UPDATE` on Postgres (use inside `handle.transaction` for pessimistic
  locking; no-op on sqlite, which locks the whole db in a tx), and `.chunk(handle, size, fn)`
  streams matching rows in batches so you can process big tables without loading them all.
- 0686f5b: Named query scopes: define reusable, chainable query fragments on a model via
  `scopes: { published: (q) => q.where({ status: 'published' }), top: (q, n) => q.orderBy('score','desc').limit(n) }`
  and call them with `Model.scope('published').all(h)` or `Model.scope('top', 5).all(h)`.
  An unknown scope name throws.
- 5553ff5: Optimistic locking. Set `optimisticLock: 'version'` on a model (declare an int `version` column)
  and `instance.save()` guards the UPDATE on the loaded version and bumps it — a concurrent write
  that changed the row makes the save lose, throwing `StaleModelException` (HTTP 409) instead of
  silently clobbering. Exported alongside the other typed errors.
- 28b7a94: Query-power escape hatch: `Model.tableFor(handle)` returns the model's Drizzle table for the
  handle's dialect, so joins / `GROUP BY` / aggregation / subqueries / window functions the
  active-record API can't express are one `handle.db.select(...).from(Model.tableFor(handle))...`
  away — with the full typed Drizzle builder.
- b3725df: Relationships + eager loading (the biggest Eloquent gap). Declare relations on a model with
  thunk refs, then eager-load them without N+1:

  ```ts
  const Post = defineModel("posts", {
    fields: { title: "string", authorId: "int" },
    relations: {
      author: belongsTo(() => User, "authorId"),
      comments: hasMany(() => Comment, "postId"),
    },
  });
  const posts = await Post.with("author", "comments")
    .orderBy("id", "asc")
    .all(handle);
  posts[0].author; // a User instance
  posts[0].comments; // a Collection of Comment instances
  ```

  `hasMany` / `hasOne` / `belongsTo` supported; `.with(...)` batch-loads each relation in ONE
  query keyed by the parent keys (N parents ⇒ 1 extra query, not N). Loaded relations attach as
  instance properties and serialize with `toJSON`/`JSON.stringify`. (belongsToMany/pivot deferred.)

- b7dfacb: Schema depth for real apps: field `index: true` (single-column index), field `references:
{ table, column?, onDelete? }` (foreign keys with cascade/set-null/restrict), and a model-level
  `indexes: [{ on: [...], unique?, name? }]` for composite/named indexes — all emitted by
  `migrationSql`. Without indexes on FKs and hot filter columns, real queries table-scan.

  Also fixes a latent Postgres bug: `migrationSql` now **quotes identifiers**, so camelCase
  columns (`ownerId`, `teamId`, `createdAt`) match Drizzle's quoted names. Previously Postgres
  lower-cased unquoted camelCase columns (`teamId` → `teamid`) and every camelCase column —
  including the one `owned()` stamps — broke on Postgres.

- b9acc88: Database transactions: `handle.transaction(async (tx) => { … })` — auto-commits when the
  callback resolves, auto-rolls-back if it throws. The callback gets a handle bound to the
  transaction, so AR/`db` writes inside it are atomic (`await Order.create(tx, …)`; a throw
  undoes the whole unit). Works on libSQL/Postgres/PGlite via Drizzle, and on the on-device
  sql.js backend via a manual BEGIN/COMMIT/ROLLBACK path (Drizzle's synchronous sql-js
  transaction can't roll back an async callback body). Nested transactions use savepoints on
  the server backends. Also threaded through `lazyDb`.
- 5bc5c06: Eloquent-style error handling. Data operations no longer swallow errors or leak raw driver
  failures: every query/write is wrapped so a driver error is rethrown as a `QueryException`
  carrying the model + op and the original error as `.cause` (the server's `onError` hook logs
  the full detail; the API masks it from clients). Missing rows throw `ModelNotFoundException`
  via new `Model.findOrFail(handle, id)` / `Model.firstOrFail(handle)` / `builder.firstOrFail()`.
  Both extend `ApexDataError` and carry an `httpStatus` (404 / 500) so the request layer can map
  them. Exported: `ApexDataError`, `ModelNotFoundException`, `QueryException`.
- 8176ac4: Resource list endpoints (REST + MCP `_list`) now support pagination, filtering, and
  sorting via query params: `?page` & `?perPage` return a `{ data, total, page, perPage,
lastPage }` envelope (perPage capped at 100), `?sort=-col,other` sorts (leading `-` =
  desc), and `?<col>=value` filters by any of the model's columns. Backward-compatible —
  with no `page`/`perPage`, list still returns a plain array. The params are also exposed
  on the `_list` MCP tool, so an AI client can page and filter too.

### Patch Changes

- Updated dependencies [5553ff5]
- Updated dependencies [43e5ac1]
  - @apex-stack/core@0.42.0

## 0.10.0

### Minor Changes

- 39e29d3: **DB bind parameters (safety).** `ApexDbHandle.query(sql, params?)` and `exec(sql, params?)` now
  accept bound parameters — use `?` placeholders (portable; translated to `$1,$2,…` on Postgres) so
  values are bound by the driver instead of string-concatenated into SQL. Works across every driver
  (libSQL/Turso, Postgres, PGlite) and the on-device sql.js backend; multi-statement `exec(sql)`
  without params is unchanged (migrations/seeds). Exposes `SqlParam` and `toPgPlaceholders`. This
  removes the need for hand-rolled escaping and the SQL-injection risk it carries.

  **Clearer API-route error.** A `server/api/*.ts` that `export default`s a plain function (instead
  of `defineApexRoute({...})` / `defineResource`) now logs an actionable warning explaining it won't
  be served, instead of silently 404-ing.

### Patch Changes

- Updated dependencies [39e29d3]
  - @apex-stack/core@0.41.1

## 0.9.9

### Patch Changes

- 7d1cddc: Production reliability (#25). 🟡 Experimental — the server target now ships the deploy basics:

  - **Graceful shutdown** — `apex start` drains in-flight requests on SIGTERM/SIGINT (10s window,
    then force-close) and closes database pools: `@apex-stack/data` handles register their own
    `close()` with the new shutdown registry (a manual `handle.close()` deregisters — no
    double-close). A second Ctrl+C force-exits. Embedders: `gracefulShutdown(server)` +
    `onShutdown(fn)` from `@apex-stack/core/server`; `startProdServer` also returns `close()`.
  - **Health checks** — `GET /health` / `/healthz` → `200 {status:'ok', uptime}` (liveness; served
    before auth/middleware).
  - **Safe 500s** — production clients never see error messages, causes, or hints; a thrown API
    handler, MCP tool, or page loader returns a generic body while the FULL detail goes to your
    `onError` hook (or the server log). Dev and the test harness keep rich errors
    (`exposeErrors: true`).
  - **Structured request logging + hooks** — one JSON line per request
    (`{time, method, path, status, ms}`, health probes skipped; `--quiet`/`APEX_LOG=off`), and a new
    `server/hooks.ts` convention (`defineHooks`): `onRequest` (replaces the default line), `onError`
    (wire Sentry here — kinds `api`/`page`/`mcp`/`http`), `onShutdown`. Programmatic:
    `createProdApp({ hooks, requestLog })`.

- Updated dependencies [7d1cddc]
  - @apex-stack/core@0.41.0

## 0.9.8

### Patch Changes

- Updated dependencies [845800c]
  - @apex-stack/core@0.40.2

## 0.9.7

### Patch Changes

- Updated dependencies [9821fb8]
  - @apex-stack/core@0.40.1

## 0.9.6

### Patch Changes

- Updated dependencies [bdccb37]
  - @apex-stack/core@0.40.0

## 0.9.5

### Patch Changes

- Updated dependencies [6626091]
  - @apex-stack/core@0.39.0

## 0.9.4

### Patch Changes

- Updated dependencies [71b4ecf]
  - @apex-stack/core@0.38.3

## 0.9.3

### Patch Changes

- Updated dependencies [c0427ec]
  - @apex-stack/core@0.38.2

## 0.9.2

### Patch Changes

- Updated dependencies [ef7fbf3]
  - @apex-stack/core@0.38.1

## 0.9.1

### Patch Changes

- Updated dependencies [99403d6]
- Updated dependencies [7cd82a9]
  - @apex-stack/core@0.38.0

## 0.9.0

### Minor Changes

- 525d629: On-device database for `apex build --mobile`. DB-backed pages and API routes now run offline on
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

### Patch Changes

- 435f70f: On-device DB persistence seam (survive app cold starts). The mobile SQLite backend can now restore
  from a saved snapshot and export its current bytes:

  - at open, if the host set `globalThis.__APEX_DB_SNAPSHOT__` (base64 of a prior `db.export()`), the
    database restores from it instead of starting empty (idempotent with `lazyDb`'s migrate + seed);
  - `globalThis.__APEX_DB_EXPORT__()` returns the current DB bytes (base64) for the host to persist.

  Storage-agnostic: the native shell wires it to a private app file (recommended) or WebView OPFS —
  see the native-shell guide. Both are no-ops off-device.

- Updated dependencies [4c4e830]
- Updated dependencies [8901599]
- Updated dependencies [9872625]
- Updated dependencies [525d629]
- Updated dependencies [3b344ad]
  - @apex-stack/core@0.37.0

## 0.8.23

### Patch Changes

- Updated dependencies [85580f5]
  - @apex-stack/core@0.36.0

## 0.8.22

### Patch Changes

- Updated dependencies [20f4375]
  - @apex-stack/core@0.35.0

## 0.8.21

### Patch Changes

- Updated dependencies [f16817e]
  - @apex-stack/core@0.34.1

## 0.8.20

### Patch Changes

- Updated dependencies [2d8bb33]
  - @apex-stack/core@0.34.0

## 0.8.19

### Patch Changes

- Updated dependencies [ebf6f3b]
  - @apex-stack/core@0.33.0

## 0.8.18

### Patch Changes

- Updated dependencies [5706fce]
  - @apex-stack/core@0.32.0

## 0.8.17

### Patch Changes

- Updated dependencies [82a7597]
  - @apex-stack/core@0.31.0

## 0.8.16

### Patch Changes

- Updated dependencies [3d37eb1]
  - @apex-stack/core@0.30.0

## 0.8.15

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.29.0

## 0.8.14

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.28.0

## 0.8.13

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.27.2

## 0.8.12

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.27.1

## 0.8.11

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.27.0

## 0.8.10

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.26.0

## 0.8.9

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.25.0

## 0.8.8

### Patch Changes

- fix(pkg): expose `./package.json` in the exports map

  Tools and user code commonly `require('@apex-stack/core/package.json')` (e.g. to
  read the version); with the `exports` map present but no `./package.json` entry,
  that threw `ERR_PACKAGE_PATH_NOT_EXPORTED`. Both packages now map
  `"./package.json": "./package.json"` so the conventional access works.

- Updated dependencies
  - @apex-stack/core@0.24.3

## 0.8.7

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.24.2

## 0.8.6

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.24.1

## 0.8.5

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.24.0

## 0.8.4

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.23.0

## 0.8.3

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.22.0

## 0.8.2

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.21.0

## 0.8.1

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.20.0

## 0.8.0

### Minor Changes

- `createDb({ driver:'postgres', url, options })` — pooler/SSL-aware. Auto-disables
  prepared statements on a transaction pooler (Supabase Supavisor / pgBouncer:
  `*.pooler.supabase.com` or `:6543`) and enables SSL for remote hosts; passes
  through prepare/ssl/max/idleTimeout. Verified against live Supabase.

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.19.0

## 0.7.5

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.18.0

## 0.7.4

### Patch Changes

- `ApexModel.insert` is now typed `Record<string, ZodTypeAny>` (public Zod type)
  instead of `ZodRawShape`, so each field schema exposes `.parse()` for validation
  and tests under Zod v4.
- Updated dependencies [af459fa]
- Updated dependencies
  - @apex-stack/core@0.17.1

## 0.7.3

### Patch Changes

- Updated dependencies [666d30f]
  - @apex-stack/core@0.17.0

## 0.7.2

### Patch Changes

- Updated dependencies [7108e69]
  - @apex-stack/core@0.16.2

## 0.7.1

### Patch Changes

- Updated dependencies [1018a7e]
  - @apex-stack/core@0.16.1

## 0.7.0

### Minor Changes

- b7ba151: Test-data factories. `factory(model)` infers schema-valid fake rows from a model's
  fields (no blueprint — the fields are the blueprint): `make(overrides?)`,
  `makeMany(n)`, `create(db)`, `createMany(db, n)`. Overrides win and extra keys pass
  through; timestamp columns are left unset by default (so a generated row isn't
  accidentally soft-deleted). Zero-dep by default; plug in `@faker-js/faker` (or any
  generator) via the `fake` hook for richer values.

### Patch Changes

- Updated dependencies [b7ba151]
  - @apex-stack/core@0.16.0

## 0.6.1

### Patch Changes

- Fix behavior hook safety (from independent Phase D verification):

  - Hook `ctx` no longer leaks Drizzle internals as enumerable props — `db`/`table`/
    `handle` are non-enumerable, so `JSON.stringify(ctx)` / `console.log(ctx)` in a user
    hook no longer throw on circular references (they remain reachable as `ctx.db` etc.).
  - `after*` hooks (`afterCreate`/`afterUpdate`/`afterDelete`/`afterList`/`afterGet`) are
    now best-effort side-effects: a throw is logged and swallowed rather than 500-ing an
    already-committed write. `before*` hooks keep their veto (a throw aborts the op before
    it runs). `observable` JSDoc documents the single-`ctx` hook shape.

## 0.6.0

### Minor Changes

- Phase D — `auditable()` behavior. Logs every create/update/delete to a companion
  `<name>_audit` table (`row_id`, `action`, `actor_id` from `ctx.user`, `changes` JSON,
  `at`), auto-provisioned on first write (dialect-aware `CREATE TABLE IF NOT EXISTS`). It
  rides the same dispatch path, so it records an AI's MCP tool calls exactly like a
  browser's writes. Hooks now receive the model `name` and the full db `handle` for
  companion-table writes.

## 0.5.0

### Minor Changes

- e1041c7: Phase D — model behaviors ("traits"). `defineModel` gains `use: [...]` for composable
  behaviors that fold their fields, insert-shape tweaks, lifecycle hooks, row-level
  `scope`, non-equality `filter`s, and per-op `access` into the model — enforced
  identically over REST and MCP. Deterministic + fail-closed composition
  (`composeBehaviors`): fields merge (collision → throws), scopes AND-combine, access is
  most-restrictive-wins, hooks run in behavior order. Built-ins: `timestamps()`
  (server-stamped `created_at`/`updated_at`, omitted from the create payload),
  `owned(col)` (Phase C's `access`+`scope` packaged — gates authed + isolates rows +
  stamps owner unspoofably), `observable(hooks)` (lifecycle hooks), and `softDeletes(col)`
  (turns DELETE into a timestamp stamp and hides soft-deleted rows from every read/write).
  Hook seam added to `defineResource`: `before/after` create/update/delete plus
  `afterList`/`afterGet`.

## 0.4.1

### Patch Changes

- Updated dependencies
  - @apex-stack/core@0.15.0

## 0.4.0

### Minor Changes

- d7426d7: Phase C2 — resource/model authorization + row-level scope. `defineResource` and
  `defineModel` gain `access` (per-op `'public' | 'authed' | predicate`, mapped onto the
  route auth/can gate) and `scope(ctx)` (a row filter injected as a WHERE on
  list/get/update/delete and stamped onto create). Declaring either gates the whole
  resource — unlisted ops default to `'authed'` (fail-closed), so you can't half-secure a
  resource. `scope` isolates rows per caller across all five ops (id-guessing can't cross
  scopes), create stamps ownership unspoofably, and update can't reassign a scoped
  column. Enforced identically over REST and MCP.

### Patch Changes

- Updated dependencies [d2a423d]
- Updated dependencies [233993e]
  - @apex-stack/core@0.14.0

## 0.3.1

### Patch Changes

- Updated dependencies [ebb0588]
  - @apex-stack/core@0.13.1

## 0.3.0

### Minor Changes

- 01a2aff: Up/down migrations + rollback (Phase B).

  Migrations can now declare a reversible `down`: everything after a `-- @down` marker
  line in a `*.sql` file is the down section (files without it stay up-only, exactly as
  before — fully backward compatible). New `rollbackMigrations(handle, dir, steps?)`
  reverts the most-recent applied migration(s) by running their `down` and un-recording
  them, stopping safely at the first non-reversible one so nothing is undone out of
  order. `apex migrate --rollback [--steps N]` drives it from the CLI, and
  `apex make model` now generates a reversible migration (`CREATE TABLE` + `-- @down`
  `DROP TABLE`). `applyMigrations` runs the `up` section (unchanged behavior for
  existing plain-SQL migrations).

### Patch Changes

- Updated dependencies [01a2aff]
  - @apex-stack/core@0.13.0

## 0.2.3

### Patch Changes

- Updated dependencies [aa24896]
  - @apex-stack/core@0.12.2

## 0.2.2

### Patch Changes

- 7df0b00: Fixes from the model-scaffolding verification pass.

  - **Blocker:** a `timestamp` field crashed MCP `tools/list` for the whole app
    (`z.coerce.date()` output can't convert to JSON Schema). Timestamps are now ISO
    strings end-to-end (SQLite `TEXT`, Postgres `TIMESTAMP` with string I/O). Plus the
    MCP layer now degrades ANY unrepresentable tool input schema to a loose one for
    that one tool instead of taking down the entire tool list — so a hand-written
    route using `z.date()` can't break MCP either.
  - API responses serialize explicitly: a `null` handler result (e.g. get-by-id not
    found) is now a parseable `200 null` JSON body, not h3's `204 No Content`.
  - Handler errors surface the real message (with a "run `apex migrate`" hint when a
    table is missing) instead of an opaque 500 with an empty stack.
  - Resource MCP tool descriptions reworded to read cleanly for plural model names
    ("Create todos", not "Create a todos").

- Updated dependencies [7df0b00]
  - @apex-stack/core@0.12.1

## 0.2.1

### Patch Changes

- Updated dependencies [d478813]
  - @apex-stack/core@0.12.0

## 0.2.0

### Minor Changes

- 834dd4c: `defineModel` — single source of truth for a data model.

  One field spec derives everything: `defineModel('todos', { fields: { title: 'string',
done: { type: 'boolean', default: false } } })` gives you the zod insert/update
  validation, a dialect-aware Drizzle table, the `CREATE TABLE` migration SQL, and a
  REST + MCP resource (`.resource(db)` → list/get/create/update/delete). Write the
  shape once instead of hand-wiring a Drizzle table + zod + `defineResource`
  separately. Dialect-agnostic (SQLite/libSQL/Turso + Postgres/Supabase/Neon/PGlite).
  (`apex make:model` scaffolding + auto-mount + up/down migrations land next.)

## 0.1.33

### Patch Changes

- Updated dependencies [fc8538e]
  - @apex-stack/core@0.11.0

## 0.1.32

### Patch Changes

- Updated dependencies [b749167]
  - @apex-stack/core@0.10.2

## 0.1.31

### Patch Changes

- Updated dependencies [39f59fe]
  - @apex-stack/core@0.10.1

## 0.1.30

### Patch Changes

- Updated dependencies [c08dabf]
  - @apex-stack/core@0.10.0

## 0.1.29

### Patch Changes

- Updated dependencies [2f9f457]
  - @apex-stack/core@0.9.2

## 0.1.28

### Patch Changes

- Updated dependencies [09fbadd]
  - @apex-stack/core@0.9.1

## 0.1.27

### Patch Changes

- Updated dependencies [dcaa2d4]
  - @apex-stack/core@0.9.0

## 0.1.26

### Patch Changes

- Updated dependencies [9f0100a]
  - @apex-stack/core@0.8.3

## 0.1.25

### Patch Changes

- Updated dependencies [9b1a98b]
  - @apex-stack/core@0.8.2

## 0.1.24

### Patch Changes

- Updated dependencies [4f09ef6]
  - @apex-stack/core@0.8.1

## 0.1.23

### Patch Changes

- Updated dependencies [eadbd06]
  - @apex-stack/core@0.8.0

## 0.1.22

### Patch Changes

- Updated dependencies [bde3a2d]
  - @apex-stack/core@0.7.8

## 0.1.21

### Patch Changes

- Updated dependencies [38b0fc3]
  - @apex-stack/core@0.7.7

## 0.1.20

### Patch Changes

- Updated dependencies [62b1885]
  - @apex-stack/core@0.7.6

## 0.1.19

### Patch Changes

- Updated dependencies [29b4f85]
  - @apex-stack/core@0.7.5

## 0.1.18

### Patch Changes

- Updated dependencies [0451068]
  - @apex-stack/core@0.7.4

## 0.1.17

### Patch Changes

- Updated dependencies [2a16365]
  - @apex-stack/core@0.7.3

## 0.1.16

### Patch Changes

- Updated dependencies [18800ea]
- Updated dependencies [1e48f34]
  - @apex-stack/core@0.7.2

## 0.1.15

### Patch Changes

- Updated dependencies [3739636]
  - @apex-stack/core@0.7.1

## 0.1.14

### Patch Changes

- Updated dependencies [7d5caca]
- Updated dependencies [9600a30]
  - @apex-stack/core@0.7.0

## 0.1.13

### Patch Changes

- Updated dependencies [f39ad83]
- Updated dependencies [e39ef9a]
  - @apex-stack/core@0.6.0

## 0.1.12

### Patch Changes

- Updated dependencies [033bdaa]
  - @apex-stack/core@0.5.0

## 0.1.11

### Patch Changes

- Updated dependencies [dd3997a]
  - @apex-stack/core@0.4.1

## 0.1.10

### Patch Changes

- Updated dependencies [26d83ca]
  - @apex-stack/core@0.4.0

## 0.1.9

### Patch Changes

- Updated dependencies [557c35d]
  - @apex-stack/core@0.3.1

## 0.1.8

### Patch Changes

- Updated dependencies [6bd3191]
  - @apex-stack/core@0.3.0

## 0.1.7

### Patch Changes

- Updated dependencies [3586f27]
  - @apex-stack/core@0.2.2

## 0.1.6

### Patch Changes

- Updated dependencies [d15b536]
  - @apex-stack/core@0.2.1

## 0.1.5

### Patch Changes

- Updated dependencies [2f71124]
- Updated dependencies [ef8082a]
- Updated dependencies [6dd4d89]
- Updated dependencies [ad58fe5]
- Updated dependencies [cc6ff69]
- Updated dependencies [f1a7eca]
- Updated dependencies [6626d2d]
- Updated dependencies [19756a6]
  - @apex-stack/core@0.2.0
