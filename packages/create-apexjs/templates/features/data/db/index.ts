import { lazyDb } from '@apex-stack/data'
import { Message } from '../models/Message.js'

// Open the database lazily — no top-level `await`, so this module also bundles into the
// classic-script `apex build --mobile` output (a bare on-device engine can't do top-level
// await). On-device, `createDb`'s libSQL driver transparently becomes an in-memory sql.js
// database; a hosted Postgres is used when DATABASE_URL is set (server/dev only). The real
// connection opens + migrates + seeds on first use.
const url = process.env.DATABASE_URL
export const handle = lazyDb(
  () => (url ? { driver: 'postgres', url } : { driver: 'libsql', url: ':memory:' }),
  {
    init: async (h) => {
      // Create the schema — dialect-aware (SQLite vs Postgres) and idempotent, from the model.
      await h.exec(Message.migrationSql(h.dialect))

      // Seed a couple of rows if the table is empty.
      const now = h.dialect === 'postgres' ? 'now()' : "datetime('now')"
      const seeded = await h.query('SELECT COUNT(*) AS n FROM messages')
      if (Number(seeded[0]?.n ?? 0) === 0) {
        await h.exec(
          `INSERT INTO messages (author, body, created_at, updated_at) VALUES
            ('Ada Lovelace', 'Apex feels like HTML with superpowers.', ${now}, ${now}),
            ('Alan Turing', 'One route — and my AI assistant can call it too.', ${now}, ${now})`,
        )
      }
    },
  },
)
