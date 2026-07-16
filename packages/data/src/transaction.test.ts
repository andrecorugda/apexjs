import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type ApexDbHandle, createDb } from './index.js'
import { defineModel } from './model.js'

declare global {
  var __APEX_DEVICE__: boolean | undefined
}

const Acct = defineModel('accounts', {
  fields: { name: { type: 'string', notNull: true }, balance: { type: 'int', default: 0 } },
})

function suite(make: () => Promise<ApexDbHandle>): void {
  it('commits when the callback resolves — AR writes inside the tx persist', async () => {
    const h = await make()
    await h.exec(Acct.migrationSql(h.dialect))
    const rv = await h.transaction(async (tx) => {
      await Acct.create(tx, { name: 'a', balance: 100 })
      await Acct.create(tx, { name: 'b', balance: 50 })
      return 'done'
    })
    expect(rv).toBe('done') // callback return value flows out
    expect(await Acct.count(h)).toBe(2)
    await h.close()
  })

  it('rolls back the WHOLE unit when the callback throws (atomicity)', async () => {
    const h = await make()
    await h.exec(Acct.migrationSql(h.dialect))
    const seed = await Acct.create(h, { name: 'seed', balance: 1 }) // committed before the tx

    await expect(
      h.transaction(async (tx) => {
        await Acct.create(tx, { name: 'x', balance: 999 }) // insert…
        await Acct.update(tx, seed.id, { balance: 999 }) // …and mutate the seed…
        throw new Error('boom') // …then blow up
      }),
    ).rejects.toThrow('boom')

    // Neither the insert nor the update survived — the unit was atomic.
    expect(await Acct.count(h)).toBe(1)
    const after = await Acct.find(h, seed.id)
    expect(after?.balance).toBe(1)
    await h.close()
  })
}

describe('transactions — sqlite (device sql.js: manual BEGIN/COMMIT/ROLLBACK)', () => {
  beforeEach(() => {
    globalThis.__APEX_DEVICE__ = true
  })
  afterEach(() => {
    globalThis.__APEX_DEVICE__ = undefined
  })
  suite(() => createDb({ driver: 'libsql', url: ':memory:' }))
})

describe('transactions — postgres (pglite: Drizzle tx)', () => {
  suite(() => createDb({ driver: 'pglite' }))
})
