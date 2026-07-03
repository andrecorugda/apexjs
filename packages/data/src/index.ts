import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { type ApexResource, defineApexRoute } from 'apexjs-core'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import { z, type ZodRawShape } from 'zod'

export type ApexDb = ReturnType<typeof drizzle>

/** Open a SQLite database and wrap it with Drizzle. */
export function createDb(path: string): { db: ApexDb; sqlite: Database.Database } {
  const sqlite = new Database(path)
  sqlite.pragma('journal_mode = WAL')
  return { db: drizzle(sqlite), sqlite }
}

/**
 * Apply pending `*.sql` migrations from `dir`, tracked in `_apex_migrations`.
 * Idempotent: each file runs once, in filename order, inside a transaction.
 * Returns the names of migrations applied this run.
 */
export function applyMigrations(sqlite: Database.Database, dir: string): string[] {
  sqlite.exec(
    'CREATE TABLE IF NOT EXISTS _apex_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)',
  )
  const applied = new Set(
    sqlite.prepare('SELECT name FROM _apex_migrations').all().map((r) => (r as { name: string }).name),
  )
  const done: string[] = []
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    if (applied.has(file)) continue
    const sql = readFileSync(join(dir, file), 'utf8')
    const at = new Date().toISOString()
    sqlite.transaction(() => {
      sqlite.exec(sql)
      sqlite.prepare('INSERT INTO _apex_migrations (name, applied_at) VALUES (?, ?)').run(file, at)
    })()
    done.push(file)
  }
  return done
}

export interface DefineResourceOptions {
  db: ApexDb
  /** A Drizzle table. */
  table: any
  /** Zod raw shape validating the create payload. */
  insert: ZodRawShape
  /** Primary-key column name. Defaults to `id`. */
  pk?: string
}

/**
 * Turn one table into a REST + MCP resource: `list`, `get`, and `create` routes,
 * each also an MCP tool. This is the moat — your data is AI-callable by construction.
 *   GET  /api/<name>        → list
 *   GET  /api/<name>/:id    → get
 *   POST /api/<name>        → create
 */
export function defineResource(name: string, opts: DefineResourceOptions): ApexResource {
  const { db, table, insert, pk = 'id' } = opts
  const pkCol = table[pk]

  // Update accepts the id plus any subset of the create fields.
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
          handler: () => db.select().from(table).all(),
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
          handler: ({ input }) =>
            db.select().from(table).where(eq(pkCol, (input as { id: number }).id)).get() ?? null,
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
          handler: ({ input }) => db.insert(table).values(input as never).returning().get(),
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
          handler: ({ input }) => {
            const { id, ...fields } = input as { id: number } & Record<string, unknown>
            return db.update(table).set(fields).where(eq(pkCol, id)).returning().get() ?? null
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
          handler: ({ input }) =>
            db.delete(table).where(eq(pkCol, (input as { id: number }).id)).returning().get() ?? null,
        }),
      },
    ],
  }
}
