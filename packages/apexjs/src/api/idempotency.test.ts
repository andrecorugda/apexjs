import type { H3Event } from 'h3'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createMemoryStore } from '../security/kvStore.js'
import { createTestApp, type TestApp } from '../testing/index.js'
import { defineApexRoute } from './defineRoute.js'
import { beginIdempotency, type IdempotencyOptions } from './idempotency.js'
import { type ApiEntry, expandApiModule } from './routes.js'

// ── Unit: the begin/commit/release protocol ─────────────────────────────────

/** A minimal fake h3 event carrying just the request headers `getRequestHeader` reads. */
function fakeEvent(headers: Record<string, string> = {}): H3Event {
  return { node: { req: { headers } } } as unknown as H3Event
}

const POST = { method: 'POST', path: '/api/things' }

describe('beginIdempotency — protocol', () => {
  const key = { 'idempotency-key': 'k1' }

  it('returns null without a header, and for safe methods with one', async () => {
    const opts: IdempotencyOptions = { store: createMemoryStore() }
    expect(await beginIdempotency(fakeEvent(), POST, null, opts)).toBeNull()
    expect(
      await beginIdempotency(fakeEvent(key), { method: 'GET', path: '/api/things' }, null, opts),
    ).toBeNull()
  })

  it('proceed → commit → replay returns the exact cached {status, body}', async () => {
    const opts: IdempotencyOptions = { store: createMemoryStore() }
    const first = await beginIdempotency(fakeEvent(key), POST, null, opts)
    expect(first?.kind).toBe('proceed')
    if (first?.kind !== 'proceed') throw new Error('unreachable')
    await first.commit(201, { id: 7 })

    const retry = await beginIdempotency(fakeEvent(key), POST, null, opts)
    expect(retry).toEqual({ kind: 'replay', status: 201, body: { id: 7 } })
  })

  it('a concurrent duplicate (no commit yet) gets conflict', async () => {
    const opts: IdempotencyOptions = { store: createMemoryStore() }
    const first = await beginIdempotency(fakeEvent(key), POST, null, opts)
    expect(first?.kind).toBe('proceed')
    const dup = await beginIdempotency(fakeEvent(key), POST, null, opts)
    expect(dup?.kind).toBe('conflict')
  })

  it('release (the 5xx path) lets a retry re-execute', async () => {
    const opts: IdempotencyOptions = { store: createMemoryStore() }
    const first = await beginIdempotency(fakeEvent(key), POST, null, opts)
    if (first?.kind !== 'proceed') throw new Error('expected proceed')
    await first.release()
    const retry = await beginIdempotency(fakeEvent(key), POST, null, opts)
    expect(retry?.kind).toBe('proceed')
  })

  it('a cached response expires after ttlMs', async () => {
    let t = 0
    const opts: IdempotencyOptions = { store: createMemoryStore({ now: () => t }), ttlMs: 1000 }
    const first = await beginIdempotency(fakeEvent(key), POST, null, opts)
    if (first?.kind !== 'proceed') throw new Error('expected proceed')
    await first.commit(200, 'ok')
    t = 999
    expect((await beginIdempotency(fakeEvent(key), POST, null, opts))?.kind).toBe('replay')
    t = 1000
    expect((await beginIdempotency(fakeEvent(key), POST, null, opts))?.kind).toBe('proceed')
  })

  it('the same key is scoped per user — two users both proceed', async () => {
    const opts: IdempotencyOptions = { store: createMemoryStore() }
    const ada = await beginIdempotency(fakeEvent(key), POST, { id: 'ada' }, opts)
    const bob = await beginIdempotency(fakeEvent(key), POST, { id: 'bob' }, opts)
    expect(ada?.kind).toBe('proceed')
    expect(bob?.kind).toBe('proceed')
  })

  it('the lock-loser re-checks the result key (winner committed between get and incr)', async () => {
    // Simulate the race: the winner has ALREADY committed and released, but the loser's
    // first `get` raced to a miss. We model the loser entering at step 2 by pre-seeding
    // the lock (as if both incremented) and the result (as if the winner just committed).
    const store = createMemoryStore()
    const opts: IdempotencyOptions = { store }
    await store.incr('idem:POST:/api/things:anon:k1:lock', 60_000) // winner's acquire
    await store.set(
      'idem:POST:/api/things:anon:k1',
      JSON.stringify({ status: 200, body: 'won' }),
      60_000,
    )
    const loser = await beginIdempotency(fakeEvent(key), POST, null, opts)
    expect(loser).toEqual({ kind: 'replay', status: 200, body: 'won' })
  })

  it('an in-flight lock expires after inFlightTtlMs (crash recovery)', async () => {
    let t = 0
    const opts: IdempotencyOptions = {
      store: createMemoryStore({ now: () => t }),
      inFlightTtlMs: 500,
    }
    const first = await beginIdempotency(fakeEvent(key), POST, null, opts)
    expect(first?.kind).toBe('proceed') // …and the process "crashes" (no commit/release)
    t = 499
    expect((await beginIdempotency(fakeEvent(key), POST, null, opts))?.kind).toBe('conflict')
    t = 500
    expect((await beginIdempotency(fakeEvent(key), POST, null, opts))?.kind).toBe('proceed')
  })
})

// ── Integration: the /api pipeline via createTestApp ────────────────────────

let runs = 0
let gate: { promise: Promise<void>; open: () => void } | undefined

function entries(): ApiEntry[] {
  const create = defineApexRoute({
    method: 'POST',
    input: { name: z.string() },
    handler: async ({ input }) => {
      runs++
      if (gate) await gate.promise // lets the concurrency test hold a request in-flight
      return { created: (input as { name: string }).name, run: runs }
    },
  })
  const boom = defineApexRoute({
    method: 'POST',
    handler: () => {
      runs++
      throw new Error('transient failure')
    },
  })
  const list = defineApexRoute({
    handler: () => {
      runs++
      return { ok: true }
    },
  })
  return [
    ...expandApiModule('things', create),
    ...expandApiModule('boom', boom),
    ...expandApiModule('list', list),
  ]
}

describe('idempotency — /api integration', () => {
  let app: TestApp
  beforeAll(async () => {
    app = await createTestApp({ entries: entries(), idempotencyStore: createMemoryStore() })
  })
  afterAll(() => app.close())

  it('replays a POST retry with the same Idempotency-Key (handler runs once)', async () => {
    runs = 0
    const opts = { headers: { 'Idempotency-Key': 'same-key' } }
    const first = await app.post('/api/things', { name: 'a' }, opts)
    const retry = await app.post('/api/things', { name: 'a' }, opts)
    expect(first.status).toBe(200)
    expect(retry.status).toBe(200)
    expect(retry.body).toEqual(first.body) // identical cached body
    expect(retry.headers.get('x-idempotent-replay')).toBe('true')
    expect(first.headers.get('x-idempotent-replay')).toBeNull()
    expect(runs).toBe(1)
  })

  it('a different key executes again', async () => {
    runs = 0
    await app.post('/api/things', { name: 'a' }, { headers: { 'Idempotency-Key': 'k-1' } })
    await app.post('/api/things', { name: 'a' }, { headers: { 'Idempotency-Key': 'k-2' } })
    expect(runs).toBe(2)
  })

  it('GET ignores the header entirely', async () => {
    runs = 0
    await app.get('/api/list', { headers: { 'Idempotency-Key': 'g-1' } })
    await app.get('/api/list', { headers: { 'Idempotency-Key': 'g-1' } })
    expect(runs).toBe(2)
  })

  it('a throwing handler (500) is not cached — the retry re-executes', async () => {
    runs = 0
    const opts = { headers: { 'Idempotency-Key': 'boom-key' } }
    expect((await app.post('/api/boom', {}, opts)).status).toBe(500)
    expect((await app.post('/api/boom', {}, opts)).status).toBe(500)
    expect(runs).toBe(2)
  })

  it('a concurrent duplicate gets 409 while the first is in flight', async () => {
    runs = 0
    let open!: () => void
    gate = { promise: new Promise<void>((r) => (open = r)), open: () => open() }
    const opts = { headers: { 'Idempotency-Key': 'concurrent-key' } }
    const firstP = app.post('/api/things', { name: 'c' }, opts)
    // Give the first request time to reach the handler (and hold the lock).
    await new Promise((r) => setTimeout(r, 50))
    const dup = await app.post('/api/things', { name: 'c' }, opts)
    expect(dup.status).toBe(409)
    expect(dup.body).toEqual({ error: 'request in progress' })
    gate.open()
    const first = await firstP
    expect(first.status).toBe(200)
    expect(runs).toBe(1)
    gate = undefined
  })
})
