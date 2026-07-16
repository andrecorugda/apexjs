---
"@apex-stack/data": minor
---

Query-power escape hatch: `Model.tableFor(handle)` returns the model's Drizzle table for the
handle's dialect, so joins / `GROUP BY` / aggregation / subqueries / window functions the
active-record API can't express are one `handle.db.select(...).from(Model.tableFor(handle))...`
away — with the full typed Drizzle builder.
