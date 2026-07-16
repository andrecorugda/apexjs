---
"@apex-stack/data": minor
---

Bulk operations on models for imports/ETL: `Model.insertMany(handle, rows[])` inserts in
one statement (scope-stamped, returns the rows) and `Model.updateMany(handle, conds, values)`
updates every row matching `conds` (returns the count). Both are fast bulk primitives that
bypass per-row hooks (like Eloquent's bulk `insert`/`update`) — use `create`/`update` when you
need timestamps/observers.
