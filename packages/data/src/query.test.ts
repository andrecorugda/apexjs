import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { observable, owned, softDeletes, timestamps } from './behavior.js'
import { type ApexDbHandle, createDb } from './index.js'
import { defineModel } from './model.js'
import { raw } from './query.js'

// Active-record layer (P1) — exercised on BOTH dialects to prove portability:
// sqlite via the on-device sql.js backend, postgres via pglite.

declare global {
  var __APEX_DEVICE__: boolean | undefined
}

const Player = defineModel('players', {
  fields: {
    handle: { type: 'string', notNull: true, unique: true },
    team: 'string',
    plays: { type: 'int', default: 0 },
    active: { type: 'boolean', default: true },
    meta: 'json',
  },
})

async function seed(h: ApexDbHandle): Promise<void> {
  await h.exec(Player.migrationSql(h.dialect))
}

/** The full behavioural contract, run against whichever handle is passed. */
function contract(make: () => Promise<ApexDbHandle>): void {
  it('create → find → first → all, with boolean/json hydration', async () => {
    const h = await make()
    await seed(h)

    const ada = await Player.create(h, { handle: 'ada', team: 'A', meta: { level: 3 } })
    expect(ada.handle).toBe('ada')
    expect(ada.plays).toBe(0) // column default applied + returned
    expect(ada.active).toBe(true) // sqlite 1 → true (hydrated), pg true
    expect(ada.meta).toEqual({ level: 3 }) // json parsed back to an object

    await Player.create(h, { handle: 'grace', team: 'B' })

    const byPk = await Player.find(h, ada.id as number)
    expect(byPk?.handle).toBe('ada')
    const firstRow = await Player.first(h)
    expect(firstRow?.handle).toBe('ada') // ordered by pk
    expect(await Player.all(h)).toHaveLength(2)
    expect(await Player.count(h)).toBe(2)
    await h.close()
  })

  it('where().orderBy().all() filters + orders; count(conds) narrows', async () => {
    const h = await make()
    await seed(h)
    await Player.create(h, { handle: 'a', team: 'A', plays: 5 })
    await Player.create(h, { handle: 'b', team: 'A', plays: 9 })
    await Player.create(h, { handle: 'c', team: 'B', plays: 7 })

    const teamA = await Player.where({ team: 'A' }).orderBy('plays', 'desc').all(h)
    expect(teamA.map((r) => r.handle)).toEqual(['b', 'a']) // 9 before 5, team B excluded
    expect(await Player.count(h, { team: 'A' })).toBe(2)

    const top = await Player.where({ team: 'A' }).orderBy('plays', 'desc').first(h)
    expect(top?.handle).toBe('b')
    await h.close()
  })

  it('updateOrCreate creates then updates the same row', async () => {
    const h = await make()
    await seed(h)

    const created = await Player.updateOrCreate(h, { handle: 'ada' }, { team: 'A', plays: 1 })
    expect(created.team).toBe('A')
    expect(await Player.count(h)).toBe(1)

    const updated = await Player.updateOrCreate(h, { handle: 'ada' }, { team: 'Z', plays: 2 })
    expect(updated.id).toBe(created.id) // same row, not a duplicate
    expect(updated.team).toBe('Z')
    expect(await Player.count(h)).toBe(1)
    await h.close()
  })

  it('upsert with keep:max keeps the high score; raw() increments in place', async () => {
    const h = await make()
    await seed(h)

    // First submission wins the slot.
    await Player.upsert(h, ['handle'], { handle: 'ada', plays: 50 }, { keep: { plays: 'max' } })
    // A LOWER score must NOT overwrite (keep max).
    await Player.upsert(h, ['handle'], { handle: 'ada', plays: 20 }, { keep: { plays: 'max' } })
    let row = await Player.find(h, ((await Player.first(h)) as { id: number }).id)
    expect(row?.plays).toBe(50)
    // A HIGHER score does overwrite.
    await Player.upsert(h, ['handle'], { handle: 'ada', plays: 99 }, { keep: { plays: 'max' } })
    row = await Player.first(h)
    expect(row?.plays).toBe(99)

    // raw() expression: bump plays by 1 without reading it first.
    const bumped = await Player.update(h, row?.id as number, { plays: raw('plays + 1') })
    expect(bumped?.plays).toBe(100)
    await h.close()
  })

  it('delete removes matching rows and reports the count', async () => {
    const h = await make()
    await seed(h)
    await Player.create(h, { handle: 'a', team: 'A' })
    await Player.create(h, { handle: 'b', team: 'A' })
    await Player.create(h, { handle: 'c', team: 'B' })
    expect(await Player.delete(h, { team: 'A' })).toBe(2)
    expect(await Player.count(h)).toBe(1)
    await h.close()
  })

  it('an unknown column throws instead of becoming SQL (injection guard)', async () => {
    const h = await make()
    await seed(h)
    await expect(Player.where({ "plays; DROP TABLE players; --": 1 }).all(h)).rejects.toThrow(
      /unknown column/,
    )
    // table intact
    await seed(h).catch(() => {}) // idempotent (IF NOT EXISTS)
    expect(await Player.count(h)).toBe(0)
    await h.close()
  })
}

describe('active-record layer (P1) — sqlite (device sql.js)', () => {
  beforeEach(() => {
    globalThis.__APEX_DEVICE__ = true
  })
  afterEach(() => {
    globalThis.__APEX_DEVICE__ = undefined
  })
  contract(() => createDb({ driver: 'libsql', url: ':memory:' }))
})

describe('active-record layer (P1) — postgres (pglite)', () => {
  contract(() => createDb({ driver: 'pglite' }))
})

// The point of the rebuild: Model.* writes share the SAME pipeline as REST/MCP, so
// hooks (timestamps/observers), soft-delete, and row-level scope fire through them.
describe('active-record writes go through the behavior pipeline (A1–A4)', () => {
  beforeEach(() => {
    globalThis.__APEX_DEVICE__ = true
  })
  afterEach(() => {
    globalThis.__APEX_DEVICE__ = undefined
  })

  it('timestamps() stamps created_at/updated_at on create + bumps updated_at on update', async () => {
    const Post = defineModel('posts', {
      fields: { title: { type: 'string', notNull: true } },
      use: [timestamps()],
    })
    const h = await createDb({ driver: 'libsql', url: ':memory:' })
    await h.exec(Post.migrationSql(h.dialect))

    const p = await Post.create(h, { title: 'Hi' })
    expect(typeof p.created_at).toBe('string') // hook fired through AR (was silently skipped before)
    expect(p.updated_at).toBe(p.created_at)

    const updated = await Post.update(h, p.id as number, { title: 'Hi 2' })
    expect(updated?.updated_at).not.toBe(p.updated_at) // updated_at auto-bumped
    await h.close()
  })

  it('softDeletes() turns Model.delete into a stamp + hides trashed rows from reads', async () => {
    const Doc = defineModel('docs', {
      fields: { name: { type: 'string', notNull: true } },
      use: [softDeletes()],
    })
    const h = await createDb({ driver: 'libsql', url: ':memory:' })
    await h.exec(Doc.migrationSql(h.dialect))

    const d = await Doc.create(h, { name: 'a' })
    const removed = await Doc.delete(h, { id: d.id })
    expect(removed).toBe(1)
    // Not hard-deleted: the row survives with deleted_at set…
    const raw = await h.query('SELECT id, deleted_at FROM docs')
    expect(raw).toHaveLength(1)
    expect(raw[0]?.deleted_at).not.toBeNull()
    // …but AR reads hide it (the deleted_at IS NULL filter applies).
    expect(await Doc.count(h)).toBe(0)
    expect(await Doc.all(h)).toHaveLength(0)
    await h.close()
  })

  it('observable() afterCreate fires, and owned() scope isolates + stamps the owner', async () => {
    const events: string[] = []
    const Note = defineModel('notes', {
      fields: { text: { type: 'string', notNull: true }, ownerId: 'int' },
      use: [
        owned('ownerId'),
        observable({
          afterCreate: ({ row }) => {
            events.push(`created:${row?.ownerId}`)
          },
        }),
      ],
    })
    const h = await createDb({ driver: 'libsql', url: ':memory:' })
    await h.exec(Note.migrationSql(h.dialect))

    const ada = { id: 7 } as never
    const grace = { id: 8 } as never
    const n = await Note.create(h, { text: 'secret' }, { user: ada })
    expect(n.ownerId).toBe(7) // scope stamped the owner (unspoofable)
    expect(events).toContain('created:7') // observer fired through AR

    await Note.create(h, { text: 'other' }, { user: grace })
    // Row-level scope isolates reads per user.
    expect((await Note.all(h, { user: ada })).map((r) => r.text)).toEqual(['secret'])
    expect(await Note.count(h, undefined, { user: grace })).toBe(1)
    await h.close()
  })
})
