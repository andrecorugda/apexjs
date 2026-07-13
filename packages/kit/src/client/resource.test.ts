import { afterEach, describe, expect, it, vi } from 'vitest'
import { createResourceClient } from './resource.js'

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
  vi.restoreAllMocks()
})

interface Post {
  id: number
  title: string
}

describe('createResourceClient', () => {
  it('defaults the base URL to /api/<name>', async () => {
    const spy = vi.fn(async () => new Response('[]', { status: 200 }))
    globalThis.fetch = spy
    await createResourceClient<Post>('posts').fetch()
    expect(spy).toHaveBeenCalledWith('/api/posts', expect.anything())
  })

  it('fetch() loads items and flips loading', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify([{ id: 1, title: 'a' }]), { status: 200 }),
    )
    const c = createResourceClient<Post>('posts')
    const p = c.fetch()
    expect(c.loading).toBe(true) // flips synchronously
    await p
    expect(c.loading).toBe(false)
    expect(c.items).toEqual([{ id: 1, title: 'a' }])
    expect(c.error).toBeNull()
  })

  it('create() POSTs and appends the returned row to items', async () => {
    const spy = vi.fn(
      async () => new Response(JSON.stringify({ id: 9, title: 'new' }), { status: 201 }),
    )
    globalThis.fetch = spy
    const c = createResourceClient<Post>('posts')
    const row = await c.create({ title: 'new' })
    expect(row).toEqual({ id: 9, title: 'new' })
    expect(c.items).toContainEqual({ id: 9, title: 'new' })
    expect(spy).toHaveBeenCalledWith(
      '/api/posts',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ title: 'new' }) }),
    )
  })

  it('update() PATCHes /:id and replaces the row in items (string/number id match)', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ id: 1, title: 'edited' }), { status: 200 }),
    )
    const c = createResourceClient<Post>('posts')
    c.items = [{ id: 1, title: 'old' }]
    await c.update('1', { title: 'edited' }) // string id must still match numeric row id
    expect(c.items).toEqual([{ id: 1, title: 'edited' }])
  })

  it('remove() DELETEs /:id and drops the row from items', async () => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 204 }))
    const c = createResourceClient<Post>('posts')
    c.items = [
      { id: 1, title: 'a' },
      { id: 2, title: 'b' },
    ]
    const ok = await c.remove(1)
    expect(ok).toBe(true)
    expect(c.items).toEqual([{ id: 2, title: 'b' }])
  })

  it('captures a failed response into error without throwing', async () => {
    globalThis.fetch = vi.fn(async () => new Response('nope', { status: 500 }))
    const c = createResourceClient<Post>('posts')
    await c.fetch()
    expect(c.error).toBe('Request failed (500)')
    expect(c.items).toEqual([])
  })

  it('honors a custom base and idKey', async () => {
    const spy = vi.fn(async () => new Response('{}', { status: 200 }))
    globalThis.fetch = spy
    const c = createResourceClient('posts', { base: '/v2/posts', idKey: 'uuid' })
    await c.find('abc')
    expect(spy).toHaveBeenCalledWith('/v2/posts/abc', expect.anything())
  })
})
