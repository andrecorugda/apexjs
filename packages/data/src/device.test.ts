import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDb } from './index.js'

// Exercise the on-device sql.js backend the way the mobile bundle does: flip the
// __APEX_DEVICE__ flag so `createDb({ driver: 'libsql' })` routes to sql.js (WASM),
// with no @libsql/client and no filesystem. The wasm is loaded from the installed
// package here (off-device path); on device the bundler injects it.
declare global {
  var __APEX_DEVICE__: boolean | undefined
}

describe('on-device sql.js backend', () => {
  beforeEach(() => {
    globalThis.__APEX_DEVICE__ = true
  })
  afterEach(() => {
    globalThis.__APEX_DEVICE__ = undefined
  })

  it('runs the guestbook lifecycle SQL (exec + query) on a bare WASM SQLite', async () => {
    const handle = await createDb({ driver: 'libsql', url: ':memory:' })
    expect(handle.dialect).toBe('sqlite')

    await handle.exec(`CREATE TABLE messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT
    )`)
    await handle.exec(`INSERT INTO messages (author, body, created_at) VALUES
      ('Ada Lovelace', 'Apex — HTML with superpowers ✓', datetime('now')),
      ('Alan Turing', 'One route, AI-callable', datetime('now'))`)

    const count = await handle.query('SELECT COUNT(*) AS n FROM messages')
    expect(Number(count[0]?.n)).toBe(2)

    const rows = await handle.query(
      'SELECT id, author, body FROM messages ORDER BY id DESC LIMIT 20',
    )
    expect(rows).toHaveLength(2)
    expect(rows[0]?.author).toBe('Alan Turing')
    // Unicode/em-dash survives the WASM round-trip (the mobile codec bug class, #52).
    expect(String(rows[1]?.body)).toContain('superpowers ✓')

    await handle.close()
  })

  it('supports a Drizzle insert().returning() — the /api/messages POST path', async () => {
    const handle = await createDb({ driver: 'libsql', url: ':memory:' })
    await handle.exec('CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)')
    // Raw RETURNING (what drizzle emits for .returning() on SQLite >= 3.35).
    const inserted = await handle.query("INSERT INTO t (name) VALUES ('Grace') RETURNING id, name")
    expect(inserted[0]).toMatchObject({ id: 1, name: 'Grace' })
    await handle.close()
  })

  it('gives each handle an isolated in-memory database', async () => {
    const a = await createDb({ driver: 'libsql', url: ':memory:' })
    const b = await createDb({ driver: 'libsql', url: ':memory:' })
    await a.exec('CREATE TABLE x (v INTEGER)')
    await a.exec('INSERT INTO x (v) VALUES (1)')
    // b never saw table x — separate database instances.
    await expect(b.query('SELECT * FROM x')).rejects.toThrow()
    await a.close()
    await b.close()
  })
})
