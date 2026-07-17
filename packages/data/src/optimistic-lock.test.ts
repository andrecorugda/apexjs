import { describe, expect, it } from 'vitest'
import { createDb, StaleModelException } from './index.js'
import { defineModel } from './model.js'

const Doc = defineModel('docs', {
  fields: { title: { type: 'string', notNull: true }, version: { type: 'int', default: 0 } },
  optimisticLock: 'version',
})

describe('optimistic locking', () => {
  it('bumps version on save and rejects a stale write', async () => {
    const h = await createDb({ driver: 'pglite' })
    await h.exec(Doc.migrationSql(h.dialect))
    const a = await Doc.create(h, { title: 'v1' })
    expect(a.version).toBe(0)

    // Two independent handles on the same row (simulate concurrent editors).
    const first = await Doc.find(h, a.id)
    const second = await Doc.find(h, a.id)
    if (!first || !second) throw new Error('both handles should resolve the created row')

    first.title = 'edited by first'
    await first.save()
    expect(first.version).toBe(1) // bumped

    // second still thinks version is 0 → its save must lose.
    second.title = 'edited by second'
    await expect(second.save()).rejects.toBeInstanceOf(StaleModelException)

    const fresh = await Doc.find(h, a.id)
    if (!fresh) throw new Error('the row should still exist')
    expect(fresh.title).toBe('edited by first') // the loser did not overwrite
    await h.close()
  })
})
