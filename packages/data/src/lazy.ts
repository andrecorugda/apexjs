// A lazily-initialized database handle — created without `await`, so it can live at a
// module's top level in environments that forbid top-level await (notably the classic-script
// `apex build --mobile` bundle, evaluated by a bare on-device engine). The real connection is
// opened + seeded on first use.
//
// It presents the same `ApexDbHandle` shape as `createDb`:
//   • `dialect` is known synchronously (derived from the driver) — `defineResource` needs it
//     at build time to pick the sqlite/postgres table.
//   • `exec`/`query`/`close` await initialization internally.
//   • `db` is a deferred Drizzle proxy: builder chains (`db.select().from(t).where(…)`) are
//     recorded and replayed against the real Drizzle instance when the chain is awaited — which
//     only ever happens inside async request handlers, after init can complete.
import { type ApexDbHandle, type CreateDbConfig, createDb, type Dialect } from './index.js'

/** Driver → Drizzle dialect, resolved synchronously from the config. */
function dialectOf(config: CreateDbConfig): Dialect {
  const driver = typeof config === 'string' ? 'libsql' : config.driver
  return driver === 'postgres' || driver === 'pglite' ? 'postgres' : 'sqlite'
}

type Step = { prop: string | symbol; args: unknown[] }

/** A Proxy that records a method chain and executes it on the real Drizzle db when awaited. */
function deferredChain(getReal: () => Promise<ApexDbHandle>, steps: Step[]): unknown {
  const run = async () => {
    let cur: unknown = (await getReal()).db
    for (const s of steps) {
      const fn = (cur as Record<string, ((...a: unknown[]) => unknown) | undefined>)[
        s.prop as string
      ]
      if (typeof fn !== 'function') {
        throw new TypeError(`lazyDb: db.${String(s.prop)} is not a function`)
      }
      // `fn.call(cur, …)` keeps `this` bound to the receiver — Drizzle's builders rely on
      // `this.session`, so the method must not be detached from its object.
      cur = fn.call(cur, ...s.args)
    }
    return await (cur as Promise<unknown>)
  }
  return new Proxy(() => {}, {
    get(_t, prop) {
      // Awaiting the chain (or .catch/.finally) runs it; .execute() is drizzle's explicit form.
      if (prop === 'then')
        return (onF: unknown, onR: unknown) => run().then(onF as never, onR as never)
      if (prop === 'catch') return (onR: unknown) => run().catch(onR as never)
      if (prop === 'finally') return (onEnd: unknown) => run().finally(onEnd as never)
      if (prop === 'execute') return () => run()
      // Any other property extends the chain (e.g. .from, .where, .values, .returning, .set).
      return (...args: unknown[]) => deferredChain(getReal, [...steps, { prop, args }])
    },
  })
}

/** The `db` facade: each top-level Drizzle method starts a fresh deferred chain. */
function deferredDb(getReal: () => Promise<ApexDbHandle>): unknown {
  return new Proxy(
    {},
    {
      get(_t, prop) {
        return (...args: unknown[]) => deferredChain(getReal, [{ prop, args }])
      },
    },
  )
}

export interface LazyDbOptions {
  /** Run once, right after the connection opens — migrate + seed here (has the real handle). */
  init?: (handle: ApexDbHandle) => Promise<void> | void
}

/**
 * Open a database lazily. `config` may be a value or a thunk (evaluated once, synchronously).
 *
 * ```ts
 * export const handle = lazyDb(
 *   () => process.env.DATABASE_URL
 *     ? { driver: 'postgres', url: process.env.DATABASE_URL }
 *     : { driver: 'libsql', url: ':memory:' },
 *   { init: async (h) => { await h.exec(Message.migrationSql(h.dialect)); …seed… } },
 * )
 * ```
 */
export function lazyDb(
  config: CreateDbConfig | (() => CreateDbConfig),
  opts: LazyDbOptions = {},
): ApexDbHandle {
  const resolved = typeof config === 'function' ? config() : config
  let ready: Promise<ApexDbHandle> | null = null
  const ensure = (): Promise<ApexDbHandle> => {
    if (!ready) {
      ready = (async () => {
        const h = await createDb(resolved)
        await opts.init?.(h)
        return h
      })()
    }
    return ready
  }

  return {
    db: deferredDb(ensure),
    dialect: dialectOf(resolved),
    exec: async (sql, params) => {
      await (await ensure()).exec(sql, params)
    },
    query: async (sql, params) => (await ensure()).query(sql, params),
    close: async () => {
      if (ready) await (await ready).close()
    },
  }
}
