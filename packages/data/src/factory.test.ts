import { describe, expect, it } from 'vitest'
import { factory } from './factory.js'
import { createDb } from './index.js'
import { defineModel } from './model.js'

const User = defineModel('users', {
  fields: { name: 'string', email: 'string', age: 'int', active: 'boolean' },
})

describe('factory', () => {
  it('infers schema-valid values by field type + name heuristics', () => {
    const u = factory(User).make()
    expect(typeof u.name).toBe('string')
    expect(String(u.email)).toContain('@')
    expect(typeof u.age).toBe('number')
    expect(typeof u.active).toBe('boolean')
  })

  it('lets overrides win and pass extra keys through', () => {
    const u = factory(User).make({ name: 'Ada', teamId: 7 })
    expect(u.name).toBe('Ada')
    expect(u.teamId).toBe(7)
  })

  it('leaves timestamp fields unset by default (so rows are not "soft-deleted")', () => {
    const M = defineModel('m', { fields: { title: 'string', deleted_at: 'timestamp' } })
    const r = factory(M).make()
    expect('deleted_at' in r).toBe(false)
    expect(r.title).toBeTruthy()
  })

  it('supports a custom generator (e.g. faker) via the fake hook', () => {
    const u = factory(User, { fake: (field) => `fake-${field}` }).make()
    expect(u.name).toBe('fake-name')
    expect(u.email).toBe('fake-email')
  })

  it('creates rows in the database (over PGlite)', async () => {
    const h = await createDb({ driver: 'pglite' })
    await h.exec(User.migrationSql('postgres'))
    const users = factory(User)
    const one = await users.create(h, { name: 'Solo' })
    expect(one.id).toBeTruthy()
    expect(one.name).toBe('Solo')
    await users.createMany(h, 3)
    const all = await h.query('SELECT count(*)::int AS n FROM users')
    expect(all[0]?.n).toBe(4)
    await h.close()
  })
})
