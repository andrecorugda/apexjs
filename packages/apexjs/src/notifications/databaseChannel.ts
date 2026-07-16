// The built-in database notification channel: persists each notification to a table via a db handle
// the caller passes in. It only ever calls `handle.exec` / `handle.query` with `?` placeholders
// (portable across SQLite/Postgres — the handle translates them), so this module has NO top-level
// `node:` import and stays on-device safe. Mirrors queue/databaseDriver.ts.
import type { Channel, Notifiable } from './notifications.js'

/** A bound SQL parameter — the value shapes this channel ever passes to the handle. */
export type SqlValue = string | number | boolean | null

/**
 * The minimal db handle the database channel needs: parameterized `exec`/`query` with `?`
 * placeholders. `@apex-stack/data`'s `ApexDbHandle` satisfies this structurally, as does any
 * hand-rolled handle over your own driver.
 */
export interface NotificationDbHandle {
  exec(sql: string, params?: readonly SqlValue[]): Promise<void>
  query(sql: string, params?: readonly SqlValue[]): Promise<Array<Record<string, unknown>>>
}

/** A persisted notification row, with column types normalized across drivers. */
export interface StoredNotification {
  id: string
  notifiableId: string
  type: string
  data: Record<string, unknown>
  readAt: number | null
  createdAt: number
}

/**
 * The database channel surface: a {@link Channel} plus the read/state helpers apps need — the
 * `CREATE TABLE` DDL, marking one read, and listing a recipient's unread notifications.
 */
export interface DatabaseChannel extends Channel {
  /** The `CREATE TABLE` DDL for the notifications table (portable SQLite/Postgres). */
  migrationSql(): string
  /** Mark a single stored notification read (stamps `read_at` with the current clock). */
  markRead(id: string): Promise<void>
  /** A recipient's unread notifications (`read_at IS NULL`), oldest first. */
  unread(notifiableId: string | number): Promise<StoredNotification[]>
}

/** Config for {@link databaseChannel}. `now`/`id` are injectable for deterministic tests. */
export interface DatabaseChannelConfig {
  handle: NotificationDbHandle
  table?: string
  now?: () => number
  id?: () => string
}

/** Identifiers can't be bound as parameters, so a table name must be a plain SQL identifier. */
function assertIdentifier(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid notifications table name: ${JSON.stringify(name)}`)
  }
  return name
}

/** Coerce a driver-returned column (Postgres BIGINT may arrive as a string) to a number. */
function toNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value)
}

/** Parse the JSON `data` column back to an object, tolerating an already-parsed value or bad JSON. */
function parseData(value: unknown): Record<string, unknown> {
  if (value != null && typeof value === 'object') return value as Record<string, unknown>
  if (typeof value !== 'string') return {}
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed != null && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/** Map a raw DB row to a {@link StoredNotification}, normalizing column types across drivers. */
function toStored(row: Record<string, unknown>): StoredNotification {
  return {
    id: String(row.id),
    notifiableId: String(row.notifiable_id),
    type: String(row.type),
    data: parseData(row.data),
    readAt: row.read_at == null ? null : toNumber(row.read_at),
    createdAt: toNumber(row.created_at),
  }
}

/**
 * The `CREATE TABLE` DDL for the notifications table (portable SQLite/Postgres). `data` is JSON text;
 * `read_at` is null until read; `created_at`/`read_at` are epoch-ms.
 */
export function buildMigrationSql(table = 'notifications'): string {
  const t = assertIdentifier(table)
  return [
    `CREATE TABLE IF NOT EXISTS ${t} (`,
    `  id TEXT PRIMARY KEY,`,
    `  notifiable_id TEXT NOT NULL,`,
    `  type TEXT NOT NULL,`,
    `  data TEXT NOT NULL,`,
    `  read_at BIGINT,`,
    `  created_at BIGINT NOT NULL`,
    `);`,
  ].join('\n')
}

/**
 * Create the built-in database {@link DatabaseChannel} backed by `handle`. Run {@link DatabaseChannel.migrationSql}
 * once to create the table. On `send`, the rendered value (typically `toDatabase()`'s object) is stored
 * as JSON in `data`; its `type` field (a string, if present) becomes the `type` column, else
 * `'notification'`. All writes use `?`-placeholder parameters — values are bound, never concatenated.
 */
export function databaseChannel(config: DatabaseChannelConfig): DatabaseChannel {
  const t = assertIdentifier(config.table ?? 'notifications')
  const now = config.now ?? (() => Date.now())
  let seq = 0
  const genId =
    config.id ??
    (() =>
      `${now().toString(36)}-${(seq++).toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`)

  return {
    async send(notifiable: Notifiable, rendered: unknown): Promise<void> {
      const data =
        rendered != null && typeof rendered === 'object'
          ? (rendered as Record<string, unknown>)
          : { value: rendered }
      const type = typeof data.type === 'string' ? data.type : 'notification'
      await config.handle.exec(
        `INSERT INTO ${t} (id, notifiable_id, type, data, read_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [genId(), String(notifiable.id), type, JSON.stringify(data), null, now()],
      )
    },
    migrationSql(): string {
      return buildMigrationSql(t)
    },
    async markRead(id: string): Promise<void> {
      await config.handle.exec(`UPDATE ${t} SET read_at = ? WHERE id = ?`, [now(), id])
    },
    async unread(notifiableId: string | number): Promise<StoredNotification[]> {
      const rows = await config.handle.query(
        `SELECT id, notifiable_id, type, data, read_at, created_at
         FROM ${t}
         WHERE notifiable_id = ? AND read_at IS NULL
         ORDER BY created_at ASC`,
        [String(notifiableId)],
      )
      return rows.map(toStored)
    },
  }
}
