import { defineResource } from '@apex-stack/data'
import { z } from 'zod'
import { db, schema } from '../../db/index.js'

// REST at /api/messages AND MCP tools messages_list/get/create/update/delete.
export default defineResource('messages', {
  db,
  table: schema.messages,
  insert: { author: z.string().min(1), body: z.string().min(1).max(280) },
})
