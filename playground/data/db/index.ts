import { fileURLToPath } from 'node:url'
import { applyMigrations, createDb } from '@apex-stack/data'
import * as schema from './schema.js'

// Open the app database and apply any pending SQL migrations on boot.
const { db, sqlite } = createDb('data.db')
applyMigrations(sqlite, fileURLToPath(new URL('./migrations', import.meta.url)))

export { db, schema }
