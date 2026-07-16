import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createCache } from './cache.js'

describe('createCache — memory driver', () => {
  it('set/get round-trips and preserves value types', async () => {
    const cache = createCache()
    await cache.set('str', 'hello')
    await cache.set('obj', { a: 1, b: [2, 3] })
    expect(await cache.get<string>('str')).toBe('hello')
    expect(await cache.get<{ a: number; b: number[] }>('obj')).toEqual({ a: 1, b: [2, 3] })
    expect(await cache.get('missing')).toBeUndefined()
  })

  it('has / delete / flush behave', async () => {
    const cache = createCache()
    await cache.set('k', 1)
    expect(await cache.has('k')).toBe(true)
    await cache.delete('k')
    expect(await cache.has('k')).toBe(false)

    await cache.set('a', 1)
    await cache.set('b', 2)
    await cache.flush()
    expect(await cache.has('a')).toBe(false)
    expect(await cache.has('b')).toBe(false)
  })

  it('honors TTL: expired entries return undefined and are evicted (injected clock)', async () => {
    let t = 1000
    const cache = createCache({ driver: 'memory', now: () => t })
    await cache.set('k', 'v', 1) // 1 second ⇒ expires at 2000
    t = 1999
    expect(await cache.get('k')).toBe('v') // still live
    t = 2000
    expect(await cache.get('k')).toBeUndefined() // expired
    expect(await cache.has('k')).toBe(false)
  })

  it('honors TTL with a real short delay (no injected clock)', async () => {
    const cache = createCache()
    await cache.set('k', 'v', 0.02) // 20ms
    expect(await cache.get('k')).toBe('v')
    await new Promise((r) => setTimeout(r, 40))
    expect(await cache.get('k')).toBeUndefined()
  })

  it('omitted ttlSeconds ⇒ no expiry', async () => {
    let t = 0
    const cache = createCache({ driver: 'memory', now: () => t })
    await cache.set('forever', 'v')
    t = 10_000_000
    expect(await cache.get('forever')).toBe('v')
  })
})

describe('remember', () => {
  it('runs the factory once on a miss, then serves from cache', async () => {
    const cache = createCache()
    let calls = 0
    const factory = async () => {
      calls++
      return { n: 42 }
    }
    const first = await cache.remember('key', 60, factory)
    const second = await cache.remember('key', 60, factory)
    expect(first).toEqual({ n: 42 })
    expect(second).toEqual({ n: 42 })
    expect(calls).toBe(1) // factory ran exactly once
  })

  it('recomputes after the cached value expires', async () => {
    let t = 1000
    const cache = createCache({ driver: 'memory', now: () => t })
    let calls = 0
    const factory = () => {
      calls++
      return calls
    }
    expect(await cache.remember('k', 1, factory)).toBe(1)
    t = 2000 // expired
    expect(await cache.remember('k', 1, factory)).toBe(2)
    expect(calls).toBe(2)
  })
})

describe('tag invalidation', () => {
  it('flushing one tag invalidates only its keys, leaving other tags intact', async () => {
    const cache = createCache()
    await cache.tags(['users']).set('user:1', { id: 1 })
    await cache.tags(['users']).set('user:2', { id: 2 })
    await cache.tags(['posts']).set('post:1', { id: 1 })

    await cache.tags(['users']).flush()

    expect(await cache.get('user:1')).toBeUndefined()
    expect(await cache.get('user:2')).toBeUndefined()
    expect(await cache.get('post:1')).toEqual({ id: 1 }) // untouched
  })

  it('remember through a tag view registers the key under the tag', async () => {
    const cache = createCache()
    const v = await cache.tags(['reports']).remember('report:q3', 60, async () => 'computed')
    expect(v).toBe('computed')
    expect(await cache.get('report:q3')).toBe('computed')
    await cache.tags(['reports']).flush()
    expect(await cache.get('report:q3')).toBeUndefined()
  })

  it('a key tagged under multiple tags is dropped when any of them is flushed', async () => {
    const cache = createCache()
    await cache.tags(['a', 'b']).set('shared', 1)
    await cache.tags(['a']).flush()
    expect(await cache.get('shared')).toBeUndefined()
  })
})

describe('createCache — file driver', () => {
  let dir: string
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'apex-cache-'))
  })
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('round-trips values through JSON files on disk', async () => {
    const cache = createCache({ driver: 'file', dir })
    await cache.set('k', { hello: 'world', nums: [1, 2, 3] })
    expect(await cache.has('k')).toBe(true)
    expect(await cache.get<{ hello: string; nums: number[] }>('k')).toEqual({
      hello: 'world',
      nums: [1, 2, 3],
    })

    // A fresh cache instance over the same dir reads persisted data.
    const reopened = createCache({ driver: 'file', dir })
    expect(await reopened.get('k')).toEqual({ hello: 'world', nums: [1, 2, 3] })
  })

  it('honors TTL and evicts the file on read (injected clock)', async () => {
    let t = 1000
    const cache = createCache({ driver: 'file', dir, now: () => t })
    await cache.set('k', 'v', 1)
    t = 1999
    expect(await cache.get('k')).toBe('v')
    t = 2000
    expect(await cache.get('k')).toBeUndefined()
    expect(await cache.get('k')).toBeUndefined() // idempotent after eviction
  })

  it('delete and flush work on disk', async () => {
    const cache = createCache({ driver: 'file', dir })
    await cache.set('a', 1)
    await cache.set('b', 2)
    await cache.delete('a')
    expect(await cache.get('a')).toBeUndefined()
    expect(await cache.get('b')).toBe(2)
    await cache.flush()
    expect(await cache.get('b')).toBeUndefined()
  })
})
