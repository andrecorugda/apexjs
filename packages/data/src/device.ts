// On-device SQLite backend — an in-memory SQLite (sql.js) that runs inside a bare JS engine
// (androidx.javascriptengine / a WebView isolate) with no native driver, no filesystem, and no
// host callout. This powers DB-backed pages/APIs in an `apex build --mobile` bundle: the same
// app code (`createDb({ driver: 'libsql', … })`) transparently uses this backend when the mobile
// runtime sets `globalThis.__APEX_DEVICE__`.
//
// It uses sql.js's **asm.js** build (pure JS), NOT the WASM build: androidx.javascriptengine's
// sandboxed V8 can't compile WebAssembly (it SIGSEGVs), and QuickJS/Hermes lack WASM entirely.
// asm.js is plain JavaScript, so it runs on every engine — and it never instantiates WASM even
// when a (possibly broken) `WebAssembly` global is present.
//
// Constraint: in-memory only (seeded at boot, reset on cold start) — the engine has no
// persistent store to attach to. True persistence is a later native/WebView-storage step.
import type { ApexDbHandle } from './index.js'

// Minimal shapes for the optional `sql.js` peer (avoids a hard type dependency).
interface SqlJsDatabase {
  run(sql: string, params?: readonly unknown[]): void
  exec(sql: string, params?: readonly unknown[]): Array<{ columns: string[]; values: unknown[][] }>
  export(): Uint8Array
  close(): void
}
interface SqlJsStatic {
  Database: new (data?: Uint8Array) => SqlJsDatabase
}
type InitSqlJs = (config?: Record<string, unknown>) => Promise<SqlJsStatic>

/**
 * Open an in-memory sql.js (asm.js) database wrapped as an {@link ApexDbHandle}.
 *
 * Persistence seam (used by the mobile shell to survive cold starts): if the host set
 * `globalThis.__APEX_DB_SNAPSHOT__` (base64 of a prior `db.export()`), the database is restored
 * from it instead of starting empty; and `globalThis.__APEX_DB_EXPORT__()` is exposed so the
 * host can read the current bytes back out (base64) and persist them. Both are no-ops off-device.
 */
export async function createDeviceSqlite(): Promise<ApexDbHandle> {
  let initSqlJs: InitSqlJs
  try {
    // The asm.js build is self-contained JS (no .wasm) and works on any engine.
    // @ts-expect-error — sql.js subpath has no bundled type declarations.
    const mod = (await import('sql.js/dist/sql-asm.js')) as { default?: InitSqlJs } & InitSqlJs
    initSqlJs = (mod.default ?? mod) as InitSqlJs
  } catch {
    throw new Error(
      '@apex-stack/data: the on-device SQLite backend needs "sql.js". Install it (`npm i sql.js`) — it is bundled automatically by `apex build --mobile`.',
    )
  }

  const SQL = await initSqlJs({})
  const g = globalThis as {
    __APEX_DB_SNAPSHOT__?: string
    __APEX_DB_EXPORT__?: () => string
  }
  // Restore a persisted snapshot (base64) if the host provided one, else start empty.
  const snapshot = typeof g.__APEX_DB_SNAPSHOT__ === 'string' ? g.__APEX_DB_SNAPSHOT__ : undefined
  const database = snapshot
    ? new SQL.Database(Uint8Array.from(Buffer.from(snapshot, 'base64')))
    : new SQL.Database()
  // Let the host read the current DB bytes back out to persist them.
  g.__APEX_DB_EXPORT__ = () => Buffer.from(database.export()).toString('base64')
  const { drizzle } = await import('drizzle-orm/sql-js')

  const handle: ApexDbHandle = {
    db: drizzle(database as never),
    dialect: 'sqlite',
    exec: async (sql, params) => {
      // With params it's one parameterized statement; without, sql.js runs all statements.
      database.run(sql, params)
    },
    query: async (sql, params) => {
      const res = database.exec(sql, params)
      if (!res.length) return []
      const { columns, values } = res[0] as { columns: string[]; values: unknown[][] }
      return values.map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i]])))
    },
    // sql.js is synchronous and single-connection, and Drizzle's sql-js `.transaction()` runs
    // COMMIT before an async callback settles (so it can't roll back on a later throw). Drive
    // the transaction manually with BEGIN/COMMIT/ROLLBACK on the one connection instead — the
    // same handle is the tx handle (AR/db writes on it run between BEGIN and COMMIT). No nesting.
    transaction: async (fn) => {
      database.run('BEGIN')
      try {
        const result = await fn(handle)
        database.run('COMMIT')
        return result
      } catch (e) {
        database.run('ROLLBACK')
        throw e
      }
    },
    close: async () => {
      database.close()
    },
  }
  return handle
}
