---
'@apex-stack/data': minor
---

`defineModel` — single source of truth for a data model.

One field spec derives everything: `defineModel('todos', { fields: { title: 'string',
done: { type: 'boolean', default: false } } })` gives you the zod insert/update
validation, a dialect-aware Drizzle table, the `CREATE TABLE` migration SQL, and a
REST + MCP resource (`.resource(db)` → list/get/create/update/delete). Write the
shape once instead of hand-wiring a Drizzle table + zod + `defineResource`
separately. Dialect-agnostic (SQLite/libSQL/Turso + Postgres/Supabase/Neon/PGlite).
(`apex make:model` scaffolding + auto-mount + up/down migrations land next.)
