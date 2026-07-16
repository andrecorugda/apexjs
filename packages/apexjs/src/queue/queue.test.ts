import { describe, expect, it, vi } from 'vitest'
import type { QueueDbHandle, SqlValue } from './databaseDriver.js'
import { createQueue, defineJob } from './queue.js'

/** A controllable clock: `clock.value` is the epoch-ms `now()` returns. */
function makeClock(start = 1000) {
  const clock = { value: start }
  return { clock, now: () => clock.value }
}

/** A deterministic id factory (no Math.random / real time). */
function seqIds() {
  let n = 0
  return () => `job-${++n}`
}

describe('defineJob', () => {
  it('returns a typed definition carrying name + handler', () => {
    const job = defineJob<{ to: string }>('email', async () => {})
    expect(job.name).toBe('email')
    expect(typeof job.handler).toBe('function')
  })
})

describe('createQueue — memory driver', () => {
  it('enqueue + process runs the handler with the decoded payload and attempt=1', async () => {
    const { now } = makeClock()
    const queue = createQueue({ now, idFactory: seqIds() })
    const seen: Array<{ payload: unknown; attempt: number }> = []
    queue.register(
      defineJob<{ to: string }>('email', (payload, ctx) => {
        seen.push({ payload, attempt: ctx.attempt })
      }),
    )

    const id = await queue.enqueue('email', { to: 'a@b.c' })
    expect(id).toBe('job-1')
    expect(await queue.size()).toBe(1)

    const result = await queue.process()
    expect(result).toMatchObject({ processed: 1, done: 1, retried: 0, failed: 0 })
    expect(seen).toEqual([{ payload: { to: 'a@b.c' }, attempt: 1 }])
    expect(await queue.size()).toBe(0) // no longer pending (done)
  })

  it('a throwing handler retries with exponential backoff, then dead-letters after maxAttempts', async () => {
    const { clock, now } = makeClock(1000)
    const queue = createQueue({ now, idFactory: seqIds(), maxAttempts: 3, backoffBaseMs: 100 })
    const attempts: number[] = []
    queue.register(
      defineJob('always-fails', (_payload, ctx) => {
        attempts.push(ctx.attempt)
        throw new Error(`boom ${ctx.attempt}`)
      }),
    )
    await queue.enqueue('always-fails', {})

    // Attempt 1 (t=1000): fails → reschedule to 1000 + 100*2^1 = 1200.
    expect(await queue.process()).toMatchObject({ processed: 1, retried: 1, failed: 0 })
    expect(await queue.size()).toBe(1) // still pending, just deferred

    // Not due yet — nothing runs.
    clock.value = 1199
    expect(await queue.process()).toMatchObject({ processed: 0 })
    expect(attempts).toEqual([1])

    // Attempt 2 (t=1200): fails → reschedule to 1200 + 100*2^2 = 1600.
    clock.value = 1200
    expect(await queue.process()).toMatchObject({ processed: 1, retried: 1 })

    // Attempt 3 (t=1600): fails → attempts(3) >= maxAttempts(3) ⇒ dead-letter.
    clock.value = 1600
    expect(await queue.process()).toMatchObject({ processed: 1, retried: 0, failed: 1 })

    expect(attempts).toEqual([1, 2, 3])
    expect(await queue.size()).toBe(0) // failed jobs are not pending

    // Even far in the future, a dead-lettered job never runs again.
    clock.value = 10_000_000
    expect(await queue.process()).toMatchObject({ processed: 0 })
    expect(attempts).toEqual([1, 2, 3])
  })

  it('a succeeding retry stops the backoff chain', async () => {
    const { clock, now } = makeClock(0)
    const queue = createQueue({ now, idFactory: seqIds(), backoffBaseMs: 10 })
    let calls = 0
    queue.register(
      defineJob('flaky', () => {
        calls++
        if (calls === 1) throw new Error('first fails')
      }),
    )
    await queue.enqueue('flaky', {})
    await queue.process() // fails → runAt = 0 + 10*2 = 20
    clock.value = 20
    expect(await queue.process()).toMatchObject({ done: 1, retried: 0 })
    expect(calls).toBe(2)
    expect(await queue.size()).toBe(0)
  })

  it('a delayed job does not run before its runAt', async () => {
    const { clock, now } = makeClock(1000)
    const queue = createQueue({ now, idFactory: seqIds() })
    let ran = false
    queue.register(
      defineJob('later', () => {
        ran = true
      }),
    )
    await queue.enqueue('later', {}, { delaySeconds: 5 }) // due at 1000 + 5000 = 6000

    expect(await queue.size()).toBe(1)
    clock.value = 5999
    expect(await queue.process()).toMatchObject({ processed: 0 })
    expect(ran).toBe(false)

    clock.value = 6000
    expect(await queue.process()).toMatchObject({ processed: 1, done: 1 })
    expect(ran).toBe(true)
  })

  it('size() reflects only pending jobs across mixed states', async () => {
    const { now } = makeClock()
    const queue = createQueue({ now, idFactory: seqIds() })
    queue.register(defineJob('ok', () => {}))
    queue.register(
      defineJob('bad', () => {
        throw new Error('nope')
      }),
    )
    await queue.enqueue('ok', {}) // will complete
    await queue.enqueue('bad', {}, { maxAttempts: 1 }) // dead-letters immediately
    await queue.enqueue('ok', {}, { delaySeconds: 999 }) // stays pending (not due)

    expect(await queue.size()).toBe(3)
    await queue.process()
    // ok → done, bad → failed (maxAttempts=1), delayed ok → still pending.
    expect(await queue.size()).toBe(1)
  })

  it('an enqueued job with no registered handler is skipped and left pending', async () => {
    const { now } = makeClock()
    const queue = createQueue({ now, idFactory: seqIds() })
    await queue.enqueue('unknown', {})
    expect(await queue.process()).toMatchObject({ processed: 1, skipped: 1, done: 0 })
    expect(await queue.size()).toBe(1) // still pending for a worker that knows the handler
  })

  it('work() polls process() via an injected timer and stop() ends the loop', async () => {
    const { now } = makeClock()
    const queue = createQueue({ now, idFactory: seqIds() })
    let ran = 0
    queue.register(
      defineJob('tick', () => {
        ran++
      }),
    )
    await queue.enqueue('tick', {})

    let tick: (() => void) | undefined
    let cleared = false
    const handle = queue.work({
      intervalMs: 50,
      setInterval: (cb) => {
        tick = cb
        return 1
      },
      clearInterval: () => {
        cleared = true
      },
    })
    expect(typeof tick).toBe('function')

    tick?.() // one poll → drains the queue
    await vi.waitFor(() => expect(ran).toBe(1))

    handle.stop()
    expect(cleared).toBe(true)
  })
})

/**
 * A hand-rolled in-memory {@link QueueDbHandle} that honors the `?`-placeholder contract the
 * database driver relies on. It stores rows in a Map and returns `run_at` as a STRING to mimic how
 * Postgres BIGINT columns arrive over the wire — exercising the driver's numeric coercion.
 */
function fakeHandle(): QueueDbHandle {
  type Stored = Record<string, unknown>
  const rows = new Map<string, Stored>()
  const p = (params: readonly SqlValue[] | undefined, i: number): SqlValue => {
    const v = params?.[i]
    return v === undefined ? null : v
  }
  return {
    async exec(sql, params) {
      const s = sql.trim().toUpperCase()
      if (s.startsWith('CREATE TABLE')) return
      if (s.startsWith('INSERT')) {
        rows.set(String(p(params, 0)), {
          id: p(params, 0),
          name: p(params, 1),
          payload: p(params, 2),
          attempts: p(params, 3),
          max_attempts: p(params, 4),
          run_at: String(p(params, 5)), // simulate BIGINT-as-string
          status: p(params, 6),
          last_error: p(params, 7),
        })
        return
      }
      if (s.startsWith('UPDATE')) {
        const id = String(p(params, 4))
        const row = rows.get(id)
        if (row) {
          row.attempts = p(params, 0)
          row.status = p(params, 1)
          row.run_at = String(p(params, 2))
          row.last_error = p(params, 3)
        }
        return
      }
      throw new Error(`fakeHandle.exec: unhandled SQL: ${sql}`)
    },
    async query(sql, params) {
      const s = sql.trim().toUpperCase()
      if (s.includes('COUNT(')) {
        let n = 0
        for (const r of rows.values()) if (r.status === 'pending') n++
        return [{ n }]
      }
      if (s.includes('WHERE STATUS')) {
        const now = Number(p(params, 0))
        return [...rows.values()]
          .filter((r) => r.status === 'pending' && Number(r.run_at) <= now)
          .sort((a, b) => Number(a.run_at) - Number(b.run_at))
          .map((r) => ({ ...r }))
      }
      throw new Error(`fakeHandle.query: unhandled SQL: ${sql}`)
    },
  }
}

describe('createQueue — database driver (fake handle)', () => {
  it('migrationSql() emits the expected columns', () => {
    const queue = createQueue({ driver: 'database', handle: fakeHandle(), table: 'jobs' })
    const sql = queue.migrationSql()
    for (const col of [
      'id TEXT PRIMARY KEY',
      'name TEXT',
      'payload TEXT',
      'attempts INTEGER',
      'max_attempts INTEGER',
      'run_at BIGINT',
      'status TEXT',
      'last_error TEXT',
    ]) {
      expect(sql).toContain(col)
    }
  })

  it('rejects an invalid table name (fail-fast, no identifier injection)', () => {
    expect(() =>
      createQueue({ driver: 'database', handle: fakeHandle(), table: 'jobs; DROP TABLE x' }),
    ).toThrow(/Invalid queue table name/)
    expect(() =>
      createQueue({ driver: 'database', handle: fakeHandle(), table: 'bad-name' }),
    ).toThrow(/Invalid queue table name/)
  })

  it('enqueue + process runs the handler and size() tracks pending', async () => {
    const { now } = makeClock()
    const handle = fakeHandle()
    const queue = createQueue({ driver: 'database', handle, now, idFactory: seqIds() })
    await handle.exec(queue.migrationSql())

    const seen: Array<{ id: number; attempt: number }> = []
    queue.register(
      defineJob<{ id: number }>('resize', (payload, ctx) => {
        seen.push({ id: payload.id, attempt: ctx.attempt })
      }),
    )
    await queue.enqueue('resize', { id: 7 })
    expect(await queue.size()).toBe(1)

    expect(await queue.process()).toMatchObject({ processed: 1, done: 1 })
    expect(seen).toEqual([{ id: 7, attempt: 1 }])
    expect(await queue.size()).toBe(0)
  })

  it('retries with backoff and dead-letters after maxAttempts over the db driver', async () => {
    const { clock, now } = makeClock(1000)
    const handle = fakeHandle()
    const queue = createQueue({
      driver: 'database',
      handle,
      now,
      idFactory: seqIds(),
      maxAttempts: 2,
      backoffBaseMs: 100,
    })
    await handle.exec(queue.migrationSql())

    const attempts: number[] = []
    queue.register(
      defineJob('boom', (_p, ctx) => {
        attempts.push(ctx.attempt)
        throw new Error('kaboom')
      }),
    )
    await queue.enqueue('boom', {})

    // Attempt 1 (t=1000) → reschedule to 1000 + 100*2 = 1200.
    expect(await queue.process()).toMatchObject({ retried: 1, failed: 0 })
    clock.value = 1200
    // Attempt 2 (t=1200) → attempts(2) >= maxAttempts(2) ⇒ dead-letter.
    expect(await queue.process()).toMatchObject({ retried: 0, failed: 1 })

    expect(attempts).toEqual([1, 2])
    expect(await queue.size()).toBe(0)
  })

  it('a delayed job is not returned as due before its time (db driver)', async () => {
    const { clock, now } = makeClock(1000)
    const handle = fakeHandle()
    const queue = createQueue({ driver: 'database', handle, now, idFactory: seqIds() })
    await handle.exec(queue.migrationSql())

    let ran = false
    queue.register(
      defineJob('delayed', () => {
        ran = true
      }),
    )
    await queue.enqueue('delayed', {}, { delaySeconds: 10 }) // due at 11000

    clock.value = 10_999
    expect(await queue.process()).toMatchObject({ processed: 0 })
    expect(ran).toBe(false)

    clock.value = 11_000
    expect(await queue.process()).toMatchObject({ processed: 1, done: 1 })
    expect(ran).toBe(true)
  })
})
