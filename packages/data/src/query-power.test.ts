import { describe, expect, it } from 'vitest'
import { sql } from 'drizzle-orm'
import { createDb } from './index.js'
import { defineModel } from './model.js'

const Sale = defineModel('sales', {
  fields: { region: { type: 'string', notNull: true }, amount: { type: 'int', default: 0 } },
})

describe('query-power escape hatch (tableFor + handle.db)', () => {
  it('supports GROUP BY / aggregation via the raw Drizzle builder', async () => {
    const h = await createDb({ driver: 'pglite' })
    await h.exec(Sale.migrationSql(h.dialect))
    await Sale.insertMany(h, [
      { region: 'NA', amount: 10 },
      { region: 'NA', amount: 5 },
      { region: 'EU', amount: 7 },
    ])
    const t = Sale.tableFor(h) as { region: unknown }
    const rows = (await h.db
      .select({ region: t.region, total: sql<number>`sum(${(t as { amount: unknown }).amount})` })
      .from(t)
      .groupBy(t.region)
      .orderBy(t.region)) as Array<{ region: string; total: number }>
    expect(rows.map((r) => [r.region, Number(r.total)])).toEqual([
      ['EU', 7],
      ['NA', 15],
    ])
    await h.close()
  })
})
