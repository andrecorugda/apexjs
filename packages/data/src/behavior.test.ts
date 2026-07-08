import { describe, expect, it } from 'vitest'
import { type Behavior, composeBehaviors, observable, owned, timestamps } from './behavior.js'
import { createDb } from './index.js'
import { defineModel } from './model.js'

type Handler = (ctx: { input?: unknown; user?: unknown }) => Promise<unknown>
function ops(resource: { routes: Array<{ mcpName: string; route: { handler: Handler } }> }) {
  const h = (op: string) => resource.routes.find((r) => r.mcpName.endsWith(`_${op}`))?.route.handler
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
})
