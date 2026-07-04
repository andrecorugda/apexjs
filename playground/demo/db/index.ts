import { createDb } from '@apex-stack/data'
import * as schema from './schema.js'

// In-memory libSQL for the demo; seeded once on boot.
const handle = await createDb({ driver: 'libsql', url: ':memory:' })
await handle.exec(
  `CREATE TABLE IF NOT EXISTS messages (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     author TEXT NOT NULL,
     body TEXT NOT NULL,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
)
const seeded = await handle.db.select().from(schema.messages)
if (seeded.length === 0) {
  await handle.db.insert(schema.messages).values([
    { author: 'Ada Lovelace', body: 'Apex feels like HTML with superpowers.' },
    { author: 'Alan Turing', body: 'One route, and my assistant can call it too. Wild.' },
  ])
}

export const db = handle.db
export { schema }
