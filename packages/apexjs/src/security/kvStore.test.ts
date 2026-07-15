import { describe, expect, it } from 'vitest'
import { createMemoryStore } from './kvStore.js'
import { createRateLimiter } from './rateLimit.js'

describe('createMemoryStore', () => {
  it('set/get round-trips, and get past the TTL returns null (entry evicted)', async () => {
    let t = 1000
    const store = createMemoryStore({ now: () => t })
    await store.set('k', 'v', 100)
    expect(await store.get('k')).toBe('v')
    t = 1099
    expect(await store.get('k')).toBe('v')
    t = 1100 // expired
    expect(await store.get('k')).toBeNull()
  })

  it('incr creates at 1, increments, and keeps the TTL from creation (not extended)', async () => {
    let t = 1000
    const store = createMemoryStore({ now: () => t })
    expect(await store.incr('c', 100)).toBe(1)
    expect(await store.incr('c', 100)).toBe(2)
    t = 1090
    expect(await store.incr('c', 100)).toBe(3) // still inside the ORIGINAL ttl
    t = 1100 // original ttl elapsed — later incrs must not have extended it
    expect(await store.incr('c', 100)).toBe(1) // fresh window
  })

  it('incr continues from a numeric set value (documented adapter contract)', async () => {
    const store = createMemoryStore({ now: () => 0 })
    await store.set('n', '5', 100)
    expect(await store.incr('n', 100)).toBe(6)
  })

  it('delete removes a key', async () => {
    const store = createMemoryStore({ now: () => 0 })
    await store.set('k', 'v', 100)
    await store.delete?.('k')
    expect(await store.get('k')).toBeNull()
  })

  it('set overwrites both value and TTL', async () => {
    let t = 1000
    const store = createMemoryStore({ now: () => t })
    await store.set('k', 'a', 50)
    await store.set('k', 'b', 500)
    t = 1100 // past the first ttl, inside the second
    expect(await store.get('k')).toBe('b')
  })
})

describe('createRateLimiter({ store }) — store-backed fixed window', () => {
  it('allows up to the limit then blocks, and resets at the epoch-aligned bucket boundary', async () => {
    let t = 1000
    const store = createMemoryStore({ now: () => t })
    const rl = createRateLimiter({ limit: 2, windowMs: 100, now: () => t, store })
    expect(await rl.allow('a')).toBe(true)
    expect(await rl.allow('a')).toBe(true)
    expect(await rl.allow('a')).toBe(false)
    expect(await rl.allow('b')).toBe(true) // other key independent
    t = 1100 // next epoch bucket
    expect(await rl.allow('a')).toBe(true)
  })

  it('two limiter instances sharing one store enforce ONE global count', async () => {
    const t = 1000
    const store = createMemoryStore({ now: () => t })
    const a = createRateLimiter({ limit: 2, windowMs: 100, now: () => t, store })
    const b = createRateLimiter({ limit: 2, windowMs: 100, now: () => t, store })
    expect(await a.allow('k')).toBe(true)
    expect(await b.allow('k')).toBe(true)
    expect(await a.allow('k')).toBe(false) // instance A sees B's hit — global enforcement
    expect(await b.allow('k')).toBe(false)
  })

  it('retryAfter is the time to the bucket end when at the limit, 0 when under', async () => {
    let t = 1030 // 30ms into the 1000-1100 bucket
    const store = createMemoryStore({ now: () => t })
    const rl = createRateLimiter({ limit: 1, windowMs: 100, now: () => t, store })
    expect(await rl.retryAfter('k')).toBe(0) // unseen
    await rl.allow('k')
    expect(await rl.retryAfter('k')).toBe(70) // 1100 - 1030
    t = 1100
    expect(await rl.retryAfter('k')).toBe(0) // new bucket, under limit
  })
})
