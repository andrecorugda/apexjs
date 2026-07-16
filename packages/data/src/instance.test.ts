import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { collect } from './collection.js'
import { createDb } from './index.js'
import { defineModel } from './model.js'

const User = defineModel('users', {
  fields: {
    name: { type: 'string', notNull: true },
    role: { type: 'string', default: 'member' },
    password: { type: 'string', notNull: true },
  },
  hidden: ['password'],
})

describe('model instances', () => {
  beforeEach(() => {
    globalThis.__APEX_DEVICE__ = true
  })
  afterEach(() => {
    globalThis.__APEX_DEVICE__ = undefined
  })

  it('save() persists dirty changes; isDirty/changes track them', async () => {
    const h = await createDb({ driver: 'libsql', url: ':memory:' })
    await h.exec(User.migrationSql(h.dialect))
    const u = await User.create(h, { name: 'Ada', password: 'x' })
    expect(u.isDirty()).toBe(false)
    u.name = 'Ada L'
    expect(u.isDirty()).toBe(true)
    expect(u.isDirty('role')).toBe(false)
    expect(u.changes()).toEqual({ name: 'Ada L' })
    await u.save()
    expect(u.isDirty()).toBe(false)
    // persisted
    const reloaded = await User.find(h, u.id)
    expect(reloaded?.name).toBe('Ada L')
    await h.close()
  })

  it('delete() removes the row; refresh() reloads attributes', async () => {
    const h = await createDb({ driver: 'libsql', url: ':memory:' })
    await h.exec(User.migrationSql(h.dialect))
    const u = await User.create(h, { name: 'Bob', password: 'y' })
    // mutate in DB behind the instance's back, then refresh
    await User.update(h, u.id, { role: 'admin' })
    await u.refresh()
    expect(u.role).toBe('admin')
    await u.delete()
    expect(await User.count(h)).toBe(0)
    await h.close()
  })

  it('toJSON() and JSON.stringify omit hidden columns', async () => {
    const h = await createDb({ driver: 'libsql', url: ':memory:' })
    await h.exec(User.migrationSql(h.dialect))
    const u = await User.create(h, { name: 'Grace', password: 'secret' })
    expect(u.password).toBe('secret') // present on the instance…
    expect(u.toJSON()).not.toHaveProperty('password') // …but hidden from serialization
    expect(JSON.parse(JSON.stringify(u))).not.toHaveProperty('password')
    expect(u.toJSON().name).toBe('Grace')
    await h.close()
  })

  it('the resource strips hidden columns from REST/MCP responses', async () => {
    const h = await createDb({ driver: 'libsql', url: ':memory:' })
    await h.exec(User.migrationSql(h.dialect))
    await User.create(h, { name: 'x', password: 'p' })
    const list = User.resource(h).routes.find((r) => r.mcpName === 'users_list')?.route.handler as (
      a: { input?: unknown; user?: unknown },
    ) => Promise<Array<Record<string, unknown>>>
    const rows = await list({})
    expect(rows[0]).not.toHaveProperty('password')
    expect(rows[0]?.name).toBe('x')
    await h.close()
  })

  it('Collection helpers: pluck / groupBy / sum / toJSON', async () => {
    const h = await createDb({ driver: 'libsql', url: ':memory:' })
    await h.exec(User.migrationSql(h.dialect))
    await User.insertMany(h, [
      { name: 'a', role: 'admin', password: '1' },
      { name: 'b', role: 'member', password: '2' },
      { name: 'c', role: 'admin', password: '3' },
    ])
    const users = await User.all(h)
    expect(users.pluck('name').sort()).toEqual(['a', 'b', 'c'])
    expect(Object.keys(users.groupBy('role')).sort()).toEqual(['admin', 'member'])
    expect(users.groupBy('role').admin).toHaveLength(2)
    // Collection.map returns a plain array (Symbol.species = Array)
    expect(Array.isArray(users.map((u) => u.name))).toBe(true)
    // toJSON serializes each instance (password hidden)
    expect((users.toJSON() as Array<Record<string, unknown>>).every((u) => !('password' in u))).toBe(
      true,
    )
    // collect() helper
    expect(collect([1, 2, 3]).sum('length' as never)).toBeDefined()
    await h.close()
  })
})
