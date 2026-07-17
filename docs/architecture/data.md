# Data — the data layer (`@apex-stack/data`)

**What it is.** `packages/data` turns one model definition into the whole data stack:
schema, validation, migration, an active-record query API, and a REST+MCP CRUD
resource. Its center of gravity is `defineModel` (`src/model.ts`), and its spine is a
single shared write/read pipeline (`src/repository.ts`) that REST, MCP, and `Model.*`
all run through — so the three surfaces can never diverge.

**How it's designed.** A field spec is the single source of truth. Everything else is
*derived*, lazily and per dialect, so the same definition works on SQLite (libSQL/
Turso), Postgres (Supabase/Neon), embedded PGlite, and on-device sql.js. Auth
(`access`/`scope`) and cross-cutting concerns (`behaviors`/"traits") attach to the
model once and flow to every surface (see [auth.md](./auth.md) §8).

---

## 1. `defineModel` — one spec → six derivations — `src/model.ts`

```ts
export default defineModel('todos', {
  fields: { title: 'string!', done: { type: 'boolean', default: false }, ownerId: 'int' },
  use: [timestamps(), owned('ownerId')],   // composable behaviors ("traits")
  relations: { owner: belongsTo(() => User, 'ownerId') },
  casts: { done: 'boolean' },
  hidden: ['secret'],
  indexes: [{ on: ['ownerId'] }],
})
```

From that, `defineModel` derives (all in `src/model.ts`):

1. **`table(dialect)`** — a dialect-specific Drizzle table. Column mapping lives in
   `column()`; the pk is `serial`/`integer autoincrement`. Built lazily because the
   dialect is only known at db time.
2. **`insert`** — a zod shape validating the create payload (`zodFor` per field type;
   NOT NULL + no default ⇒ required). Behavior-managed columns (e.g. `timestamps`) are
   dropped from the create shape via `composed.omitFromInsert`.
3. **`migrationSql(dialect)`** — `CREATE TABLE IF NOT EXISTS` + indexes. Identifiers are
   **double-quoted** so Postgres doesn't lowercase camelCase columns (`ownerId` →
   `ownerid` would break every query). Single-column `field.index` and composite
   `opts.indexes` both emit `CREATE INDEX IF NOT EXISTS`; `references` emits FKs.
4. **`resource(handle)`** — binds the model to a db handle → an `ApexResource` (REST +
   MCP CRUD), via `defineResource`.
5. **Active-record statics** — `attachActiveRecord(model, …)` adds `first/find/where/
   create/update/upsert/delete/…` directly on the model object.
6. **Relations / casts / hidden / scopes / optimisticLock** — carried onto the AR layer.

> **Timestamps are strings, not `Date`.** `zodFor('timestamp')` returns `z.string()`,
> not `z.coerce.date()`: a `Date` output type can't be represented in JSON Schema, which
> would crash MCP `tools/list` for the whole app. This is the model-side of the
> `safeInputSchema` guard in core (see [core.md](./core.md) §4).

## 2. The shared pipeline — `src/repository.ts` (the crux)

`repository(cfg)` is built **once per model** and used by *both* `defineResource`
(REST/MCP) and the active-record layer. Because the pipeline lives here exactly once,
`Model.create/update/delete` fire the *same* hooks, `scope`, behavior `filters`
(e.g. soft-delete's `deleted_at IS NULL`), and soft-delete logic as a REST or MCP call.

It exposes:

- **`scopeConds(user)`** — the row conditions for a caller: the equality `scope`
  (`{ ownerId: user.id }`) plus every behavior filter. Returned as Drizzle `SQL[]`.
- **`where(extra, user)`** — `scopeConds` AND-combined with an extra predicate.
- **`create`** — stamps the caller's `scope` onto the row (owner can't be spoofed via
  input), runs `beforeCreate` hooks, inserts via Drizzle `.returning()`, runs
  `afterCreate`.
- **`update`** — *deletes any scoped column from the incoming fields* (a caller can
  never reassign `ownerId`), runs `beforeUpdate`, updates under `where(extra, user)`.
- **`remove`** — soft-delete stamps the `softDelete` column; hard-delete removes the
  row; both under the scoped WHERE.
- **`bulkRemove` / `runAfterList` / `runAfterGet`** — bulk + read-side hooks.

Design notes: it operates through the **Drizzle query builder on `handle.db`** (never
raw SQL strings), so it works on every backend including on-device sql.js. `after*`
hooks are **best-effort** — the write already committed, so a throw is logged and
swallowed. Hook context (`db`/`table`/`handle`) is non-enumerable so a user hook doing
`JSON.stringify(ctx)` doesn't choke on Drizzle's circular refs.

## 3. `defineResource` — REST + MCP CRUD — `src/index.ts`

`defineResource(name, opts)` turns one table into five routes, each also an MCP tool
(`<name>_list/_get/_create/_update/_delete`). All CRUD dispatch runs through the shared
`repository`. Highlights:

- **Gating posture is fail-closed.** Declaring `access` *or* `scope` opts the whole
  resource in; an unlisted op then defaults to `'authed'` (never public). `gate(op)`
  maps an `AccessRule` (`'public'`/`'authed'`/predicate) to a core route gate
  (`{ auth?, can? }`).
- **`hidden` columns are stripped from every response** (`strip`), REST and MCP alike.
- **List params** — `?page`/`?perPage` (→ a `{ data, total, page, perPage, lastPage }`
  envelope; plain array with neither, for back-compat), `?sort=-col`, and per-column
  equality filters. These are also on the `_list` MCP tool, so an AI can page/filter.
  `perPage` is capped at `MAX_PER_PAGE = 100`.

## 4. Active record — `src/query.ts` (+ `collection.ts`, `relations.ts`)

The model object *is* the query API — server code queries its own models without
hand-writing SQL. Reads run through Drizzle (operators/ordering/pagination; bool+JSON
hydrate); **writes run through the same `repository` pipeline as REST/MCP.**

```ts
await Player.where({ team: 'A', plays: { gt: 5, lte: 100 } })  // eq/ne/gt/gte/lt/lte/like/in/notIn/isNull
  .orderBy('plays', 'desc').limit(10).all(db)
await Player.create(db, { handle: 'ada', plays: 0 })            // fires hooks + scope + validation
await Player.update(db, id, { plays: raw('plays + 1') })        // raw() = a trusted SQL expression
await Player.upsert(db, ['handle'], { handle: 'ada', plays: 99 }, { keep: { plays: 'max' } })
await Player.all(db, { user })                                  // opts.user drives row-level scope
```

- **Column names are validated against `fields`** — a typo throws, never an injection
  vector; values are always bound.
- **`opts.user`** applies the model's row-level `scope` (omitted ⇒ trusted/admin).
- Reads return live **instances** (`save`/`delete`/`refresh`/`isDirty`/`toJSON`) in a
  fluent **`Collection`** (`.pluck`/`.groupBy`/`.sum`). `*OrFail` throws
  `ModelNotFoundException` (HTTP 404); driver errors surface as `QueryException`
  (logged, masked to clients) — see `src/errors.ts` (typed errors carry `httpStatus`,
  which core's API handler honors).
- **`upsert`/`insertMany`/`updateMany`** are fast bulk primitives that **bypass per-row
  hooks** (like Eloquent's `upsert`) — use `updateOrCreate` when you need
  timestamps/observers.
- The escape hatch is `tableFor(handle)` + `handle.db` for joins/GROUP BY the AR API
  can't express, or `handle.query(sql, params)` with bound `?` placeholders.

## 5. Relations + eager loading — `src/relations.ts`

`belongsTo(() => Model, fk)`, `hasMany(() => Model, fk)`, `hasOne(...)` declared under
`relations` and loaded with `.with('author', 'comments')` (no N+1). The thunk
(`() => Model`) defers resolution so models can reference each other circularly.

## 6. Behaviors ("traits") — `src/behavior.ts`

A behavior is `(config) => Behavior`, evaluated at definition time with no side effects.
`composeBehaviors(use, ownSpec)` folds them into an **effective spec** *inside*
`defineModel` before it derives table/insert/migration/resource — so the derivation
pipeline is untouched, it just sees more fields/hooks/scope. Built-ins:
`timestamps()`, `softDeletes()`, `owned(col)`, `observable({...hooks})`, `auditable()`.
Composition is deterministic + fail-closed (fields merge or error on collision; scopes
AND-combine; access is most-restrictive-wins). Full contract in [auth.md](./auth.md) §8.

## 7. Drivers, handle, transactions, migrations — `src/index.ts`

**`createDb(config)`** opens a database and wraps it behind a driver-agnostic
`ApexDbHandle` (`{ db, dialect, exec, query, transaction, close }`). Config forms:
a SQLite path string, `{ driver: 'sqlite'|'libsql', url }`, `{ driver: 'postgres', url,
options }`, or `{ driver: 'pglite', dir? }`. Every driver is an **optional peer**,
loaded on demand with a clear "install X" message if missing. `postgresOptions` auto-
disables prepared statements on a transaction pooler (Supabase Supavisor/pgBouncer) and
enables SSL for remote hosts. The handle's `close` auto-registers as a server shutdown
hook (via a globalThis registry — no core import) so `apex start`'s SIGTERM drain closes
the pool.

**Transactions** — `handle.transaction(fn)` runs `fn` in a DB transaction: auto-commit
on resolve, auto-rollback on throw. `fn` receives a handle bound to the tx (`txHandle`),
so `await Order.create(tx, …)` and `handle.query` inside it are atomic. Pessimistic
locking: `Model.where(...).lockForUpdate()`; optimistic: `optimisticLock: 'version'` +
`save()` throws `StaleModelException` (409) on a stale write.

**Bound params** — `exec`/`query` take `?` placeholders, translated to Postgres
`$1,$2,…` by `toPgPlaceholders` (skips `?` inside string literals). Portable and
injection-safe; never string-concatenate values.

**Migrations** — `applyMigrations(handle, dir)` runs pending `*.sql` files in filename
order, tracked idempotently in `_apex_migrations`. `parseMigration` splits a file at a
`-- @down` marker into up/down; `rollbackMigrations(handle, dir, steps)` reverses the
most-recent-first and **stops at the first irreversible migration** so order is never
broken. A model's `migrationSql(dialect)` is its initial migration.

## 8. On-device + lazy — `src/device.ts`, `src/lazy.ts`

- **`lazyDb(config, { init })`** returns an `ApexDbHandle` created **without `await`**,
  so it can live at a module's top level in environments that forbid top-level await
  (the classic-script `apex build --mobile` bundle). `dialect` is known synchronously
  (needed by `defineResource` at build time); `db` is a **deferred Drizzle proxy** that
  records a builder chain and replays it against the real instance when awaited (only
  ever inside async request handlers, after init completes). `init` runs once on first
  use — migrate + seed there.
- **On-device SQLite** (`createDeviceSqlite`) — when the mobile runtime sets
  `globalThis.__APEX_DEVICE__`, `createDb({ driver: 'libsql' })` transparently uses an
  in-memory **sql.js asm.js** backend (not WASM — sandboxed V8 / QuickJS / Hermes can't
  compile WASM). Same app code, no native driver, no filesystem. A snapshot seam
  (`__APEX_DB_SNAPSHOT__` / `__APEX_DB_EXPORT__`) lets the host persist bytes across
  cold starts; transactions are driven manually with `BEGIN/COMMIT/ROLLBACK` (Drizzle's
  sql-js `.transaction()` commits before an async callback settles).

---

## Extension points

- **A new field type / column mapping** → extend `FieldType`, `zodFor`, `column`,
  `sqlType` in `src/model.ts` (all four, per dialect).
- **A new behavior/trait** → author `(config) => Behavior` in the `src/behavior.ts`
  contract; it can contribute fields/insert-tweaks/migration/hooks/scope/access. Add a
  golden migration snapshot test (up **and** down). It rides the existing pipeline
  automatically.
- **A new bulk/query primitive** → add it to the AR layer in `src/query.ts`; route
  writes through `repository` so hooks/scope/soft-delete stay consistent (don't add a
  second write path).
- **A new driver** → add a branch in `openDb` returning an `ApexDbHandle`; keep the
  Drizzle async API so `defineResource`/AR work unchanged.
- **A new resource behavior** (e.g. a list param) → add it in `defineResource`'s route
  builders in `src/index.ts` and expose it on both the REST route and its MCP tool.

## Gotchas

- **Never add a second write path.** REST/MCP and `Model.*` must both go through
  `repository.ts` or a behavior/scope will silently apply to one surface and not the
  other. This is the whole point of the shared pipeline.
- **Timestamps are ISO strings.** Don't switch to `z.coerce.date()` — it breaks MCP
  `tools/list`. Use a `casts: { publishedAt: 'date' }` for a `Date` at the instance
  level instead.
- **Quote identifiers in any hand-written SQL** — Postgres lowercases unquoted
  camelCase columns.
- **Bulk ops bypass per-row hooks** by design (`upsert`/`insertMany`/`updateMany`). Use
  `create`/`update`/`updateOrCreate`/`delete` when you need timestamps/observers/audit.
- **`scope` can only narrow.** Behaviors AND-combine — a new behavior can never widen
  what a row op sees (fail-closed). A scoped column is stripped from update input, so
  you can't reassign ownership through a write.
- **On-device is in-memory + asm.js only** — seeded at boot, no WASM, no persistence
  without the snapshot seam.

*Grounded in: `packages/data/src/model.ts`, `repository.ts`, `index.ts` (createDb/defineResource/
applyMigrations/parseMigration/transactions/toPgPlaceholders), `query.ts`, `collection.ts`,
`relations.ts`, `behavior.ts`, `errors.ts`, `lazy.ts`, `device.ts`; plus `API.md`,
`packages/create-apexjs/templates/default/AGENTS.md`, and `packages/data/CHANGELOG.md`.*
