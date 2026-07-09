# db/

Data is opt-in. To add a database with resources that are REST **and** MCP by default:

```bash
npm i @apex-stack/data @libsql/client   # install only the driver you use
```

Then add `db/schema.ts` (Drizzle tables), `db/index.ts` (`createDb` + `applyMigrations`),
and a resource in `server/api/*.ts`:

```ts
import { defineResource } from '@apex-stack/data'
export default defineResource('posts', { db, table: schema.posts, insert: { title: z.string() } })
```

That one line gives you `GET/POST/PATCH/DELETE /api/posts` plus the MCP tools
`posts_list/get/create/update/delete`. See https://apexjs.site/data.html
