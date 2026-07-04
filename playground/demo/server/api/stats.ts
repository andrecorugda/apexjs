import { defineApexRoute } from '@apex-stack/core'
import { db, schema } from '../../db/index.js'
import { GuestbookService } from '../../services/GuestbookService.js'

const service = new GuestbookService()

// GET /api/stats · MCP tool "stats" — thin route → service.
export default defineApexRoute({
  method: 'GET',
  description: 'Guestbook stats: total signatures and the latest author',
  mcp: true,
  handler: async () => {
    const rows = await db.select().from(schema.messages)
    const latest = rows.at(-1)
    return { total: rows.length, latestAuthor: latest ? service.initials(latest.author) : null }
  },
})
