import type { ApexResource } from '@apex-stack/core'
import { describe, expect, it } from 'vitest'
import {
  auditable,
  type Behavior,
  composeBehaviors,
  observable,
  owned,
  softDeletes,
  timestamps,
} from './behavior.js'
import { createDb } from './index.js'
import { defineModel } from './model.js'

type Handler = (ctx: { input?: unknown; user?: unknown }) => Promise<unknown>
function ops(resource: ApexResource) {
  const h = (op: string) =>
    resource.routes.find((r) => r.mcpName.endsWith(`_${op}`))?.route.handler as Handler
  return {
    list: h('list'),
    get: h('get'),
    create: h('create'),
    update: h('update'),
    del: h('delete'),
  }
}

describe('composeBehaviors', () => {
  it('merges behavior fields with the model, behaviors first', () => {
    const c = composeBehaviors([timestamps()], { fields: { title: 'string' } })
    expect(Object.keys(c.fields).sort()).toEqual(['created_at', 'title', 'updated_at'])
    expect(c.omitFromInsert).toEqual(['created_at', 'updated_at'])
  })

  it('throws on a field-name collision', () => {
    const dup: Behavior = { name: 'dup', fields: { title: 'string' } }
    expect(() => composeBehaviors([dup], { fields: { title: 'string' } })).toThrow(/collision/)
  })

  it('combines access most-restrictive-wins (authed beats a public op)', () => {
    const c = composeBehaviors([owned()], { fields: {}, access: { list: 'public' } })
    const access = c.access as Record<string, unknown>
    expect(access.list).toBe('authed') // owned authed > model public
    expect(access.delete).toBe('authed')
  })

  it('AND-combines scopes by merging their filter objects', () => {
    const extra: Behavior = { name: 'x', scope: () => ({ team: 't1' }) }
    const c = composeBehaviors([owned('ownerId'), extra], {
      fields: {},
      scope: () => ({ archived: false }),
    })
    expect(c.scope?.({ user: { id: 'u1' } })).toEqual({
      ownerId: 'u1',
      team: 't1',
      archived: false,
    })
  })

  it('collects hooks in behavior order', () => {
    const c = composeBehaviors([timestamps(), observable({ afterCreate() {} })], { fields: {} })
    expect(c.hooks).toHaveLength(2)
  })

  it('softDeletes contributes a field, a filter, and the soft-delete column', () => {
    const c = composeBehaviors([softDeletes()], { fields: { title: 'string' } })
    expect(Object.keys(c.fields).sort()).toEqual(['deleted_at', 'title'])
    expect(c.omitFromInsert).toEqual(['deleted_at'])
    expect(c.filters).toHaveLength(1)
    expect(c.softDelete).toBe('deleted_at')
  })

  it('throws if two behaviors both set softDelete', () => {
    expect(() => composeBehaviors([softDeletes(), softDeletes('gone_at')], { fields: {} })).toThrow(
      /only one behavior/i,
    )
  })
})

describe('built-in behaviors (over PGlite)', () => {
  it('timestamps: stamps created_at/updated_at on create; keeps created_at on update', async () => {
    const posts = defineModel('posts', { fields: { title: 'string' }, use: [timestamps()] })
    const h = await createDb({ driver: 'pglite' })
    await h.exec(posts.migrationSql('postgres'))
    const { create, update } = ops(posts.resource(h))

    // created_at/updated_at are server-managed — not in the create shape.
    expect(Object.keys(posts.insert)).toEqual(['title'])

    const row = (await create({ input: { title: 'a' }, user: null })) as {
      id: number
      created_at: string
      updated_at: string
    }
    expect(row.created_at).toBeTruthy()
    expect(row.updated_at).toBeTruthy()

    const upd = (await update({ input: { id: row.id, title: 'b' }, user: null })) as {
      created_at: string
    }
    expect(upd.created_at).toBe(row.created_at) // create time preserved
    await h.close()
  })

  it('owned: gates every op authed + isolates rows per caller', async () => {
    const notes = defineModel('onotes', {
      fields: { owner: 'string', body: 'string' },
      use: [owned('owner')],
    })
    const r = notes.resource({} as never)
    for (const route of r.routes) expect(route.route.auth).toBe(true)

    const h = await createDb({ driver: 'pglite' })
    await h.exec(notes.migrationSql('postgres'))
    const { list, get, create } = ops(notes.resource(h))
    const A = { id: 'a' }
    const B = { id: 'b' }
    const aRow = (await create({ input: { owner: 'b', body: 'x' }, user: A })) as { owner: string }
    expect(aRow.owner).toBe('a') // stamped from scope, spoof ignored
    const bRow = (await create({ input: { body: 'y' }, user: B })) as { id: number }
    expect(await get({ input: { id: bRow.id }, user: A })).toBeNull() // A can't see B's row
    expect((await list({ user: A })) as unknown[]).toHaveLength(1)
    await h.close()
  })

  it('observable: hooks fire around create + delete', async () => {
    const events: string[] = []
    const m = defineModel('ev', {
      fields: { x: 'string' },
      use: [
        observable({
          afterCreate: ({ row }) => {
            events.push(`create:${(row as { id: number }).id}`)
          },
          beforeDelete: ({ id }) => {
            events.push(`delete:${id}`)
          },
        }),
      ],
    })
    const h = await createDb({ driver: 'pglite' })
    await h.exec(m.migrationSql('postgres'))
    const { create, del } = ops(m.resource(h))
    const row = (await create({ input: { x: 'a' }, user: null })) as { id: number }
    await del({ input: { id: row.id }, user: null })
    expect(events).toEqual([`create:${row.id}`, `delete:${row.id}`])
    await h.close()
  })

  it('softDeletes: delete stamps deleted_at, hides the row, but keeps it in the table', async () => {
    const docs = defineModel('docs', { fields: { title: 'string' }, use: [softDeletes()] })
    expect(Object.keys(docs.insert)).toEqual(['title']) // deleted_at not client-settable
    const h = await createDb({ driver: 'pglite' })
    await h.exec(docs.migrationSql('postgres'))
    const { list, get, create, del } = ops(docs.resource(h))

    const a = (await create({ input: { title: 'a' }, user: null })) as { id: number }
    await create({ input: { title: 'b' }, user: null })
    expect((await list({ user: null })) as unknown[]).toHaveLength(2)

    const removed = (await del({ input: { id: a.id }, user: null })) as { deleted_at: string }
    expect(removed.deleted_at).toBeTruthy() // soft — stamped, not gone

    expect((await list({ user: null })) as unknown[]).toHaveLength(1) // hidden from reads
    expect(await get({ input: { id: a.id }, user: null })).toBeNull()
    const physical = await h.query('SELECT count(*)::int AS n FROM docs')
    expect(physical[0]?.n).toBe(2) // still physically present
    await h.close()
  })

  it('auditable: logs create/update/delete to an auto-provisioned companion table', async () => {
    const posts = defineModel('apost', { fields: { title: 'string' }, use: [auditable()] })
    const h = await createDb({ driver: 'pglite' })
    await h.exec(posts.migrationSql('postgres'))
    const { create, update, del } = ops(posts.resource(h))
    const actor = { id: 'ada' }

    const row = (await create({ input: { title: 'a' }, user: actor })) as { id: number }
    await update({ input: { id: row.id, title: 'b' }, user: actor })
    await del({ input: { id: row.id }, user: actor })

    const log = await h.query('SELECT action, actor_id, row_id FROM apost_audit ORDER BY id')
    expect(log.map((r) => r.action)).toEqual(['create', 'update', 'delete'])
    expect(log.every((r) => r.actor_id === 'ada')).toBe(true)
    expect(log.every((r) => Number(r.row_id) === row.id)).toBe(true)
    await h.close()
  })

  it('hook ctx is JSON-safe and a throwing after* hook does not fail the committed write', async () => {
    let snapshot = ''
    const warnings: string[] = []
    const origWarn = console.warn
    console.warn = (m?: unknown) => {
      warnings.push(String(m))
    }
    try {
      const m = defineModel('safe', {
        fields: { x: 'string' },
        use: [
          observable({
            afterCreate: (ctx) => {
              snapshot = JSON.stringify(ctx) // must NOT throw on Drizzle circular refs
              throw new Error('boom') // must NOT fail the already-committed write
            },
          }),
        ],
      })
      const h = await createDb({ driver: 'pglite' })
      await h.exec(m.migrationSql('postgres'))
      const { create } = ops(m.resource(h))
      const row = (await create({ input: { x: 'a' }, user: null })) as { id: number }
      expect(row.id).toBeTruthy() // create succeeded despite the throwing hook
      expect(snapshot).toContain('"op":"create"') // ctx serialized without circular error
      expect(snapshot).not.toContain('"db"') // internals are non-enumerable
      expect(snapshot).not.toContain('"handle"')
      expect(warnings.some((w) => w.includes('afterCreate'))).toBe(true) // failure surfaced
      const n = await h.query('SELECT count(*)::int AS n FROM safe')
      expect(n[0]?.n).toBe(1) // row is physically committed
      await h.close()
    } finally {
      console.warn = origWarn
    }
  })

  it('a throwing before* hook vetoes the op (no write)', async () => {
    const m = defineModel('veto', {
      fields: { x: 'string' },
      use: [
        observable({
          beforeCreate: () => {
            throw new Error('nope')
          },
        }),
      ],
    })
    const h = await createDb({ driver: 'pglite' })
    await h.exec(m.migrationSql('postgres'))
    const { create } = ops(m.resource(h))
    await expect(create({ input: { x: 'a' }, user: null })).rejects.toThrow(/nope/)
    const n = await h.query('SELECT count(*)::int AS n FROM veto')
    expect(n[0]?.n).toBe(0) // vetoed before the write
    await h.close()
  })

  it('read hooks: afterList and afterGet fire with rows/row', async () => {
    const seen: string[] = []
    const m = defineModel('reads', {
      fields: { x: 'string' },
      use: [
        observable({
          afterList: ({ rows }) => {
            seen.push(`list:${rows?.length}`)
          },
          afterGet: ({ row }) => {
            seen.push(`get:${(row as { id: number }).id}`)
          },
        }),
      ],
    })
    const h = await createDb({ driver: 'pglite' })
    await h.exec(m.migrationSql('postgres'))
    const { list, get, create } = ops(m.resource(h))
    const row = (await create({ input: { x: 'a' }, user: null })) as { id: number }
    await list({ user: null })
    await get({ input: { id: row.id }, user: null })
    expect(seen).toEqual(['list:1', `get:${row.id}`])
    await h.close()
  })
})
