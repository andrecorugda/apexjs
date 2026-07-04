import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  author: text('author').notNull(),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})
