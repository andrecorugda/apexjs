import { describe, expect, it } from 'vitest'
import { PostService } from '../services/PostService'

// Services are plain classes → unit-test them in isolation, no server needed.
describe('PostService', () => {
  const posts = new PostService()

  it('lists posts newest first', () => {
    const dates = posts.all().map((p) => p.date)
    expect(dates.length).toBeGreaterThan(0)
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)))
  })

  it('limits recent()', () => {
    expect(posts.recent(2)).toHaveLength(2)
  })

  it('finds a post by slug', () => {
    expect(posts.bySlug('hello-apex')?.title).toBe('Hello, Apex')
    expect(posts.bySlug('nope')).toBeUndefined()
  })
})
