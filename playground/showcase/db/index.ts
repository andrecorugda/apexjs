import { fileURLToPath } from 'node:url'
import { applyMigrations, createDb } from '@apex-stack/data'
import * as schema from './schema.js'

const handle = await createDb('data.db')
await applyMigrations(handle, fileURLToPath(new URL('./migrations', import.meta.url)))

export const db = handle.db
export { schema }
