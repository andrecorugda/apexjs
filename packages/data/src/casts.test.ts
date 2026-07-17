import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDb } from './index.js'
import { defineModel } from './model.js'

const Event = defineModel('events', {
  fields: { title: { type: 'string', notNull: true }, at: 'timestamp', prefs: 'text' },
  casts: { at: 'date', prefs: 'json' },
})

describe('casts', () => {
  beforeEach(() => {
    globalThis.__APEX_DEVICE__ = true
  })
  afterEach(() => {
    globalThis.__APEX_DEVICE__ = undefined
  })
  it('date cast: Date in/out; json cast: object in/out', async () => {
    const h = await createDb({ driver: 'libsql', url: ':memory:' })
    await h.exec(Event.migrationSql(h.dialect))
    const when = new Date('2026-01-02T03:04:05.000Z')
    const e = await Event.create(h, { title: 'x', at: when, prefs: { theme: 'dark' } })
    expect(e.at).toBeInstanceOf(Date) // read cast → Date
    expect((e.at as Date).toISOString()).toBe(when.toISOString())
    expect(e.prefs).toEqual({ theme: 'dark' }) // json cast → object
    // stored as strings under the hood
    const raw = await h.query('SELECT at, prefs FROM events')
    expect(typeof raw[0]?.at).toBe('string')
    expect(typeof raw[0]?.prefs).toBe('string')
    // reload → still cast
    const reloaded = await Event.first(h)
    expect(reloaded?.at).toBeInstanceOf(Date)
    expect(reloaded?.prefs).toEqual({ theme: 'dark' })
    await h.close()
  })
})
