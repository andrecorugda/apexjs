import { defineResource } from '@apex-stack/data'
import { z } from 'zod'
import { db, schema } from '../../db/index.js'

// One definition → REST endpoints AND MCP tools, backed by SQLite/Drizzle:
//   GET  /api/todos      · tool todos_list
//   GET  /api/todos/:id  · tool todos_get
//   POST /api/todos      · tool todos_create
export default defineResource('todos', {
  db,
  table: schema.todos,
  insert: { text: z.string(), done: z.boolean().optional() },
})
