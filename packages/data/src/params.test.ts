import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDb, toPgPlaceholders } from './index.js'

// Bound parameters (#1) — exercised on the on-device sql.js backend (no native driver needed).
declare global {
  var __APEX_DEVICE__: boolean | undefined
}

describe('bound parameters (#1)', () => {
  beforeEach(() => {
    globalThis.__APEX_DEVICE__ = true
  })
  afterEach(() => {
    globalThis.__APEX_DEVICE__ = undefined
  })

  it('binds ? params in exec/query — values never string-concatenated', async () => {
    const h = await createDb({ driver: 'libsql', url: ':memory:' })
    await h.exec('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)')
    await h.exec('INSERT INTO users (name) VALUES (?)', ['Ada'])
    await h.exec('INSERT INTO users (name) VALUES (?)', ["O'Brien"]) // a quote survives, bound

    const found = await h.query('SELECT id, name FROM users WHERE name = ?', ["O'Brien"])
    expect(found).toHaveLength(1)
    expect(found[0]?.name).toBe("O'Brien")

    // A classic injection string is treated as a literal value, not SQL — table stays intact.
    const evil = await h.query('SELECT * FROM users WHERE name = ?', ["'; DROP TABLE users; --"])
    expect(evil).toHaveLength(0)
    const count = await h.query('SELECT COUNT(*) AS n FROM users')
    expect(Number(count[0]?.n)).toBe(2)

    await h.close()
  })

  it('supports multiple params + still allows param-free multi-statement exec', async () => {
    const h = await createDb({ driver: 'libsql', url: ':memory:' })
    // multi-statement exec (no params) — migrations/seeds path is unchanged
    await h.exec('CREATE TABLE a (x INTEGER); CREATE TABLE b (y INTEGER);')
    await h.exec('INSERT INTO a (x) VALUES (?), (?)', [1, 2])
    const rows = await h.query('SELECT x FROM a WHERE x >= ? ORDER BY x', [1])
    expect(rows.map((r) => r.x)).toEqual([1, 2])
    await h.close()
  })

  it('toPgPlaceholders translates ? → $n, skipping quoted literals', () => {
    expect(toPgPlaceholders('WHERE a = ? AND b = ?')).toBe('WHERE a = $1 AND b = $2')
    expect(toPgPlaceholders("SELECT '?' AS lit, ? AS bound")).toBe("SELECT '?' AS lit, $1 AS bound")
  })
})
