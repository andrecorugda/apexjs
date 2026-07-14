import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { lazyDb } from './lazy.js'

// The lazy handle must work without any top-level await AND drive Drizzle through its
// deferred `db` proxy — the exact shape defineResource uses at request time. Run it on the
// on-device sql.js backend (the environment that forces this pattern).
declare global {
  var __APEX_DEVICE__: boolean | undefined
}

const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  author: text('author').notNull(),
  body: text('body').notNull(),
})

describe('lazyDb (top-level-await-free handle)', () => {
  beforeEach(() => {
    globalThis.__APEX_DEVICE__ = true
  })
  afterEach(() => {
    globalThis.__APEX_DEVICE__ = undefined
  })

  it('exposes dialect synchronously (no await) from the driver', () => {
    expect(lazyDb({ driver: 'libsql', url: ':memory:' }).dialect).toBe('sqlite')
    expect(lazyDb('data.db').dialect).toBe('sqlite')
  })

  it('runs the init hook once, then serves raw exec/query', async () => {
    let inits = 0
    const handle = lazyDb(() => ({ driver: 'libsql', url: ':memory:' }), {
      init: async (h) => {
        inits++
        await h.exec('CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT, body TEXT)')
        await h.exec("INSERT INTO messages (author, body) VALUES ('Ada', 'hi')")
      },
    })
    const a = await handle.query('SELECT COUNT(*) AS n FROM messages')
    const b = await handle.query('SELECT author FROM messages')
    expect(Number(a[0]?.n)).toBe(1)
    expect(b[0]?.author).toBe('Ada')
    expect(inits).toBe(1) // init ran exactly once across multiple calls
    await handle.close()
  })

  it('drives Drizzle via the deferred proxy: insert().returning() + select().from().where()', async () => {
    const handle = lazyDb(
      () => ({ driver: 'libsql', url: ':memory:' }),
      {
        init: (h) =>
          h.exec('CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT NOT NULL, body TEXT NOT NULL)'),
      },
    )
    const db = handle.db

    // insert().values().returning() — the /api/messages POST path
    const created = await db.insert(messages).values({ author: 'Grace', body: 'first' }).returning()
    expect(created[0]).toMatchObject({ id: 1, author: 'Grace' })

    await db.insert(messages).values({ author: 'Alan', body: 'second' }).returning()

    // select().from() with no where — the list path
    const all = await db.select().from(messages)
    expect(all).toHaveLength(2)

    // select().from().where() — the get/filtered path
    const one = await db.select().from(messages).where(sql`${messages.author} = 'Grace'`)
    expect(one).toHaveLength(1)
    expect(one[0]?.body).toBe('first')

    await handle.close()
  })
})
