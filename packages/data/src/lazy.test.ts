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
        await h.exec(
          'CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT, body TEXT)',
        )
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
    const handle = lazyDb(() => ({ driver: 'libsql', url: ':memory:' }), {
      init: (h) =>
        h.exec(
          'CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT NOT NULL, body TEXT NOT NULL)',
        ),
    })
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

describe('shutdown-hook self-registration (#25)', () => {
  const KEY = '__APEX_SHUTDOWN_HOOKS__'
  const hooks = () => {
    const g = globalThis as Record<string, unknown>
    g[KEY] ??= new Set()
    return g[KEY] as Set<() => unknown>
  }

  beforeEach(() => {
    globalThis.__APEX_DEVICE__ = true // sql.js backend, no native driver needed
    hooks().clear()
  })
  afterEach(() => {
    globalThis.__APEX_DEVICE__ = undefined
    hooks().clear()
  })

  it('lazyDb registers a close hook on FIRST OPEN, not at construction', async () => {
    // NOTE: on-device registration is skipped by design — so run this bit off-device
    // with a libsql :memory: handle instead? sql.js needs no driver: temporarily
    // clear the device flag around createDb to exercise the registration path.
    globalThis.__APEX_DEVICE__ = undefined
    const handle = lazyDb(() => ({ driver: 'libsql', url: ':memory:' }))
    expect(hooks().size).toBe(0) // constructing a lazy handle opens nothing
    await handle.exec('CREATE TABLE t (id INTEGER)') // first use → opens → registers
    expect(hooks().size).toBe(1)
    await handle.close() // manual close deregisters (no double-close via hooks)
    expect(hooks().size).toBe(0)
  })

  it('on-device handles do NOT register (no process signals on mobile)', async () => {
    const handle = lazyDb(() => ({ driver: 'libsql', url: ':memory:' }))
    await handle.exec('CREATE TABLE t (id INTEGER)')
    expect(hooks().size).toBe(0)
    await handle.close()
  })
})
