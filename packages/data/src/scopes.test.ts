import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDb } from './index.js'
import { defineModel } from './model.js'

const Post = defineModel('posts', {
  fields: { title: { type: 'string', notNull: true }, status: 'string', score: { type: 'int', default: 0 } },
  scopes: {
    published: (q) => q.where({ status: 'published' }),
    top: (q, n: number) => q.orderBy('score', 'desc').limit(n),
  },
})

describe('named query scopes', () => {
  beforeEach(() => { globalThis.__APEX_DEVICE__ = true })
  afterEach(() => { globalThis.__APEX_DEVICE__ = undefined })
  it('applies a named scope and an arg-taking scope', async () => {
    const h = await createDb({ driver: 'libsql', url: ':memory:' })
    await h.exec(Post.migrationSql(h.dialect))
    await Post.insertMany(h, [
      { title: 'a', status: 'published', score: 5 },
      { title: 'b', status: 'draft', score: 9 },
      { title: 'c', status: 'published', score: 7 },
    ])
    expect((await Post.scope('published').all(h)).map((r) => r.title).sort()).toEqual(['a', 'c'])
    expect((await Post.scope('top', 2).all(h)).map((r) => r.score)).toEqual([9, 7])
    expect(() => Post.scope('nope')).toThrow(/unknown scope/)
    await h.close()
  })
})
