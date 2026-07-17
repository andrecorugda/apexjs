import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDb, ModelNotFoundException, QueryException } from './index.js'
import { defineModel } from './model.js'

const Thing = defineModel('things', { fields: { name: { type: 'string', notNull: true } } })

describe('typed data errors', () => {
  beforeEach(() => {
    globalThis.__APEX_DEVICE__ = true
  })
  afterEach(() => {
    globalThis.__APEX_DEVICE__ = undefined
  })

  it('findOrFail / firstOrFail throw ModelNotFoundException (httpStatus 404)', async () => {
    const h = await createDb({ driver: 'libsql', url: ':memory:' })
    await h.exec(Thing.migrationSql(h.dialect))
    await expect(Thing.findOrFail(h, 999)).rejects.toBeInstanceOf(ModelNotFoundException)
    await expect(Thing.firstOrFail(h)).rejects.toMatchObject({ httpStatus: 404, model: 'things' })
    await Thing.create(h, { name: 'x' })
    expect((await Thing.firstOrFail(h)).name).toBe('x') // resolves when present
    await h.close()
  })

  it('a driver failure is wrapped as QueryException preserving the cause (not swallowed)', async () => {
    const h = await createDb({ driver: 'libsql', url: ':memory:' })
    // no table created → the insert hits a real driver error
    let err: unknown
    try {
      await Thing.create(h, { name: 'x' })
    } catch (e) {
      err = e
    }
    expect(err).toBeInstanceOf(QueryException)
    expect((err as QueryException).op).toBe('create')
    expect((err as QueryException).model).toBe('things')
    expect((err as QueryException).cause).toBeDefined() // original driver error preserved for logs
    await h.close()
  })
})
