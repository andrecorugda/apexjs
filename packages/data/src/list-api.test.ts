import { describe, expect, it } from 'vitest'
import { createDb } from './index.js'
import { defineModel } from './model.js'

// The resource `_list` route (REST + MCP) supports ?page/?perPage, ?sort=-col, and ?<col>=value
// filters — without which it returns a plain array (backward-compatible).

const Item = defineModel('items', {
  fields: { name: { type: 'string', notNull: true }, rank: { type: 'int', default: 0 } },
})

type Handler = (a: { input?: unknown; user?: unknown }) => Promise<unknown>

async function setup() {
  const h = await createDb({ driver: 'pglite' })
  await h.exec(Item.migrationSql(h.dialect))
  await Item.create(h, { name: 'a', rank: 5 })
  await Item.create(h, { name: 'b', rank: 9 })
  await Item.create(h, { name: 'c', rank: 1 })
  await Item.create(h, { name: 'd', rank: 7 })
  await Item.create(h, { name: 'e', rank: 3 })
  const list = Item.resource(h).routes.find((r) => r.mcpName === 'items_list')?.route
    .handler as Handler
  return { h, list }
}

describe('resource list — pagination / filter / sort', () => {
  it('returns a plain array when no pagination is requested', async () => {
    const { h, list } = await setup()
    const rows = (await list({})) as unknown[]
    expect(rows).toHaveLength(5)
    await h.close()
  })

  it('sorts by ?sort=-col (desc) and ?sort=col (asc)', async () => {
    const { h, list } = await setup()
    const desc = (await list({ input: { sort: '-rank' } })) as Array<{ rank: number }>
    expect(desc.map((r) => r.rank)).toEqual([9, 7, 5, 3, 1])
    const asc = (await list({ input: { sort: 'rank' } })) as Array<{ rank: number }>
    expect(asc.map((r) => r.rank)).toEqual([1, 3, 5, 7, 9])
    await h.close()
  })

  it('filters by ?<col>=value', async () => {
    const { h, list } = await setup()
    const filtered = (await list({ input: { name: 'b' } })) as Array<{ name: string }>
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.name).toBe('b')
    await h.close()
  })

  it('returns a { data, total, page, perPage, lastPage } envelope when paginated', async () => {
    const { h, list } = await setup()
    const p = (await list({ input: { page: 1, perPage: 2, sort: 'rank' } })) as {
      data: Array<{ rank: number }>
      total: number
      page: number
      perPage: number
      lastPage: number
    }
    expect(p.total).toBe(5)
    expect(p.page).toBe(1)
    expect(p.perPage).toBe(2)
    expect(p.lastPage).toBe(3)
    expect(p.data.map((r) => r.rank)).toEqual([1, 3]) // page 1, asc by rank
    const p2 = (await list({ input: { page: 3, perPage: 2, sort: 'rank' } })) as {
      data: Array<{ rank: number }>
    }
    expect(p2.data.map((r) => r.rank)).toEqual([9]) // last page has the remainder
    await h.close()
  })

  it('filter + pagination compose (total reflects the filter)', async () => {
    const { h, list } = await setup()
    const p = (await list({ input: { name: 'c', page: 1, perPage: 10 } })) as {
      data: unknown[]
      total: number
    }
    expect(p.total).toBe(1)
    expect(p.data).toHaveLength(1)
    await h.close()
  })
})
