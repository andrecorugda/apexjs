import { createDb } from '@apex-stack/data'

// In-memory libSQL — deterministic and zero-setup for the showcase. For a real,
// persistent app, change this one line to a file or Postgres:
//   await createDb('data.db')                                     // SQLite file
//   await createDb({ driver: 'postgres', url: process.env.DATABASE_URL })
export const handle = await createDb({ driver: 'libsql', url: ':memory:' })

// Create the schema at boot. This mirrors db/migrations/0001_init.sql (generated
// from models/Message.ts). An in-memory DB is rebuilt on every start, so we apply
// the schema in code here; a persistent DB would instead run the file-based
// migrations once with `apex migrate` before `apex start`.
await handle.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT,
    updated_at TEXT,
    author TEXT NOT NULL,
    body TEXT NOT NULL
  )
`)

// Seed a couple of rows so the guestbook isn't empty on first boot.
const seeded = await handle.query('SELECT COUNT(*) AS n FROM messages')
if (Number(seeded[0]?.n ?? 0) === 0) {
  await handle.exec(
    `INSERT INTO messages (author, body, created_at, updated_at) VALUES
      ('Ada Lovelace', 'Apex feels like HTML with superpowers.', datetime('now'), datetime('now')),
      ('Alan Turing', 'One route — and my AI assistant can call it too.', datetime('now'), datetime('now'))`,
  )
}
