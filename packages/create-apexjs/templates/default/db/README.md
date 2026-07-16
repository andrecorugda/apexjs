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
(a bare on-device engine can't do top-level `await`). One handle is shared app-wide —
libSQL in-memory locally / on-device, Postgres when `DATABASE_URL` is set:

```ts
// db/index.ts
import { lazyDb } from '@apex-stack/data'
import { Message } from '../models/Message.js'

const url = process.env.DATABASE_URL
export const handle = lazyDb(
  () => (url ? { driver: 'postgres', url } : { driver: 'libsql', url: ':memory:' }),
  { init: async (h) => { await h.exec(Message.migrationSql(h.dialect)) } }, // dialect-aware schema
)
```

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
