---
"@apex-stack/data": minor
---

Database transactions: `handle.transaction(async (tx) => { … })` — auto-commits when the
callback resolves, auto-rolls-back if it throws. The callback gets a handle bound to the
transaction, so AR/`db` writes inside it are atomic (`await Order.create(tx, …)`; a throw
undoes the whole unit). Works on libSQL/Postgres/PGlite via Drizzle, and on the on-device
sql.js backend via a manual BEGIN/COMMIT/ROLLBACK path (Drizzle's synchronous sql-js
transaction can't roll back an async callback body). Nested transactions use savepoints on
the server backends. Also threaded through `lazyDb`.
