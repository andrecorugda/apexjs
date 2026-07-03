import { defineResource } from '@apex-stack/data'
import { z } from 'zod'
import { db, schema } from '../../db/index.js'

// One definition → REST endpoints AND MCP tools (features_list/get/create/update/delete),
// backed by SQLite. The UI below and an AI assistant call the SAME handlers.
export default defineResource('features', {
  db,
  table: schema.features,
  insert: { name: z.string(), tag: z.string().optional() },
})
