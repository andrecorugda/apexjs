import { describe, expect, it } from 'vitest'
import { createDb } from './index.js'
import { defineModel } from './model.js'

type Handler = (ctx: { input?: unknown; user?: unknown }) => Promise<unknown>

// A scoped model: every op is filtered to the caller's own rows via `owner`.
const notes = defineModel('notes', {
  fields: { owner: 'string', body: 'string' },
  scope: ({ user }) => ({ owner: (user as { id: string }).id }),
})

async function seed() {
  const h = await createDb({ driver: 'pglite' })
  await h.exec(notes.migrationSql('postgres'))
  return h
}

function ops(resource: ReturnType<typeof notes.resource>) {
  const find = (op: string) =>
    resource.routes.find((r) => r.mcpName === `notes_${op}`)?.route.handler as Handler
  return {
    list: find('list'),
    get: find('get'),
    create: find('create'),
    update: find('update'),
    del: find('delete'),
    routes: resource.routes,
  }
}

describe('resource access mapping (gate)', () => {
  it('gates every op with auth once scope is set', () => {
    const r = notes.resource({} as never)
    for (const route of r.routes) expect(route.route.auth).toBe(true)
  })

  it('is public when neither access nor scope is declared', () => {
    const open = defineModel('open', { fields: { x: 'string' } }).resource({} as never)
    for (const route of open.routes) expect(route.route.auth).toBeUndefined()
  })

  it('fail-closed: an unlisted op defaults to authed even when another is public', () => {
    const m = defineModel('mixed', {
      fields: { x: 'string' },
      access: { list: 'public' },
    }).resource({} as never)
    const byName = (n: string) => m.routes.find((r) => r.mcpName === n)?.route
    expect(byName('mixed_list')?.auth).toBeUndefined() // explicitly public
    expect(byName('mixed_delete')?.auth).toBe(true) // unlisted → authed
    expect(byName('mixed_create')?.auth).toBe(true)
  })
})

describe('row-level scope (over PGlite)', () => {
  it('isolates rows per caller across all five ops', async () => {
    const h = await seed()
    const { list, get, create, update, del } = ops(notes.resource(h))
    const A = { id: 'ada' }
    const B = { id: 'bob' }

    // create stamps the owner from scope — even if the input tries to spoof it.
    const aRow = (await create({ input: { owner: 'bob', body: 'a1' }, user: A })) as {
      id: number
      owner: string
    }
    expect(aRow.owner).toBe('ada')
    const bRow = (await create({ input: { body: 'b1' }, user: B })) as { id: number }
    await create({ input: { body: 'a2' }, user: A })

    // list is scoped: A sees only A's two rows.
    const aList = (await list({ user: A })) as unknown[]
    expect(aList).toHaveLength(2)
    expect((aList as Array<{ owner: string }>).every((r) => r.owner === 'ada')).toBe(true)

    // A cannot get / update / delete B's row (id-guessing crosses no scope).
    expect(await get({ input: { id: bRow.id }, user: A })).toBeNull()
    expect(await update({ input: { id: bRow.id, body: 'hacked' }, user: A })).toBeNull()
    expect(await del({ input: { id: bRow.id }, user: A })).toBeNull()

    // B's row is untouched.
    expect(await get({ input: { id: bRow.id }, user: B })).toMatchObject({ body: 'b1' })

    // A can operate on its own row.
    expect(await get({ input: { id: aRow.id }, user: A })).toMatchObject({ body: 'a1' })
    const upd = (await update({ input: { id: aRow.id, body: 'a1!' }, user: A })) as { body: string }
    expect(upd.body).toBe('a1!')

    await h.close()
  })

  it('update cannot reassign a scoped column (owner)', async () => {
    const h = await seed()
    const { create, update, get } = ops(notes.resource(h))
    const A = { id: 'ada' }
    const row = (await create({ input: { body: 'x' }, user: A })) as { id: number }
    // Attempt to steal the row by setting owner to bob — stripped, stays ada.
    await update({ input: { id: row.id, owner: 'bob', body: 'y' }, user: A })
    expect(await get({ input: { id: row.id }, user: A })).toMatchObject({ owner: 'ada', body: 'y' })
    await h.close()
  })
})
