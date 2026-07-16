---
"@apex-stack/data": minor
---

Concurrency + large-table helpers on the query builder: `.lockForUpdate()` emits
`SELECT … FOR UPDATE` on Postgres (use inside `handle.transaction` for pessimistic
locking; no-op on sqlite, which locks the whole db in a tx), and `.chunk(handle, size, fn)`
streams matching rows in batches so you can process big tables without loading them all.
