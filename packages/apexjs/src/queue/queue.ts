// A small background job queue for work that must not block a request: email, exports, webhooks,
// image processing. Jobs are typed definitions (`defineJob`); a `Queue` enqueues payloads, runs the
// due ones (`process`), and can poll on an interval (`work`). Failures retry with exponential
// backoff and dead-letter after `maxAttempts`. Delayed jobs wait for their `runAt`.
//
// The factory + interface + config-object shape mirrors the cache/security primitives
// (see cache/cache.ts, security/kvStore.ts). On-device safe: this module has NO top-level `node:`
// import, so the `memory` driver runs on a bare JS engine (QuickJS et al.). The `database` driver
// (./databaseDriver.ts) only touches a db handle the caller passes in — never Node built-ins.

import { buildMigrationSql, createDatabaseDriver, type QueueDbHandle } from './databaseDriver.js'

/** Lifecycle state of a persisted job. `failed` is the dead-letter terminal state. */
export type JobStatus = 'pending' | 'done' | 'failed'

/** Runtime context handed to a job handler. `attempt` is 1-based (1 on the first run). */
export interface JobContext {
  /** How many times this job has been attempted, including the current run (1-based). */
  attempt: number
}

/**
 * A typed job definition: a `name` used to enqueue/route and a `handler` that receives the decoded
 * payload plus a {@link JobContext}. Build one with {@link defineJob}, then `register` it on a queue.
 */
export interface JobDefinition<T> {
  name: string
  handler: (payload: T, ctx: JobContext) => Promise<void> | void
}

/**
 * A stored job row. `payload` is JSON text; `runAt` is an absolute epoch-ms deadline (a job is due
 * when `runAt <= now`). The driver persists exactly these fields — see {@link buildMigrationSql}.
 */
export interface JobRecord {
  id: string
  name: string
  payload: string
  attempts: number
  maxAttempts: number
  runAt: number
  status: JobStatus
  lastError: string | null
}

/** Options for a single {@link Queue.enqueue}. */
export interface EnqueueOptions {
  /** Delay before the job becomes due, in seconds. Sets `runAt = now + delaySeconds*1000`. */
  delaySeconds?: number
  /** Override the queue-wide attempt cap for this job. */
  maxAttempts?: number
}

/** What one {@link Queue.process} pass did — handy for tests and worker logging. */
export interface ProcessResult {
  /** Due jobs picked up this pass. */
  processed: number
  /** Handlers that completed successfully (marked `done`). */
  done: number
  /** Handlers that threw but were re-scheduled for a later attempt. */
  retried: number
  /** Handlers that threw and exhausted `maxAttempts` (marked `failed`). */
  failed: number
  /** Due jobs skipped because no handler was registered for their name. */
  skipped: number
}

/** A running {@link Queue.work} loop. Call `stop()` to cancel the interval. */
export interface WorkHandle {
  stop(): void
}

/** Options for {@link Queue.work}. Timers are injectable so tests need not use real ones. */
export interface WorkOptions {
  /** Poll interval in milliseconds. */
  intervalMs: number
  /** Called with any error thrown by a `process()` pass (default: swallowed). */
  onError?: (error: unknown) => void
  /** Timer scheduler (default `globalThis.setInterval`). Return value is passed back to `clear`. */
  setInterval?: (handler: () => void, ms: number) => unknown
  /** Timer canceller (default `globalThis.clearInterval`). */
  clearInterval?: (handle: unknown) => void
}

/**
 * The queue surface. Register the jobs a worker knows how to run, `enqueue` payloads, then drain
 * due jobs with `process()` (once) or `work()` (on a loop).
 */
export interface Queue {
  /** Teach the queue how to run a job name. Re-registering a name overwrites the handler. */
  register<T>(job: JobDefinition<T>): void
  /** Persist a job payload for `name`. Returns the new job id. */
  enqueue<T>(name: string, payload: T, opts?: EnqueueOptions): Promise<string>
  /** Run every currently-due job exactly once, applying retry/backoff/dead-letter rules. */
  process(): Promise<ProcessResult>
  /** Poll `process()` on an interval; returns a handle whose `stop()` ends the loop. */
  work(opts: WorkOptions): WorkHandle
  /** Number of jobs still `pending` (excludes `done` and dead-lettered `failed`). */
  size(): Promise<number>
  /** The `CREATE TABLE` DDL for the `database` driver (portable SQLite/Postgres). */
  migrationSql(): string
}

/**
 * The raw storage backend behind a {@link Queue}. Implement this to add a backend; the queue
 * orchestration (retries, backoff, dead-letter, routing) lives in the queue and is reused unchanged.
 */
export interface QueueDriver {
  /** Persist a brand-new job row. */
  insert(record: JobRecord): Promise<void>
  /** Every `pending` job whose `runAt <= now`, oldest first. */
  due(now: number): Promise<JobRecord[]>
  /** Overwrite an existing job row (matched by `id`). */
  update(record: JobRecord): Promise<void>
  /** Count of `pending` jobs. */
  countPending(): Promise<number>
}

/** Config for {@link createQueue}. `memory` is the default; `database` needs a db `handle`. */
export type QueueConfig = (
  | { driver?: 'memory' }
  | { driver: 'database'; handle: QueueDbHandle; table?: string }
) & {
  /** Wall clock (injectable for tests). Default `() => Date.now()`. */
  now?: () => number
  /** Default attempt cap before a job is dead-lettered. Default 3. */
  maxAttempts?: number
  /** Backoff base in ms. Retry delay = `backoffBaseMs * 2^attempt`. Default 1000. */
  backoffBaseMs?: number
  /** Id generator (injectable for tests). Default is a `now()`-seeded monotonic counter. */
  idFactory?: () => string
}

/**
 * The built-in in-memory {@link QueueDriver} — per process, zero config, on-device safe. Jobs live
 * in a `Map` keyed by id; nothing survives a restart. Use the `database` driver for durability.
 */
export function createMemoryDriver(): QueueDriver {
  const rows = new Map<string, JobRecord>()
  return {
    async insert(record) {
      rows.set(record.id, { ...record })
    },
    async due(now) {
      return [...rows.values()]
        .filter((r) => r.status === 'pending' && r.runAt <= now)
        .sort((a, b) => a.runAt - b.runAt)
        .map((r) => ({ ...r }))
    },
    async update(record) {
      rows.set(record.id, { ...record })
    },
    async countPending() {
      let n = 0
      for (const r of rows.values()) if (r.status === 'pending') n++
      return n
    },
  }
}

/**
 * Define a typed job. `name` routes enqueued payloads to `handler`, which receives the decoded
 * payload and a {@link JobContext} carrying the (1-based) attempt number.
 */
export function defineJob<T>(
  name: string,
  handler: (payload: T, ctx: JobContext) => Promise<void> | void,
): JobDefinition<T> {
  return { name, handler }
}

/** Build the {@link Queue} surface over a driver. Holds the job registry and orchestration config. */
function makeQueue(
  driver: QueueDriver,
  now: () => number,
  defaults: { maxAttempts: number; backoffBaseMs: number },
  nextId: () => string,
  migration: () => string,
): Queue {
  const jobs = new Map<string, JobDefinition<unknown>>()

  /** Run one due job, applying success / retry-with-backoff / dead-letter transitions. */
  const runOne = async (record: JobRecord, tally: ProcessResult): Promise<void> => {
    const job = jobs.get(record.name)
    if (!job) {
      tally.skipped++
      return // no handler registered — leave pending for a worker that has one
    }
    const attempt = record.attempts + 1 // this run's number (1-based)
    try {
      const payload = JSON.parse(record.payload) as unknown
      await job.handler(payload, { attempt })
      await driver.update({ ...record, attempts: attempt, status: 'done', lastError: null })
      tally.done++
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (attempt >= record.maxAttempts) {
        await driver.update({
          ...record,
          attempts: attempt,
          status: 'failed', // dead-letter — stop retrying
          lastError: message,
        })
        tally.failed++
        return
      }
      const backoff = defaults.backoffBaseMs * 2 ** attempt
      await driver.update({
        ...record,
        attempts: attempt,
        status: 'pending',
        runAt: now() + backoff,
        lastError: message,
      })
      tally.retried++
    }
  }

  const self: Queue = {
    register<T>(job: JobDefinition<T>): void {
      jobs.set(job.name, job as unknown as JobDefinition<unknown>)
    },
    async enqueue<T>(name: string, payload: T, opts: EnqueueOptions = {}): Promise<string> {
      const id = nextId()
      const delayMs = (opts.delaySeconds ?? 0) * 1000
      await driver.insert({
        id,
        name,
        payload: JSON.stringify(payload ?? null),
        attempts: 0,
        maxAttempts: opts.maxAttempts ?? defaults.maxAttempts,
        runAt: now() + delayMs,
        status: 'pending',
        lastError: null,
      })
      return id
    },
    async process(): Promise<ProcessResult> {
      const tally: ProcessResult = { processed: 0, done: 0, retried: 0, failed: 0, skipped: 0 }
      const dueJobs = await driver.due(now()) // snapshot: re-scheduled retries land in the future
      for (const record of dueJobs) {
        tally.processed++
        await runOne(record, tally)
      }
      return tally
    },
    work(opts: WorkOptions): WorkHandle {
      const set = opts.setInterval ?? ((h, ms) => globalThis.setInterval(h, ms))
      const clear = opts.clearInterval ?? ((h) => globalThis.clearInterval(h as never))
      let running = false
      const handle = set(() => {
        if (running) return // never overlap passes
        running = true
        void self
          .process()
          .catch((error) => opts.onError?.(error))
          .finally(() => {
            running = false
          })
      }, opts.intervalMs)
      return {
        stop() {
          clear(handle)
        },
      }
    },
    size(): Promise<number> {
      return driver.countPending()
    },
    migrationSql(): string {
      return migration()
    },
  }
  return self
}

/**
 * Create a {@link Queue}. `{ driver: 'memory' }` (the default) is in-process and on-device safe;
 * `{ driver: 'database', handle }` persists jobs to a table via the passed db handle. Inject `now`
 * and `idFactory` to make behavior fully deterministic in tests.
 */
export function createQueue(config: QueueConfig = {}): Queue {
  const now = config.now ?? (() => Date.now())
  const defaults = {
    maxAttempts: config.maxAttempts ?? 3,
    backoffBaseMs: config.backoffBaseMs ?? 1000,
  }

  let seq = 0
  const nextId = config.idFactory ?? (() => `job_${now()}_${(++seq).toString(36)}`)

  const table = config.driver === 'database' ? (config.table ?? 'jobs') : 'jobs'
  const migration = () => buildMigrationSql(table)
  const driver =
    config.driver === 'database' ? createDatabaseDriver(config.handle, table) : createMemoryDriver()

  return makeQueue(driver, now, defaults, nextId, migration)
}
