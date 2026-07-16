---
"@apex-stack/data": minor
---

Active-record query API on `defineModel` (P1), built on Drizzle + the shared write
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
