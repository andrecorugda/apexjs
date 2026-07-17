import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { type ApexResource, type ApexUser, defineApexRoute } from '@apex-stack/core'
import { and, asc, desc, eq, type SQL, sql } from 'drizzle-orm'
import { type ZodRawShape, z } from 'zod'
import type { BehaviorHooks, FilterFn } from './behavior.js'
import { repository } from './repository.js'

export type { Behavior, BehaviorHooks, FilterFn, HookCtx } from './behavior.js'
// Model behaviors ("traits") — composable fields/access/scope/hooks. docs/architecture/auth.md §8.
export {
  auditable,
  composeBehaviors,
  observable,
  owned,
  softDeletes,
  timestamps,
} from './behavior.js'
// Fluent result collection returned by model reads.
export { Collection, collect } from './collection.js'
// Typed data errors (Eloquent-style) — thrown by *OrFail + wrapped driver failures.
export {
  ApexDataError,
  ModelNotFoundException,
  QueryException,
  StaleModelException,
} from './errors.js'
export type { Factory, FactoryOptions } from './factory.js'
// Schema-inferred test-data factories.
export { factory } from './factory.js'
export type { LazyDbOptions } from './lazy.js'
// Top-level-await-free database handle (for the mobile bundle / classic-script engines).
export { lazyDb } from './lazy.js'
export type {
  ApexModel,
  DefineModelOptions,
  Field,
  FieldDef,
  Fields,
  FieldType,
} from './model.js'
// defineModel — single source of truth: fields → table + zod + migration + resource.
export { defineModel } from './model.js'
export type {
  Cond,
  ModelInstance,
  Op,
  QueryOpts,
  Row,
  UpsertOptions,
  Values,
  WhereConds,
} from './query.js'
// Active-record query layer (P1): raw() escape hatch + the chainable QueryBuilder.
export { QueryBuilder, Raw, raw } from './query.js'
// Relationships + eager loading (`.with(...)`).
export { belongsTo, hasMany, hasOne, type RelationDef } from './relations.js'

export type Dialect = 'sqlite' | 'postgres'

/** A bound parameter value. Arrays/objects should be pre-serialized by the caller. */
export type SqlParam = string | number | boolean | null | Uint8Array | bigint

/** A driver-agnostic database handle. `db` is a Drizzle instance (async API). */
export interface ApexDbHandle {
  db: any
  dialect: Dialect
  /**
   * Run SQL that returns nothing. Without `params`, `sql` may contain multiple statements
   * (migrations, seeds). With `params`, it's ONE parameterized statement — use `?` placeholders
   * (portable; translated to `$1,$2,…` on Postgres) so values are bound safely, never string-concatenated.
   */
  exec(sql: string, params?: readonly SqlParam[]): Promise<void>
  /**
   * Run a single query and return rows. Use `?` placeholders + `params` to bind values safely
   * (portable across SQLite/Postgres) instead of interpolating into the SQL string.
   */
  query(sql: string, params?: readonly SqlParam[]): Promise<Array<Record<string, unknown>>>
  /**
   * Run `fn` inside a database transaction: auto-commits when `fn` resolves, auto-rolls-back
   * if it throws. `fn` receives a handle bound to the transaction — use it for AR / `db`
   * writes (`await Order.create(tx, …)`) so a multi-step unit is atomic.
   */
  transaction<T>(fn: (tx: ApexDbHandle) => Promise<T> | T): Promise<T>
  close(): Promise<void>
}

/** Build a bound Drizzle statement from a `?`-placeholder string (for exec/query inside a tx). */
function rawStmt(text: string, params?: readonly SqlParam[]): SQL {
  if (!params || params.length === 0) return sql.raw(text)
  const chunks: SQL[] = []
  for (const [i, p] of text.split('?').entries()) {
    if (p) chunks.push(sql.raw(p))
    if (i < params.length) chunks.push(sql`${params[i]}`)
  }
  return sql.join(chunks)
}

/** Wrap a Drizzle transaction db as an ApexDbHandle so AR/repo + raw exec run inside the tx. */
function txHandle(txDb: any, dialect: Dialect): ApexDbHandle {
  return {
    db: txDb,
    dialect,
    exec: async (s, params) => {
      const stmt = rawStmt(s, params)
      if (typeof txDb.run === 'function') await txDb.run(stmt)
      else await txDb.execute(stmt)
    },
    query: async (s, params) => {
      const stmt = rawStmt(s, params)
      if (typeof txDb.all === 'function')
        return (await txDb.all(stmt)) as Array<Record<string, unknown>>
      const r = (await txDb.execute(stmt)) as unknown
      return (Array.isArray(r) ? r : ((r as { rows?: unknown })?.rows ?? [])) as Array<
        Record<string, unknown>
      >
    },
    transaction: (fn) => txDb.transaction(async (inner: unknown) => fn(txHandle(inner, dialect))),
    close: async () => {},
  }
}

/**
 * Translate portable `?` placeholders to Postgres `$1,$2,…` positional params. Skips `?` inside
 * single-quoted string literals and `??` (JSON `?` operators aren't supported — use a bound param).
 * SQLite/libSQL/sql.js use `?` natively, so this only runs on the Postgres-family drivers.
 */
export function toPgPlaceholders(sql: string): string {
  let out = ''
  let n = 0
  let inStr = false
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i]
    if (c === "'") {
      inStr = !inStr
      out += c
    } else if (c === '?' && !inStr) {
      out += `$${++n}`
    } else {
      out += c
    }
  }
  return out
}

/** Postgres connection tuning (passed through to postgres-js). */
export interface PostgresConnectOptions {
  /**
   * Use prepared statements. Auto-disabled on a transaction pooler (Supabase
   * Supavisor / pgBouncer), which doesn't support them. Set explicitly to override.
   */
  prepare?: boolean
  /** TLS. Auto-enabled (`'require'`) for remote hosts; off for localhost. */
  ssl?: boolean | 'require' | 'prefer'
  /** Max pool size. */
  max?: number
  /** Idle connection timeout (seconds). */
  idleTimeout?: number
}

export type CreateDbConfig =
  | string // shorthand: a SQLite file path (libSQL), e.g. "data.db"
  | { driver: 'sqlite' | 'libsql'; url: string } // local file (file:…) or Turso (libsql://…)
  | { driver: 'postgres'; url: string; options?: PostgresConnectOptions } // Supabase / Neon / any PG
  | { driver: 'pglite'; dir?: string } // embedded Postgres (in-memory if no dir)

function libsqlUrl(pathOrUrl: string): string {
  return /^(file:|libsql:|https?:|:memory:)/.test(pathOrUrl) ? pathOrUrl : `file:${pathOrUrl}`
}

/**
 * Derive safe postgres-js options for a connection URL. Transaction poolers
 * (Supabase Supavisor / pgBouncer — `*.pooler.supabase.com` or `:6543`) can't run
 * prepared statements, so we disable them; remote hosts get SSL. Explicit
 * `override` values always win. Exported for testing.
 */
export function postgresOptions(
  url: string,
  override: PostgresConnectOptions = {},
): Record<string, unknown> {
  const isPooler = /pooler\.supabase\.com|:6543(\D|$)/.test(url)
  let host = ''
  try {
    host = new URL(url).hostname
  } catch {
    /* leave host empty → treated as local (no forced SSL) */
  }
  const isLocal = host === '' || host === 'localhost' || host === '127.0.0.1' || host === '::1'
  const opts: Record<string, unknown> = {}
  const prepare = override.prepare ?? (isPooler ? false : undefined)
  if (prepare !== undefined) opts.prepare = prepare
  const ssl = override.ssl ?? (isLocal ? undefined : 'require')
  if (ssl !== undefined) opts.ssl = ssl
  if (override.max !== undefined) opts.max = override.max
  if (override.idleTimeout !== undefined) opts.idle_timeout = override.idleTimeout
  return opts
}

// Module types for the optional-peer drivers. Aliases keep the cast lines short
// so the formatter can't wrap `import(...)` across lines (which breaks esbuild).
type LibsqlMod = typeof import('@libsql/client')
type PostgresMod = { default: typeof import('postgres') }
type PgliteMod = typeof import('@electric-sql/pglite')

/** Load a DB driver (an optional peer) with a clear message if it isn't installed. */
async function loadDriver(spec: string): Promise<unknown> {
  try {
    return await import(spec)
  } catch {
    throw new Error(
      `@apex-stack/data: the "${spec}" driver isn't installed. Install only the driver your database needs — e.g. \`npm i ${spec}\`.`,
    )
  }
}

/**
 * Open a database and wrap it with Drizzle behind a driver-agnostic handle.
 * All drivers use Drizzle's async query API, so `defineResource` works unchanged
 * across SQLite (libSQL/Turso), Postgres (Supabase/Neon) and embedded PGlite.
 * Every driver is an OPTIONAL peer dependency, loaded on demand — install only
 * the one your database uses (`@libsql/client`, `postgres`, or `@electric-sql/pglite`).
 */
export async function createDb(config: CreateDbConfig): Promise<ApexDbHandle> {
  return withShutdownHook(await openDb(config))
}

/**
 * Register the handle's `close` as a server shutdown hook (the `apex start` SIGTERM drain runs
 * it — see @apex-stack/core/server `onShutdown`), via the shared globalThis registry so no core
 * import (and no two-copies-of-core skew) is needed. Closing the handle yourself deregisters the
 * hook first, so a manual close (e.g. a test harness) never double-closes the pool. No-op
 * on-device (a mobile app has no process signals).
 */
function withShutdownHook(handle: ApexDbHandle): ApexDbHandle {
  const g = globalThis as {
    __APEX_DEVICE__?: boolean
    __APEX_SHUTDOWN_HOOKS__?: Set<() => unknown>
  }
  if (g.__APEX_DEVICE__) return handle
  g.__APEX_SHUTDOWN_HOOKS__ ??= new Set()
  const hooks = g.__APEX_SHUTDOWN_HOOKS__
  const realClose = handle.close.bind(handle)
  const hook = () => realClose()
  hooks.add(hook)
  handle.close = async () => {
    hooks.delete(hook)
    await realClose()
  }
  return handle
}

async function openDb(config: CreateDbConfig): Promise<ApexDbHandle> {
  const cfg = typeof config === 'string' ? ({ driver: 'libsql', url: config } as const) : config

  if (cfg.driver === 'sqlite' || cfg.driver === 'libsql') {
    // On-device (mobile bundle): the native @libsql/client driver can't run on a bare
    // engine, so transparently use the WASM sql.js backend. App code is unchanged.
    if ((globalThis as { __APEX_DEVICE__?: boolean }).__APEX_DEVICE__) {
      const { createDeviceSqlite } = await import('./device.js')
      return createDeviceSqlite()
    }
    const { createClient } = (await loadDriver('@libsql/client')) as LibsqlMod
    const { drizzle } = await import('drizzle-orm/libsql')
    const client = createClient({ url: libsqlUrl(cfg.url) })
    const db = drizzle(client)
    return {
      db,
      dialect: 'sqlite',
      exec: async (sql, params) => {
        if (params) await client.execute({ sql, args: params as never })
        else await client.executeMultiple(sql)
      },
      query: async (sql, params) =>
        (await client.execute(params ? { sql, args: params as never } : sql)).rows as Array<
          Record<string, unknown>
        >,
      transaction: (fn) => db.transaction(async (tx) => fn(txHandle(tx, 'sqlite'))),
      close: async () => {
        client.close()
      },
    }
  }

  if (cfg.driver === 'postgres') {
    const postgres = ((await loadDriver('postgres')) as PostgresMod).default
    const { drizzle } = await import('drizzle-orm/postgres-js')
    const client = postgres(cfg.url, postgresOptions(cfg.url, cfg.options))
    const db = drizzle(client)
    return {
      db,
      dialect: 'postgres',
      exec: async (sql, params) => {
        if (params) await client.unsafe(toPgPlaceholders(sql), params as never)
        else await client.unsafe(sql)
      },
      query: async (sql, params) =>
        (await (params
          ? client.unsafe(toPgPlaceholders(sql), params as never)
          : client.unsafe(sql))) as unknown as Array<Record<string, unknown>>,
      transaction: (fn) => db.transaction(async (tx) => fn(txHandle(tx, 'postgres'))),
      close: async () => {
        await client.end()
      },
    }
  }

  // pglite — embedded Postgres (great for local dev and tests).
  const { PGlite } = (await loadDriver('@electric-sql/pglite')) as PgliteMod
  const { drizzle } = await import('drizzle-orm/pglite')
  // No dir → in-memory (memory://); a dir persists to disk.
  const client = new PGlite((cfg as { dir?: string }).dir ?? 'memory://')
  const db = drizzle(client)
  return {
    db,
    dialect: 'postgres',
    exec: async (sql, params) => {
      if (params) await client.query(toPgPlaceholders(sql), params as never[])
      else await client.exec(sql)
    },
    query: async (sql, params) =>
      (await (params ? client.query(toPgPlaceholders(sql), params as never[]) : client.query(sql)))
        .rows as Array<Record<string, unknown>>,
    transaction: (fn) => db.transaction(async (tx) => fn(txHandle(tx, 'postgres'))),
    close: async () => {
      await client.close()
    },
  }
}

const MIGRATIONS_TABLE =
  'CREATE TABLE IF NOT EXISTS _apex_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)'

/**
 * Split a migration into its `up` and `down` SQL. Everything before a `-- @down`
 * marker line is the up (an optional leading `-- @up` line is stripped); everything
 * after is the down. A file with no `-- @down` marker is up-only (not reversible).
 */
export function parseMigration(sql: string): { up: string; down: string } {
  const parts = sql.split(/^[ \t]*--[ \t]*@down[ \t]*$/im)
  const up = (parts[0] ?? '').replace(/^[ \t]*--[ \t]*@up[ \t]*$/im, '').trim()
  const down = parts.slice(1).join('\n').trim()
  return { up, down }
}

/**
 * Apply pending `*.sql` migrations from `dir`, tracked in `_apex_migrations`.
 * Idempotent; runs each file's `up` section once in filename order. Works on any
 * dialect. Reverse with `rollbackMigrations`.
 */
export async function applyMigrations(handle: ApexDbHandle, dir: string): Promise<string[]> {
  // No migrations dir (e.g. a bundled server where migrations run via `apex migrate`
  // as a deploy step) → nothing to do, don't crash on boot.
  if (!existsSync(dir)) return []
  await handle.exec(MIGRATIONS_TABLE)
  const applied = new Set(
    (await handle.query('SELECT name FROM _apex_migrations')).map((r) => r.name as string),
  )
  const done: string[] = []
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    if (applied.has(file)) continue
    const { up } = parseMigration(readFileSync(join(dir, file), 'utf8'))
    if (up) await handle.exec(up)
    const at = new Date().toISOString()
    await handle.exec(
      `INSERT INTO _apex_migrations (name, applied_at) VALUES ('${file.replace(/'/g, "''")}', '${at}')`,
    )
    done.push(file)
  }
  return done
}

/**
 * Roll back the last `steps` applied migrations (most recent first), running each
 * file's `-- @down` section and un-recording it in `_apex_migrations`. Stops at the
 * first migration that can't be reversed (no `-- @down`, or the file is gone) so
 * migrations are never undone out of order — that name is returned in `blocked`.
 */
export async function rollbackMigrations(
  handle: ApexDbHandle,
  dir: string,
  steps = 1,
): Promise<{ reverted: string[]; blocked: string | null }> {
  await handle.exec(MIGRATIONS_TABLE)
  const rows = await handle.query('SELECT name, applied_at FROM _apex_migrations')
  // Most recent first: applied_at desc, then filename desc (files carry a sortable
  // timestamp prefix, so this is a stable tiebreak within the same second).
  rows.sort(
    (a, b) =>
      String(b.applied_at).localeCompare(String(a.applied_at)) ||
      String(b.name).localeCompare(String(a.name)),
  )
  const reverted: string[] = []
  for (const row of rows.slice(0, steps)) {
    const name = row.name as string
    const file = join(dir, name)
    const down = existsSync(file) ? parseMigration(readFileSync(file, 'utf8')).down : ''
    if (!down) return { reverted, blocked: name } // not reversible → stop, keep order
    await handle.exec(down)
    await handle.exec(`DELETE FROM _apex_migrations WHERE name = '${name.replace(/'/g, "''")}'`)
    reverted.push(name)
  }
  return { reverted, blocked: null }
}

/** The five CRUD operations a resource exposes. */
export type ResourceOp = 'list' | 'get' | 'create' | 'update' | 'delete'

/**
 * How an operation is gated: open to all (`'public'`), any authenticated caller
 * (`'authed'`), or a predicate on the user + validated input.
 */
export type AccessRule =
  | 'public'
  | 'authed'
  | ((ctx: { user: ApexUser | null; input: unknown }) => boolean | Promise<boolean>)

/** A single rule applied to every op, or a per-op map. */
export type AccessMap = AccessRule | Partial<Record<ResourceOp, AccessRule>>

/**
 * A row filter derived from the caller, applied to EVERY op — injected as a WHERE
 * on list/get/update/delete and stamped onto create — so a caller only ever sees
 * or touches rows matching it (row-level security). E.g. `({ user }) => ({ ownerId:
 * user.id })`.
 */
export type ScopeFn = (ctx: { user: ApexUser | null }) => Record<string, unknown>

export interface DefineResourceOptions {
  db: any
  /** A Drizzle table (from `drizzle-orm/sqlite-core` or `…/pg-core`). */
  table: any
  /** Zod raw shape validating the create payload. */
  insert: ZodRawShape
  /** Primary-key column name. Defaults to `id`. */
  pk?: string
  /**
   * Per-operation authorization. Once set (or once `scope` is set), the resource is
   * gated: any op you don't list defaults to `'authed'` — you can't half-secure a
   * resource and leave, say, `delete` open. Omit both `access` and `scope` for a
   * fully public resource.
   */
  access?: AccessMap
  /** Row-level scope applied to every op (see {@link ScopeFn}). Implies gating. */
  scope?: ScopeFn
  /** Lifecycle hooks (from model behaviors) run around create/update/delete. */
  hooks?: BehaviorHooks[]
  /** Extra WHERE conditions (from behaviors) applied to every read/write. */
  filters?: FilterFn[]
  /** If set, DELETE soft-deletes by stamping this column instead of removing the row. */
  softDelete?: string
  /** Columns stripped from every response (list/get/create/update) — e.g. `password`, `secret`. */
  hidden?: string[]
  /** The full db handle — passed to hooks (e.g. `auditable` writes a companion table). */
  handle?: ApexDbHandle
}

const isRule = (x: unknown): x is AccessRule => typeof x === 'string' || typeof x === 'function'

/**
 * Turn one table into a REST + MCP resource (list/get/create/update/delete),
 * each also an MCP tool. Dialect-agnostic — the same definition works whether
 * `db` is backed by SQLite, Turso, Supabase, Neon, or embedded PGlite.
 *
 * `access` gates each op (reusing the route auth/can gate) and `scope` filters rows
 * per caller — both enforced identically over REST and MCP.
 */
export function defineResource(name: string, opts: DefineResourceOptions): ApexResource {
  const { db, table, insert, pk = 'id' } = opts
  // One shared write/read pipeline (hooks, scope, filters, softDelete) — the same
  // instance the model's active-record layer uses, so REST/MCP and Model.* behave
  // identically. See repository.ts.
  const repo = repository({
    name,
    db,
    table,
    pk,
    scope: opts.scope,
    filters: opts.filters ?? [],
    softDelete: opts.softDelete,
    hooks: opts.hooks ?? [],
    handle: opts.handle,
  })
  const pkCol = repo.pkCol

  // Strip `hidden` columns (password/secret) from every response — REST + MCP.
  const hiddenCols = new Set(opts.hidden ?? [])
  const strip = <T extends Record<string, unknown> | null>(r: T): T => {
    if (!r || !hiddenCols.size) return r
    const o = { ...r }
    for (const k of hiddenCols) delete o[k]
    return o as T
  }

  // Gating posture: declaring `access` or `scope` opts the whole resource in;
  // an unlisted op then defaults to 'authed' (fail-closed), never public.
  const gated = opts.access !== undefined || opts.scope !== undefined
  const accessAll = isRule(opts.access) ? opts.access : undefined
  const accessMap = (opts.access && !isRule(opts.access) ? opts.access : {}) as Partial<
    Record<ResourceOp, AccessRule>
  >

  /** Map an op's access rule → a route gate ({ auth?, can? }) understood by core. */
  function gate(op: ResourceOp): {
    auth?: boolean
    can?: (ctx: { user: ApexUser | null; input: unknown }) => boolean | Promise<boolean>
  } {
    const rule = accessMap[op] ?? accessAll ?? (gated ? 'authed' : 'public')
    if (rule === 'public') return {}
    if (rule === 'authed') return { auth: true }
    // A predicate implies an authenticated caller (row-level checks assume a user).
    return { auth: true, can: rule }
  }

  const updateShape: Record<string, unknown> = { id: z.coerce.number() }
  for (const [key, schema] of Object.entries(
    insert as unknown as Record<string, { optional(): unknown }>,
  )) {
    updateShape[key] = schema.optional()
  }

  // List query params: pagination + sort + per-column equality filters — also exposed on the
  // `_list` MCP tool, so an AI can page/filter too. Backward-compatible: with no page/perPage,
  // list returns a plain array; with either, a `{ data, total, page, perPage, lastPage }` envelope.
  const MAX_PER_PAGE = 100
  const listInput: Record<string, unknown> = {
    page: z.coerce.number().int().min(1).optional(),
    perPage: z.coerce.number().int().min(1).max(MAX_PER_PAGE).optional(),
    sort: z.string().optional(),
  }
  for (const [key, schema] of Object.entries(
    insert as unknown as Record<string, { optional(): unknown }>,
  )) {
    listInput[key] = schema.optional()
  }

  return {
    __apexResource: true,
    name,
    routes: [
      {
        pathSuffix: '',
        mcpName: `${name}_list`,
        route: defineApexRoute({
          method: 'GET',
          description: `List ${name} — supports ?page & ?perPage (→ {data,total,…}), ?sort=-col, and ?<col>=value filters`,
          input: listInput as ZodRawShape,
          mcp: true,
          ...gate('list'),
          handler: async ({ input, user }) => {
            const q = (input ?? {}) as Record<string, unknown>
            const conds = repo.scopeConds(user ?? null)
            // Per-column equality filters (only over the model's own columns).
            for (const key of Object.keys(insert)) {
              const v = q[key]
              if (v !== undefined && v !== '') conds.push(eq(table[key], v))
            }
            const where = conds.length ? and(...conds) : undefined
            // Sort: `?sort=-createdAt,name` (leading `-` = desc). Columns validated via the table.
            const orders: SQL[] = []
            if (typeof q.sort === 'string' && q.sort) {
              for (const part of q.sort.split(',')) {
                const dir = part.startsWith('-')
                const col = part.replace(/^[-+]/, '').trim()
                const c = table[col]
                if (c && typeof c === 'object') orders.push(dir ? desc(c) : asc(c))
              }
            }
            const build = () => {
              let sel = db.select().from(table)
              if (where) sel = sel.where(where)
              if (orders.length) sel = sel.orderBy(...orders)
              return sel
            }
            // No pagination requested → a plain array (backward-compatible).
            if (q.page === undefined && q.perPage === undefined) {
              const rows = await build()
              await repo.runAfterList(rows, user ?? null)
              return rows.map(strip)
            }
            const page = Number(q.page ?? 1)
            const perPage = Number(q.perPage ?? 25)
            const data = await build()
              .limit(perPage)
              .offset((page - 1) * perPage)
            const totalQ = db.select({ n: sql<number>`count(*)` }).from(table)
            const totalRows = where ? await totalQ.where(where) : await totalQ
            const total = Number((totalRows[0] as { n: unknown } | undefined)?.n ?? 0)
            await repo.runAfterList(data, user ?? null)
            return {
              data: data.map(strip),
              total,
              page,
              perPage,
              lastPage: Math.max(1, Math.ceil(total / perPage)),
            }
          },
        }),
      },
      {
        pathSuffix: '/:id',
        mcpName: `${name}_get`,
        route: defineApexRoute({
          method: 'GET',
          description: `Get ${name} by id`,
          input: { id: z.coerce.number() },
          mcp: true,
          ...gate('get'),
          handler: async ({ input, user }) => {
            const id = (input as { id: number }).id
            const row =
              (
                await db
                  .select()
                  .from(table)
                  .where(and(eq(pkCol, id), ...repo.scopeConds(user ?? null)))
              )[0] ?? null
            await repo.runAfterGet(row, id, user ?? null)
            return strip(row)
          },
        }),
      },
      {
        pathSuffix: '',
        mcpName: `${name}_create`,
        route: defineApexRoute({
          method: 'POST',
          description: `Create ${name}`,
          input: insert,
          mcp: true,
          ...gate('create'),
          handler: async ({ input, user }) =>
            strip(await repo.create(input as Record<string, unknown>, user ?? null)),
        }),
      },
      {
        pathSuffix: '/:id',
        mcpName: `${name}_update`,
        route: defineApexRoute({
          method: 'PATCH',
          description: `Update ${name} by id (partial)`,
          input: updateShape as ZodRawShape,
          mcp: true,
          ...gate('update'),
          handler: async ({ input, user }) => {
            const { id, ...fields } = input as { id: number } & Record<string, unknown>
            return strip(await repo.update(eq(pkCol, id), fields, user ?? null, id))
          },
        }),
      },
      {
        pathSuffix: '/:id',
        mcpName: `${name}_delete`,
        route: defineApexRoute({
          method: 'DELETE',
          description: `Delete ${name} by id`,
          input: { id: z.coerce.number() },
          mcp: true,
          ...gate('delete'),
          handler: async ({ input, user }) => {
            const id = (input as { id: number }).id
            return strip(await repo.remove(eq(pkCol, id), user ?? null, id))
          },
        }),
      },
    ],
  }
}
