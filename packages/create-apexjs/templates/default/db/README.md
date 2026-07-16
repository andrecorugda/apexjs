# db/

Data is opt-in. Add it in one step with `apex extend data` (scaffolds a demo model, its
REST + MCP resource, a `/guestbook` page, and the shared `db/index.ts` handle), or wire it
by hand:

```bash
# install the data layer + drivers (add `postgres` for a hosted DB)
npm i @apex-stack/data drizzle-orm @libsql/client sql.js
```

A **model** is the single source of truth — one `defineModel(...)` derives the Zod
validation, the Drizzle table, the migration SQL, and a full REST + MCP resource:

```ts
// models/Message.ts
import { defineModel, timestamps } from '@apex-stack/data'

export const Message = defineModel('messages', {
  fields: {
    author: { type: 'string', notNull: true },
    body: { type: 'string', notNull: true },
  },
  use: [timestamps()],
})
```

Open the database **lazily** in `db/index.ts` so it also bundles into `apex build --mobile`
(a bare on-device engine can't do top-level `await`). One handle is shared app-wide — a
file-backed SQLite locally (data + migration history persist), Postgres when `DATABASE_URL`
is set. On boot it applies the versioned `.sql` files in `db/migrations/` (tracked in an
`_apex_migrations` ledger, shared with `apex migrate`); on-device (no filesystem) it falls
back to creating the schema straight from the model:

```ts
// db/index.ts
import { applyMigrations, lazyDb } from '@apex-stack/data'
import { Message } from '../models/Message.js'

const url = process.env.DATABASE_URL
const onDevice = (globalThis as { __APEX_DEVICE__?: boolean }).__APEX_DEVICE__
export const handle = lazyDb(
  () => (url ? { driver: 'postgres', url } : { driver: 'libsql', url: 'file:./data.db' }),
  { init: async (h) => {
    onDevice ? await h.exec(Message.migrationSql(h.dialect)) : await applyMigrations(h, 'db/migrations')
  } },
)
```

Schema changes are new files in `db/migrations/` (`apex make model` writes the first one for
you); run them with `apex migrate` (reverse with `apex migrate --rollback`).

Mount the model as a resource — this one line gives you `GET/POST/PATCH/DELETE /api/messages`
plus the MCP tools `messages_list/get/create/update/delete`:

```ts
// server/api/messages.ts
import { handle } from '../../db/index.js'
import { Message } from '../../models/Message.js'
export default Message.resource(handle)
```

Read and write from loaders/services with the **active-record API** — no hand-written SQL
(writes fire the model's hooks / scope / soft-deletes, exactly like the resource does):

```ts
await Message.where({}).orderBy('id', 'desc').limit(20).all(handle) // list
await Message.find(handle, id)                                      // by id
await Message.create(handle, { author: 'Ada', body: 'Hi' })         // insert
```

`apex make model <Name> field:type …` generates the model, its resource, a starter
migration, and `db/index.ts` (if absent) for you. See https://apexjs.site/data.html
