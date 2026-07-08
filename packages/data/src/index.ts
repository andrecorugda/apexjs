import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { type ApexResource, type ApexUser, defineApexRoute } from '@apex-stack/core'
import { and, eq, type SQL } from 'drizzle-orm'
import { type ZodRawShape, z } from 'zod'

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

export type Dialect = 'sqlite' | 'postgres'

/** A driver-agnostic database handle. `db` is a Drizzle instance (async API). */
export interface ApexDbHandle {
  db: any
  dialect: Dialect
  /** Run raw SQL (one or more statements). */
  exec(sql: string): Promise<void>
  /** Run a query and return rows. */
  query(sql: string): Promise<Array<Record<string, unknown>>>
  close(): Promise<void>
}

export type CreateDbConfig =
  | string // shorthand: a SQLite file path (libSQL), e.g. "data.db"
  | { driver: 'sqlite' | 'libsql'; url: string } // local file (file:…) or Turso (libsql://…)
  | { driver: 'postgres'; url: string } // Supabase / Neon / any Postgres
  | { driver: 'pglite'; dir?: string } // embedded Postgres (in-memory if no dir)

function libsqlUrl(pathOrUrl: string): string {
  return /^(file:|libsql:|https?:|:memory:)/.test(pathOrUrl) ? pathOrUrl : `file:${pathOrUrl}`
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
  const cfg = typeof config === 'string' ? ({ driver: 'libsql', url: config } as const) : config

  if (cfg.driver === 'sqlite' || cfg.driver === 'libsql') {
    const { createClient } = (await loadDriver('@libsql/client')) as LibsqlMod
    const { drizzle } = await import('drizzle-orm/libsql')
    const client = createClient({ url: libsqlUrl(cfg.url) })
    return {
      db: drizzle(client),
      dialect: 'sqlite',
      exec: async (sql) => {
        await client.executeMultiple(sql)
      },
      query: async (sql) => (await client.execute(sql)).rows as Array<Record<string, unknown>>,
      close: async () => {
        client.close()
      },
    }
  }

  if (cfg.driver === 'postgres') {
    const postgres = ((await loadDriver('postgres')) as PostgresMod).default
    const { drizzle } = await import('drizzle-orm/postgres-js')
    const client = postgres(cfg.url)
    return {
      db: drizzle(client),
      dialect: 'postgres',
      exec: async (sql) => {
        await client.unsafe(sql)
      },
      query: async (sql) => (await client.unsafe(sql)) as unknown as Array<Record<string, unknown>>,
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
  return {
    db: drizzle(client),
    dialect: 'postgres',
    exec: async (sql) => {
      await client.exec(sql)
    },
    query: async (sql) => (await client.query(sql)).rows as Array<Record<string, unknown>>,
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
  const { db, table, insert, pk = 'id', scope } = opts
  const pkCol = table[pk]

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

  /** Drizzle WHERE conditions for the caller's scope (empty when no scope). */
  function scopeConds(user: ApexUser | null): SQL[] {
    if (!scope) return []
    return Object.entries(scope({ user })).map(([k, v]) => eq(table[k], v))
  }
  /** Combine the pk match with scope conditions (so id-guessing can't cross scopes). */
  function whereId(id: number, user: ApexUser | null) {
    return and(eq(pkCol, id), ...scopeConds(user))
  }

  const updateShape: Record<string, unknown> = { id: z.coerce.number() }
  for (const [key, schema] of Object.entries(
    insert as unknown as Record<string, { optional(): unknown }>,
  )) {
    updateShape[key] = schema.optional()
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
          description: `List ${name}`,
          mcp: true,
          ...gate('list'),
          handler: async ({ user }) => {
            const conds = scopeConds(user ?? null)
            const q = db.select().from(table)
            return conds.length ? await q.where(and(...conds)) : await q
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
          handler: async ({ input, user }) =>
            (
              await db
                .select()
                .from(table)
                .where(whereId((input as { id: number }).id, user ?? null))
            )[0] ?? null,
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
          handler: async ({ input, user }) => {
            // Stamp the caller's scope onto the row (owner can't be spoofed via input).
            const values = {
              ...(input as Record<string, unknown>),
              ...(scope?.({ user: user ?? null }) ?? {}),
            }
            return (
              await db
                .insert(table)
                .values(values as never)
                .returning()
            )[0]
          },
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
            // Never let a caller reassign a scoped column (e.g. change ownerId).
            for (const k of Object.keys(scope?.({ user: user ?? null }) ?? {})) delete fields[k]
            return (
              (
                await db
                  .update(table)
                  .set(fields)
                  .where(whereId(id, user ?? null))
                  .returning()
              )[0] ?? null
            )
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
          handler: async ({ input, user }) =>
            (
              await db
                .delete(table)
                .where(whereId((input as { id: number }).id, user ?? null))
                .returning()
            )[0] ?? null,
        }),
      },
    ],
  }
}
