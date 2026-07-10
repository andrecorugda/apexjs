import { createDb } from '@apex-stack/data'
import { Message } from '../models/Message.js'

// Use a hosted Postgres (Supabase / Neon / any Postgres) when DATABASE_URL is
// set — otherwise an in-memory libSQL for zero-setup local dev. createDb
// auto-tunes Postgres for a transaction pooler (e.g. Supabase's, on port 6543):
// it disables prepared statements and enables SSL. Requires the `postgres` driver
// (already a dependency of this app).
const url = process.env.DATABASE_URL
export const handle = url
  ? await createDb({ driver: 'postgres', url })
  : await createDb({ driver: 'libsql', url: ':memory:' })

// Create the schema — dialect-aware (SQLite vs Postgres) and idempotent, straight
// from the model. For a long-lived Postgres you'd normally run `apex migrate`
// once and drop this; keeping it makes the showcase zero-setup on either backend.
await handle.exec(Message.migrationSql(handle.dialect))

// Seed a couple of rows if the table is empty.
const now = handle.dialect === 'postgres' ? 'now()' : "datetime('now')"
const seeded = await handle.query('SELECT COUNT(*) AS n FROM messages')
if (Number(seeded[0]?.n ?? 0) === 0) {
  await handle.exec(
    `INSERT INTO messages (author, body, created_at, updated_at) VALUES
      ('Ada Lovelace', 'Apex feels like HTML with superpowers.', ${now}, ${now}),
      ('Alan Turing', 'One route — and my AI assistant can call it too.', ${now}, ${now})`,
  )
}
