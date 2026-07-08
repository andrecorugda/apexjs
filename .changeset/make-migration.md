---
'@apex-stack/core': patch
---

`apex make migration <name>` — scaffold an empty, reversible SQL migration.

Creates a timestamped `db/migrations/<ts>_<name>.sql` with `up` + `-- @down` stubs
for hand-written schema changes (`ALTER TABLE`, `CREATE INDEX`, `CREATE TRIGGER`,
`CREATE VIEW`, data backfills, …). Migrations were never limited to CREATE/DROP — the
runner executes any SQL in the up/down sections; this just gives you a quick way to
author one (only `apex make model` had scaffolded migrations before).
