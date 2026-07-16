import { applyMigrations, lazyDb } from '@apex-stack/data'
import { Message } from '../models/Message.js'

// Open the database lazily — no top-level `await`, so this module also bundles into the
// classic-script `apex build --mobile` output (a bare on-device engine can't do top-level
// await). Locally it's a file-backed libSQL/SQLite database (data + migration history persist);
// a hosted Postgres is used when DATABASE_URL is set (server/dev only).
const url = process.env.DATABASE_URL
// The mobile bundle has no filesystem to read `db/migrations/` from — there, create the
// schema straight from the model instead. Everywhere else, run the versioned .sql migrations.
const onDevice = (globalThis as { __APEX_DEVICE__?: boolean }).__APEX_DEVICE__

export const handle = lazyDb(
  () => (url ? { driver: 'postgres', url } : { driver: 'libsql', url: 'file:./data.db' }),
  {
    init: async (h) => {
      // Schema: apply the tracked migration files (recorded in `_apex_migrations`, so each
      // runs once and `apex migrate` shares the same ledger). On-device, create from the model.
      if (onDevice) await h.exec(Message.migrationSql(h.dialect))
      else await applyMigrations(h, 'db/migrations')

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
