# Apex JS — Data (Phase 2, in progress)

> One table definition → REST endpoints **and** MCP tools. Your data is AI-callable by construction.

This is where the "Laravel + AI-native" thesis becomes concrete. `@apex-stack/data` wraps
[Drizzle](https://orm.drizzle.team) + SQLite and turns a table into a full resource.

## Define once

```ts
// db/schema.ts
export const todos = sqliteTable('todos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  text: text('text').notNull(),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
})

// server/api/todos.ts
import { defineResource } from '@apex-stack/data'
import { db, schema } from '../../db/index.js'

export default defineResource('todos', {
  db,
  table: schema.todos,
  insert: { text: z.string(), done: z.boolean().optional() },
})
```

You now have — from that single definition:

| Surface | REST | MCP tool |
| --- | --- | --- |
| List | `GET /api/todos` | `todos_list` |
| Get | `GET /api/todos/:id` | `todos_get` |
| Create | `POST /api/todos` | `todos_create` |
| Update | `PATCH /api/todos/:id` | `todos_update` |
| Delete | `DELETE /api/todos/:id` | `todos_delete` |

The REST endpoints and the MCP tools run the **same handlers over the same database**.
An AI that creates a todo via `todos_create` and a browser that lists via `GET /api/todos`
see the same data. No other full-stack framework does this by default.

## Databases / drivers

`createDb` is driver-agnostic (all drivers use Drizzle's async API, so `defineResource` works
unchanged across them). Postgres/PGlite drivers load on demand — install only what you use.

```ts
// db/index.ts — pick your database in one line:
await createDb('data.db')                                    // local SQLite (libSQL)
await createDb({ driver: 'libsql', url: process.env.TURSO_URL })     // Turso (edge)
await createDb({ driver: 'postgres', url: process.env.DATABASE_URL }) // Supabase / Neon
await createDb({ driver: 'pglite' })                                  // embedded Postgres (tests)
```

Because SQLite/Turso are the same dialect and Supabase/Neon/PGlite are all Postgres, a `defineResource`
written once runs on any of them. Edge targets (Cloudflare Workers) can't run native SQLite — pair
them with Turso or Supabase, whose drivers are fetch-based.

## Migrations

`applyMigrations(sqlite, dir)` runs `db/migrations/*.sql` in order, once each, tracked in an
`_apex_migrations` table — applied on boot in dev, or explicitly with **`apex migrate`**
(idempotent; resolves `@apex-stack/data` from the app). `drizzle-kit`-generated migrations are the
next step.

## Proven end-to-end

`playground/data` defines the `todos` resource. `pnpm check` (`data-check.mjs`) verifies:

| Check | Result |
| --- | --- |
| `POST /api/todos` creates a row (id + defaults) | ✅ |
| MCP exposes `todos_list` / `todos_get` / `todos_create` | ✅ |
| A row created via the **MCP tool** appears in the **REST list** (one DB) | ✅ |
| `GET /api/todos/:id` returns the row | ✅ |
| Migrations applied on boot from `db/migrations/*.sql` | ✅ |

## Scope & deferrals

- Built: `createDb`, `applyMigrations`, `defineResource` (full CRUD: list/get/create/update/delete),
  Drizzle + SQLite.
- Next: `apex make:model` + `drizzle-kit` migrations + `apex migrate` CLI, per-route auth scoping,
  other Drizzle drivers (Postgres/libSQL), then jobs/queues (Phase 3).
