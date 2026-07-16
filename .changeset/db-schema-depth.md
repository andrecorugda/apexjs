---
"@apex-stack/data": minor
---

Schema depth for real apps: field `index: true` (single-column index), field `references:
{ table, column?, onDelete? }` (foreign keys with cascade/set-null/restrict), and a model-level
`indexes: [{ on: [...], unique?, name? }]` for composite/named indexes — all emitted by
`migrationSql`. Without indexes on FKs and hot filter columns, real queries table-scan.

Also fixes a latent Postgres bug: `migrationSql` now **quotes identifiers**, so camelCase
columns (`ownerId`, `teamId`, `createdAt`) match Drizzle's quoted names. Previously Postgres
lower-cased unquoted camelCase columns (`teamId` → `teamid`) and every camelCase column —
including the one `owned()` stamps — broke on Postgres.
