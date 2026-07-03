import { fileURLToPath } from 'node:url'
import { applyMigrations, createDb } from '@apex-stack/data'
import * as schema from './schema.js'

// Open the app database (libSQL/SQLite) and apply pending migrations on boot.
// Swap to Postgres/Supabase by changing this one line, e.g.
//   await createDb({ driver: 'postgres', url: process.env.DATABASE_URL })
const handle = await createDb('data.db')
await applyMigrations(handle, fileURLToPath(new URL('./migrations', import.meta.url)))

export const db = handle.db
export { schema }
