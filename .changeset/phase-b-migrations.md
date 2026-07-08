---
'@apex-stack/data': minor
'@apex-stack/core': minor
---

Up/down migrations + rollback (Phase B).

Migrations can now declare a reversible `down`: everything after a `-- @down` marker
line in a `*.sql` file is the down section (files without it stay up-only, exactly as
before — fully backward compatible). New `rollbackMigrations(handle, dir, steps?)`
reverts the most-recent applied migration(s) by running their `down` and un-recording
them, stopping safely at the first non-reversible one so nothing is undone out of
order. `apex migrate --rollback [--steps N]` drives it from the CLI, and
`apex make model` now generates a reversible migration (`CREATE TABLE` + `-- @down`
`DROP TABLE`). `applyMigrations` runs the `up` section (unchanged behavior for
existing plain-SQL migrations).
