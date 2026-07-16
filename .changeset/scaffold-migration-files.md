---
"create-apexjs": minor
"@apex-stack/core": patch
---

Scaffolds now use real, versioned migration files instead of pushing the schema from the model.
`db/index.ts`'s `init` runs `applyMigrations(handle, 'db/migrations')` on the server/dev (the tracked
`.sql` files, recorded in the `_apex_migrations` ledger so each runs once and `apex migrate` shares
it) and only falls back to `model.migrationSql()` on-device (the mobile bundle has no filesystem).
The data feature ships a real first migration (`0001_create_messages.sql`); `apex make model`'s
generated migration now quotes identifiers (matching `defineModel`'s own SQL — fixes Postgres
camelCase drift) and is actually applied. Local dev defaults to a persistent `file:./data.db`
(data + history survive restarts); `*.db` is gitignored.
