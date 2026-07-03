import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const features = sqliteTable('features', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  tag: text('tag').notNull().default('core'),
})
