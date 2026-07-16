import { describe, expect, it } from 'vitest'
import { createDb } from './index.js'
import { defineModel } from './model.js'

const Row = defineModel('rows', { fields: { n: { type: 'int', default: 0 } } })

describe('lockForUpdate + chunk', () => {
  it('lockForUpdate runs inside a Postgres transaction (SELECT … FOR UPDATE)', async () => {
    const h = await createDb({ driver: 'pglite' })
    await h.exec(Row.migrationSql(h.dialect))
    await Row.insertMany(h, [{ n: 1 }, { n: 2 }])
    const locked = await h.transaction((tx) => Row.where({ n: 1 }).lockForUpdate().all(tx))
    expect(locked).toHaveLength(1)
    await h.close()
  })

  it('chunk streams all rows in batches', async () => {
    const h = await createDb({ driver: 'pglite' })
    await h.exec(Row.migrationSql(h.dialect))
    await Row.insertMany(
      h,
      Array.from({ length: 25 }, (_, i) => ({ n: i })),
    )
    const seen: number[] = []
    const batches: number[] = []
    await Row.where({}).orderBy('n', 'asc').chunk(h, 10, (rows) => {
      batches.push(rows.length)
      for (const r of rows) seen.push(r.n as number)
    })
    expect(batches).toEqual([10, 10, 5]) // 25 rows in batches of 10
    expect(seen).toHaveLength(25)
    await h.close()
  })
})
