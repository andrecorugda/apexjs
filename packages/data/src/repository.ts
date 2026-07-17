// repository.ts — the ONE write/read pipeline shared by `defineResource` (REST/MCP)
// and the active-record layer on `defineModel` (P1). Hooks (timestamps, auditable,
// observable, …), row-level `scope`, behavior `filters` (e.g. soft-delete's
// `deleted_at IS NULL`), and `softDelete` all live here exactly once — so
// `Model.create/update/delete` fire them identically to a REST or MCP call.
//
// It operates through the Drizzle query builder on `handle.db` (works on every
// backend incl. on-device sql.js), never raw SQL strings.

import type { ApexUser } from '@apex-stack/core'
import { and, eq, type SQL } from 'drizzle-orm'
import type { BehaviorHooks, FilterFn, HookCtx } from './behavior.js'
import { guard } from './errors.js'
import type { ApexDbHandle, ScopeFn } from './index.js'

/** Everything the pipeline needs, composed once per model. */
export interface RepoConfig {
  name: string
  db: any
  table: any
  pk: string
  scope?: ScopeFn
  filters: FilterFn[]
  softDelete?: string
  hooks: BehaviorHooks[]
  handle?: ApexDbHandle
}

/** The shared pipeline. `user` drives `scope`/`access` isolation (null = trusted/admin). */
export interface Repo {
  /** The Drizzle primary-key column. */
  pkCol: any
  /** Row conditions for a caller: equality `scope` + behavior `filters` (soft-delete etc.). */
  scopeConds(user: ApexUser | null): SQL[]
  /** `scopeConds` combined with an extra predicate into one WHERE (or undefined). */
  where(extra: SQL | undefined, user: ApexUser | null): SQL | undefined
  create(input: Record<string, unknown>, user: ApexUser | null): Promise<Record<string, unknown>>
  update(
    extra: SQL | undefined,
    fields: Record<string, unknown>,
    user: ApexUser | null,
    id?: number,
  ): Promise<Record<string, unknown> | null>
  remove(
    extra: SQL | undefined,
    user: ApexUser | null,
    id?: number,
  ): Promise<Record<string, unknown> | null>
  /** Bulk delete over a fully-built WHERE (soft-delete aware); returns rows affected. No per-row hooks. */
  bulkRemove(where: SQL | undefined): Promise<number>
  runAfterList(rows: Record<string, unknown>[], user: ApexUser | null): Promise<void>
  runAfterGet(row: Record<string, unknown> | null, id: number, user: ApexUser | null): Promise<void>
}

export function repository(cfg: RepoConfig): Repo {
  const { db, table, name, scope, filters, softDelete, hooks } = cfg
  const pkCol = table[cfg.pk]

  // Hook context. db/table/handle are non-enumerable so a user hook doing
  // `JSON.stringify(ctx)` doesn't choke on Drizzle's circular refs.
  type CtxBase = Omit<HookCtx, 'db' | 'table' | 'handle' | 'name'>
  const mkCtx = (base: CtxBase): HookCtx => {
    const ctx = { ...base, name } as HookCtx
    Object.defineProperties(ctx, {
      db: { value: db, enumerable: false, configurable: true },
      table: { value: table, enumerable: false, configurable: true },
      handle: { value: cfg.handle, enumerable: false, configurable: true },
    })
    return ctx
  }

  // after* hooks are best-effort side-effects: the write already committed, so a
  // throw is logged and swallowed rather than failing a successful op.
  const runAfter = async (
    key: 'afterCreate' | 'afterUpdate' | 'afterDelete' | 'afterList' | 'afterGet',
    ctx: HookCtx,
  ): Promise<void> => {
    for (const h of hooks) {
      try {
        await h[key]?.(ctx)
      } catch (e) {
        console.warn(
          `[apex] ${key} failed (the ${ctx.op} already succeeded): ${(e as Error)?.message ?? e}`,
        )
      }
    }
  }

  const scopeConds = (user: ApexUser | null): SQL[] => {
    const c: SQL[] = scope ? Object.entries(scope({ user })).map(([k, v]) => eq(table[k], v)) : []
    for (const f of filters) {
      const r = f({ user, table })
      if (r) c.push(...(Array.isArray(r) ? r : [r]))
    }
    return c
  }

  const where = (extra: SQL | undefined, user: ApexUser | null): SQL | undefined => {
    const parts = [extra, ...scopeConds(user)].filter((p): p is SQL => p !== undefined)
    return parts.length ? and(...parts) : undefined
  }

  return {
    pkCol,
    scopeConds,
    where,

    async create(input, user) {
      return guard(name, 'create', async () => {
        // Stamp the caller's scope onto the row (owner can't be spoofed via input).
        const data = { ...input, ...(scope?.({ user }) ?? {}) }
        const ctx = mkCtx({ op: 'create', user, data })
        for (const h of hooks) await h.beforeCreate?.(ctx)
        const row = (
          await db
            .insert(table)
            .values(ctx.data as never)
            .returning()
        )[0]
        ctx.row = row
        await runAfter('afterCreate', ctx)
        return row
      })
    },

    async update(extra, fields, user, id) {
      return guard(name, 'update', async () => {
        // Never let a caller reassign a scoped column (e.g. change ownerId).
        for (const k of Object.keys(scope?.({ user }) ?? {})) delete fields[k]
        const ctx = mkCtx({ op: 'update', user, data: fields, id })
        for (const h of hooks) await h.beforeUpdate?.(ctx)
        const row =
          (await db.update(table).set(ctx.data).where(where(extra, user)).returning())[0] ?? null
        if (row) {
          ctx.row = row
          await runAfter('afterUpdate', ctx)
        }
        return row
      })
    },

    async remove(extra, user, id) {
      return guard(name, 'delete', async () => {
        const ctx = mkCtx({ op: 'delete', user, data: {}, id })
        for (const h of hooks) await h.beforeDelete?.(ctx)
        const w = where(extra, user)
        // Soft delete stamps a column; hard delete removes the row.
        const row = softDelete
          ? ((
              await db
                .update(table)
                .set({ [softDelete]: new Date().toISOString() })
                .where(w)
                .returning()
            )[0] ?? null)
          : ((await db.delete(table).where(w).returning())[0] ?? null)
        if (row) {
          ctx.row = row
          await runAfter('afterDelete', ctx)
        }
        return row
      })
    },

    async bulkRemove(w) {
      return guard(name, 'delete', async () => {
        const rows = softDelete
          ? await db
              .update(table)
              .set({ [softDelete]: new Date().toISOString() })
              .where(w)
              .returning()
          : await db.delete(table).where(w).returning()
        return (rows as unknown[]).length
      })
    },

    async runAfterList(rows, user) {
      if (hooks.length) await runAfter('afterList', mkCtx({ op: 'list', user, data: {}, rows }))
    },
    async runAfterGet(row, id, user) {
      if (row && hooks.length)
        await runAfter('afterGet', mkCtx({ op: 'get', user, data: {}, row, id }))
    },
  }
}
