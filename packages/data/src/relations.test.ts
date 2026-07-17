import { describe, expect, it } from 'vitest'
import { belongsTo, createDb, hasMany } from './index.js'
import { defineModel } from './model.js'

const User = defineModel('users', { fields: { name: { type: 'string', notNull: true } } })
const Comment = defineModel('comments', {
  fields: { body: { type: 'string', notNull: true }, postId: 'int' },
})
const Post = defineModel('posts', {
  fields: { title: { type: 'string', notNull: true }, authorId: 'int' },
  relations: {
    author: belongsTo(() => User, 'authorId'),
    comments: hasMany(() => Comment, 'postId'),
  },
})

describe('relationships + eager loading', () => {
  it('with() eager-loads belongsTo + hasMany, keyed correctly', async () => {
    const h = await createDb({ driver: 'pglite' })
    for (const m of [User, Comment, Post]) await h.exec(m.migrationSql(h.dialect))

    const ada = await User.create(h, { name: 'Ada' })
    const bob = await User.create(h, { name: 'Bob' })
    const p1 = await Post.create(h, { title: 'P1', authorId: ada.id })
    const p2 = await Post.create(h, { title: 'P2', authorId: bob.id })
    await Comment.insertMany(h, [
      { body: 'c1', postId: p1.id as number },
      { body: 'c2', postId: p1.id as number },
      { body: 'c3', postId: p2.id as number },
    ])

    const posts = await Post.with('author', 'comments').orderBy('id', 'asc').all(h)
    expect(posts).toHaveLength(2)
    // belongsTo → the right author instance
    expect((posts[0] as unknown as { author: { name: string } }).author.name).toBe('Ada')
    expect((posts[1] as unknown as { author: { name: string } }).author.name).toBe('Bob')
    // hasMany → grouped by postId (not cross-contaminated)
    expect(
      (posts[0] as unknown as { comments: unknown[] }).comments
        .map((c) => (c as { body: string }).body)
        .sort(),
    ).toEqual(['c1', 'c2'])
    expect(posts[1]?.comments as unknown[]).toHaveLength(1)

    // nested serialization: JSON.stringify includes the loaded relations
    const json = JSON.parse(JSON.stringify(posts[0]))
    expect(json.author.name).toBe('Ada')
    expect(json.comments).toHaveLength(2)
    await h.close()
  })

  it('an unknown relation throws', async () => {
    const h = await createDb({ driver: 'pglite' })
    await h.exec(Post.migrationSql(h.dialect))
    await Post.create(h, { title: 'x', authorId: 1 })
    await expect(Post.with('nope').all(h)).rejects.toThrow(/unknown relation/)
    await h.close()
  })
})
