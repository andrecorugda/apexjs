# @apex-stack/data

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
