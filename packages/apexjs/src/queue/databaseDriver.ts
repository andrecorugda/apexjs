// The database-backed queue driver: jobs persist in a table via a db handle the caller passes in.
// It only ever calls `handle.exec` / `handle.query` with `?` placeholders (portable across
// SQLite/Postgres — the handle translates them), so this module has NO top-level `node:` import and
// the memory path that statically imports it (via ./queue.ts) stays on-device safe.
import type { JobRecord, JobStatus, QueueDriver } from './queue.js'

/** A bound SQL parameter — the value shapes this driver ever passes to the handle. */
export type SqlValue = string | number | boolean | null

/**
 * The minimal db handle the `database` driver needs: parameterized `exec`/`query` with `?`
 * placeholders. `@apex-stack/data`'s `ApexDbHandle` satisfies this structurally, as does any
 * hand-rolled handle over your own driver.
 */
export interface QueueDbHandle {
  exec(sql: string, params?: readonly SqlValue[]): Promise<void>
  query(sql: string, params?: readonly SqlValue[]): Promise<Array<Record<string, unknown>>>
}

/** Identifiers can't be bound as parameters, so a table name must be a plain SQL identifier. */
function assertIdentifier(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid queue table name: ${JSON.stringify(name)}`)
  }
  return name
}

/**
 * The `CREATE TABLE` DDL for the jobs table (portable SQLite/Postgres). `run_at` is epoch-ms; a job
 * is due when `run_at <= now`. `payload` is JSON text; `status` is one of pending|done|failed.
 */
export function buildMigrationSql(table = 'jobs'): string {
  const t = assertIdentifier(table)
  return [
    `CREATE TABLE IF NOT EXISTS ${t} (`,
    `  id TEXT PRIMARY KEY,`,
    `  name TEXT NOT NULL,`,
    `  payload TEXT NOT NULL,`,
    `  attempts INTEGER NOT NULL DEFAULT 0,`,
    `  max_attempts INTEGER NOT NULL,`,
    `  run_at BIGINT NOT NULL,`,
    `  status TEXT NOT NULL DEFAULT 'pending',`,
    `  last_error TEXT`,
    `);`,
  ].join('\n')
}

/** Coerce a driver-returned column (Postgres BIGINT may arrive as a string) to a number. */
function toNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value)
}

/** Map a raw DB row to a {@link JobRecord}, normalizing column types across drivers. */
function toRecord(row: Record<string, unknown>): JobRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    payload: String(row.payload),
    attempts: toNumber(row.attempts),
    maxAttempts: toNumber(row.max_attempts),
    runAt: toNumber(row.run_at),
    status: String(row.status) as JobStatus,
    lastError: row.last_error == null ? null : String(row.last_error),
  }
}

/**
 * Create a {@link QueueDriver} backed by `handle`. Run {@link buildMigrationSql} once to create the
 * table. All writes use `?`-placeholder parameters — values are bound, never string-concatenated.
 */
export function createDatabaseDriver(handle: QueueDbHandle, table = 'jobs'): QueueDriver {
  const t = assertIdentifier(table)
  return {
    async insert(record) {
      await handle.exec(
        `INSERT INTO ${t} (id, name, payload, attempts, max_attempts, run_at, status, last_error)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.name,
          record.payload,
          record.attempts,
          record.maxAttempts,
          record.runAt,
          record.status,
          record.lastError,
        ],
      )
    },
    async due(now) {
      const rows = await handle.query(
        `SELECT id, name, payload, attempts, max_attempts, run_at, status, last_error
         FROM ${t}
         WHERE status = 'pending' AND run_at <= ?
         ORDER BY run_at ASC`,
        [now],
      )
      return rows.map(toRecord)
    },
    async update(record) {
      await handle.exec(
        `UPDATE ${t}
         SET attempts = ?, status = ?, run_at = ?, last_error = ?
         WHERE id = ?`,
        [record.attempts, record.status, record.runAt, record.lastError, record.id],
      )
    },
    async countPending() {
      const rows = await handle.query(`SELECT COUNT(*) AS n FROM ${t} WHERE status = 'pending'`)
      return rows.length > 0 ? toNumber(rows[0]?.n) : 0
    },
  }
}
