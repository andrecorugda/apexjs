import { fileURLToPath } from 'node:url'
import { applyMigrations, createDb } from '@apex-stack/data'

// In-memory libSQL — deterministic and zero-setup for the showcase. For a real
// app, persist by changing this ONE line:
//   await createDb('data.db')                                    // SQLite file
//   await createDb({ driver: 'postgres', url: process.env.DATABASE_URL })
export const handle = await createDb({ driver: 'libsql', url: ':memory:' })

// Apply the migrations generated from models/*.ts.
await applyMigrations(handle, fileURLToPath(new URL('./migrations', import.meta.url)))

// Seed a couple of rows so the guestbook isn't empty on first boot.
const seeded = await handle.query('SELECT COUNT(*) AS n FROM messages')
if (Number(seeded[0]?.n ?? 0) === 0) {
  await handle.exec(
    `INSERT INTO messages (author, body, created_at, updated_at) VALUES
      ('Ada Lovelace', 'Apex feels like HTML with superpowers.', datetime('now'), datetime('now')),
      ('Alan Turing', 'One route — and my AI assistant can call it too.', datetime('now'), datetime('now'))`,
  )
}
