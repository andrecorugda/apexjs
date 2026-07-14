// On-device SQLite backend — a pure-WASM SQLite (sql.js) that runs inside a bare
// JS engine (androidx.javascriptengine / a WebView isolate) with no native driver,
// no filesystem, and no host callout. This is what powers DB-backed pages/APIs in an
// `apex build --mobile` bundle: the same app code (`createDb({ driver: 'libsql', … })`)
// transparently uses this backend when the mobile runtime sets `globalThis.__APEX_DEVICE__`.
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
type InitSqlJs = (config: { wasmBinary: Uint8Array }) => Promise<SqlJsStatic>

/**
 * Resolve the sql.js wasm bytes. On device the mobile bundler injects them as
 * `globalThis.__APEX_SQLJS_WASM__` (base64 string, decoded with the runtime's Buffer
 * shim); off device (Node — tests, `apex dev`) we read them from the installed package.
 */
async function loadWasmBinary(): Promise<Uint8Array> {
  const injected = (globalThis as { __APEX_SQLJS_WASM__?: string | Uint8Array }).__APEX_SQLJS_WASM__
  if (injected) {
    return typeof injected === 'string'
      ? Uint8Array.from(Buffer.from(injected, 'base64'))
      : injected
  }
  // Node path — never reached in the mobile bundle (injected is always set there).
  const { createRequire } = await import('node:module')
  const require = createRequire(import.meta.url)
  const { readFileSync } = await import('node:fs')
  return new Uint8Array(readFileSync(require.resolve('sql.js/dist/sql-wasm.wasm')))
}

/** Open an in-memory sql.js database wrapped as an {@link ApexDbHandle}. */
export async function createDeviceSqlite(): Promise<ApexDbHandle> {
  let initSqlJs: InitSqlJs
  try {
    // @ts-expect-error — sql.js is an optional peer with no bundled type declarations.
    const mod = (await import('sql.js')) as { default?: InitSqlJs } & InitSqlJs
    initSqlJs = (mod.default ?? mod) as InitSqlJs
  } catch {
    throw new Error(
      '@apex-stack/data: the on-device SQLite backend needs "sql.js". Install it (`npm i sql.js`) — it is bundled automatically by `apex build --mobile`.',
    )
  }

  const SQL = await initSqlJs({ wasmBinary: await loadWasmBinary() })
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
