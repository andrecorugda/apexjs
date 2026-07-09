import { defineModel, timestamps } from '@apex-stack/data'

// A model is Apex's single source of truth for a piece of data. This ONE
// definition derives, with no extra wiring:
//   • a typed Zod schema for insert/update validation
//   • the SQL migration in db/migrations
//   • a Drizzle table (per dialect: sqlite/libSQL/postgres)
//   • a full REST + MCP resource — GET/POST /api/messages, tools
//     messages_list / messages_get / messages_create / …
//
// Behaviors are composable, reusable lifecycle add-ons. `timestamps()` stamps
// created_at on insert + updated_at on every write and keeps them out of the
// client-writable insert shape. Others ship in @apex-stack/data: owned() (per-user
// ownership + auth gating), softDeletes(), auditable(), observable().
export const Message = defineModel('messages', {
  fields: {
    author: { type: 'string', notNull: true },
    body: { type: 'string', notNull: true },
  },
  use: [timestamps()],
})
