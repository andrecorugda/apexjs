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
  run(sql: string): void
  exec(sql: string): Array<{ columns: string[]; values: unknown[][] }>
  close(): void
}
interface SqlJsStatic {
  Database: new () => SqlJsDatabase
}
type InitSqlJs = (config?: Record<string, unknown>) => Promise<SqlJsStatic>

/** Open an in-memory sql.js (asm.js) database wrapped as an {@link ApexDbHandle}. */
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
  const database = new SQL.Database()
  const { drizzle } = await import('drizzle-orm/sql-js')

  return {
    db: drizzle(database as never),
    dialect: 'sqlite',
    exec: async (sql) => {
      database.run(sql)
    },
    query: async (sql) => {
      const res = database.exec(sql)
      if (!res.length) return []
      const { columns, values } = res[0] as { columns: string[]; values: unknown[][] }
      return values.map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i]])))
    },
    close: async () => {
      database.close()
    },
  }
}
