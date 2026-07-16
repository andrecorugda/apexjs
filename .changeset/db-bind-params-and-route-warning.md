---
"@apex-stack/data": minor
"@apex-stack/core": patch
---

**DB bind parameters (safety).** `ApexDbHandle.query(sql, params?)` and `exec(sql, params?)` now
accept bound parameters — use `?` placeholders (portable; translated to `$1,$2,…` on Postgres) so
values are bound by the driver instead of string-concatenated into SQL. Works across every driver
(libSQL/Turso, Postgres, PGlite) and the on-device sql.js backend; multi-statement `exec(sql)`
without params is unchanged (migrations/seeds). Exposes `SqlParam` and `toPgPlaceholders`. This
removes the need for hand-rolled escaping and the SQL-injection risk it carries.

**Clearer API-route error.** A `server/api/*.ts` that `export default`s a plain function (instead
of `defineApexRoute({...})` / `defineResource`) now logs an actionable warning explaining it won't
be served, instead of silently 404-ing.
