import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { type ApexResource, defineApexRoute } from '@apex-stack/core'
import { eq } from 'drizzle-orm'
import { z, type ZodRawShape } from 'zod'

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

/**
 * Open a database and wrap it with Drizzle behind a driver-agnostic handle.
 * All drivers use Drizzle's async query API, so `defineResource` works unchanged
 * across SQLite (libSQL/Turso), Postgres (Supabase/Neon) and embedded PGlite.
 * Postgres/PGlite drivers are loaded on demand — install only what you use.
 */
export async function createDb(config: CreateDbConfig): Promise<ApexDbHandle> {
  const cfg = typeof config === 'string' ? ({ driver: 'libsql', url: config } as const) : config

  if (cfg.driver === 'sqlite' || cfg.driver === 'libsql') {
    const { createClient } = await import('@libsql/client')
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
    const postgres = (await import('postgres')).default
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
  const { PGlite } = await import('@electric-sql/pglite')
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

/**
 * Apply pending `*.sql` migrations from `dir`, tracked in `_apex_migrations`.
 * Idempotent; runs each file once in filename order. Works on any dialect.
 */
export async function applyMigrations(handle: ApexDbHandle, dir: string): Promise<string[]> {
  // No migrations dir (e.g. a bundled server where migrations run via `apex migrate`
  // as a deploy step) → nothing to do, don't crash on boot.
  if (!existsSync(dir)) return []
  await handle.exec(
    'CREATE TABLE IF NOT EXISTS _apex_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)',
  )
  const applied = new Set(
    (await handle.query('SELECT name FROM _apex_migrations')).map((r) => r.name as string),
  )
  const done: string[] = []
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    if (applied.has(file)) continue
    await handle.exec(readFileSync(join(dir, file), 'utf8'))
    const at = new Date().toISOString()
    await handle.exec(
      `INSERT INTO _apex_migrations (name, applied_at) VALUES ('${file.replace(/'/g, "''")}', '${at}')`,
    )
    done.push(file)
  }
  return done
}

export interface DefineResourceOptions {
  db: any
  /** A Drizzle table (from `drizzle-orm/sqlite-core` or `…/pg-core`). */
  table: any
  /** Zod raw shape validating the create payload. */
  insert: ZodRawShape
  /** Primary-key column name. Defaults to `id`. */
  pk?: string
}

/**
 * Turn one table into a REST + MCP resource (list/get/create/update/delete),
 * each also an MCP tool. Dialect-agnostic — the same definition works whether
 * `db` is backed by SQLite, Turso, Supabase, Neon, or embedded PGlite.
 */
export function defineResource(name: string, opts: DefineResourceOptions): ApexResource {
  const { db, table, insert, pk = 'id' } = opts
  const pkCol = table[pk]

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
          description: `List all ${name}`,
          mcp: true,
          handler: async () => await db.select().from(table),
        }),
      },
      {
        pathSuffix: '/:id',
        mcpName: `${name}_get`,
        route: defineApexRoute({
          method: 'GET',
          description: `Get a single ${name} by id`,
          input: { id: z.coerce.number() },
          mcp: true,
          handler: async ({ input }) =>
            (await db.select().from(table).where(eq(pkCol, (input as { id: number }).id)))[0] ?? null,
        }),
      },
      {
        pathSuffix: '',
        mcpName: `${name}_create`,
        route: defineApexRoute({
          method: 'POST',
          description: `Create a ${name}`,
          input: insert,
          mcp: true,
          handler: async ({ input }) =>
            (await db.insert(table).values(input as never).returning())[0],
        }),
      },
      {
        pathSuffix: '/:id',
        mcpName: `${name}_update`,
        route: defineApexRoute({
          method: 'PATCH',
          description: `Update a ${name} by id (partial)`,
          input: updateShape as ZodRawShape,
          mcp: true,
          handler: async ({ input }) => {
            const { id, ...fields } = input as { id: number } & Record<string, unknown>
            return (await db.update(table).set(fields).where(eq(pkCol, id)).returning())[0] ?? null
          },
        }),
      },
      {
        pathSuffix: '/:id',
        mcpName: `${name}_delete`,
        route: defineApexRoute({
          method: 'DELETE',
          description: `Delete a ${name} by id`,
          input: { id: z.coerce.number() },
          mcp: true,
          handler: async ({ input }) =>
            (await db.delete(table).where(eq(pkCol, (input as { id: number }).id)).returning())[0] ??
            null,
        }),
      },
    ],
  }
}
