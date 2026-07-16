// query.ts — the active-record query API on defineModel (P1), built on the Drizzle
// query builder (`handle.db`) and the shared `repository()` write pipeline.
//
// Reads go through Drizzle's typed builder (operators, ordering, pagination, aggregates;
// bool/JSON columns hydrate automatically). Writes go through `repository()` — the SAME
// pipeline REST/MCP uses — so `Model.create/update/delete` fire hooks (timestamps,
// observers, audit), apply row-level `scope`, hide/stamp soft-deletes, and validate the
// payload. Column names are validated against the model's fields (a typo throws — never
// an injection vector); values are bound by Drizzle. `raw('plays + 1')` is the trusted
// SQL-expression escape hatch. Works identically on sqlite (incl. on-device sql.js) and
// Postgres.

import type { ApexUser } from '@apex-stack/core'
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  notInArray,
  or,
  type SQL,
  sql,
} from 'drizzle-orm'
import { z } from 'zod'
import type { BehaviorHooks, FilterFn } from './behavior.js'
import type { ApexDbHandle, Dialect, ScopeFn } from './index.js'
import type { FieldDef } from './model.js'
import { type Repo, repository } from './repository.js'

export type Row = Record<string, unknown>

/** A raw SQL expression: `{ plays: raw('plays + 1') }`. Trusted code only — never user input. */
export class Raw {
  constructor(readonly sql: string) {}
}
/** Wrap a SQL expression so it's inlined, not bound. Trusted code only. */
export const raw = (sql: string): Raw => new Raw(sql)

/** Comparison operators for a column filter (`where({ plays: { gt: 10 } })`). */
export interface Op {
  eq?: unknown
  ne?: unknown
  gt?: unknown
  gte?: unknown
  lt?: unknown
  lte?: unknown
  like?: string
  in?: readonly unknown[]
  notIn?: readonly unknown[]
  isNull?: boolean
}
/** A per-column filter: a scalar (equality), `null` (IS NULL), or an operator object. */
export type Cond = unknown | Op | null
export type WhereConds = Record<string, Cond | undefined>
/** A column→value map for writes; a value may be a `raw()` SQL expression. */
export type Values = Record<string, unknown | Raw>
/** Options for `upsert`. `keep` picks max/min per column on conflict instead of overwrite. */
export interface UpsertOptions {
  keep?: Record<string, 'max' | 'min'>
}
/** Per-call options: `user` drives row-level `scope` isolation (null/omitted = trusted). */
export interface QueryOpts {
  user?: ApexUser | null
}

/** What defineModel hands the active-record layer (composed once at model definition). */
export interface ModelArConfig {
  name: string
  pk: string
  fields: Record<string, FieldDef>
  table: (dialect: Dialect) => any
  scope?: ScopeFn
  filters: FilterFn[]
  softDelete?: string
  hooks: BehaviorHooks[]
  insertShape: Record<string, z.ZodTypeAny>
  /** Named, reusable query scopes: `Model.scope('published').all(h)`. */
  scopes?: Record<string, (qb: QueryBuilder, ...args: any[]) => QueryBuilder>
}

const OP_KEYS = new Set(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'like', 'in', 'notIn', 'isNull'])

function isOp(v: unknown): v is Op {
  if (v === null || typeof v !== 'object' || Array.isArray(v) || v instanceof Raw) return false
  const keys = Object.keys(v)
  return keys.length > 0 && keys.every((k) => OP_KEYS.has(k))
}

/** Turn one column filter into a Drizzle condition. */
function condFor(col: any, spec: Cond): SQL | undefined {
  if (spec === null) return isNull(col)
  if (spec instanceof Raw) return sql`${col} ${sql.raw(spec.sql)}`
  if (isOp(spec)) {
    const parts: SQL[] = []
    if ('eq' in spec) parts.push(spec.eq === null ? isNull(col) : eq(col, spec.eq))
    if ('ne' in spec) parts.push(ne(col, spec.ne))
    if ('gt' in spec) parts.push(gt(col, spec.gt))
    if ('gte' in spec) parts.push(gte(col, spec.gte))
    if ('lt' in spec) parts.push(lt(col, spec.lt))
    if ('lte' in spec) parts.push(lte(col, spec.lte))
    if (spec.like !== undefined) parts.push(like(col, spec.like))
    if (spec.in !== undefined) parts.push(inArray(col, spec.in as unknown[]))
    if (spec.notIn !== undefined) parts.push(notInArray(col, spec.notIn as unknown[]))
    if (spec.isNull !== undefined) parts.push(spec.isNull ? isNull(col) : isNotNull(col))
    return parts.length > 1 ? and(...parts) : parts[0]
  }
  return eq(col, spec)
}

/** Per-handle bound context: the dialect table, the shared repo, and the valid column set. */
interface Bound {
  table: any
  repo: Repo
  cols: Set<string>
}

function assertCol(cols: Set<string>, col: string): void {
  if (!cols.has(col)) {
    throw new Error(
      `[apex] unknown column '${col}' on model — known columns: ${[...cols].join(', ')}`,
    )
  }
}

/** Convert write values → a Drizzle-ready object: validate plain cols, inline raw() exprs. */
function prepareWrite(
  values: Values,
  cols: Set<string>,
  shape: Record<string, z.ZodTypeAny>,
  partial: boolean,
): Record<string, unknown> {
  const plain: Record<string, unknown> = {}
  const rawCols: Record<string, Raw> = {}
  for (const [k, v] of Object.entries(values)) {
    assertCol(cols, k)
    if (v instanceof Raw) rawCols[k] = v
    else plain[k] = v
  }
  // Validate the non-raw payload against the model's shape (mass-assignment safety:
  // unknown keys are stripped, invalid values throw — same guarantee as REST/MCP).
  const zobj = z.object(shape)
  const parsed = (partial ? zobj.partial() : zobj).parse(plain) as Record<string, unknown>
  const out: Record<string, unknown> = { ...parsed }
  for (const [k, r] of Object.entries(rawCols)) out[k] = sql.raw(r.sql)
  return out
}

/** A chainable SELECT/DELETE builder. Terminals take the db handle (+ optional `{ user }`). */
export class QueryBuilder {
  private wheres: WhereConds[] = []
  private ors: WhereConds[] = []
  private orders: Array<{ col: string; dir: 'asc' | 'desc' }> = []
  private lim?: number
  private off?: number

  constructor(private cfg: ModelArConfig) {}

  where(conds: WhereConds): this {
    this.wheres.push(conds)
    return this
  }
  orWhere(conds: WhereConds): this {
    this.ors.push(conds)
    return this
  }
  orderBy(col: string, dir: 'asc' | 'desc' = 'asc'): this {
    this.orders.push({ col, dir })
    return this
  }
  limit(n: number): this {
    this.lim = Math.trunc(n)
    return this
  }
  offset(n: number): this {
    this.off = Math.trunc(n)
    return this
  }

  private conds(b: Bound, user: ApexUser | null): SQL | undefined {
    const all: SQL[] = [...b.repo.scopeConds(user)]
    for (const w of this.wheres) {
      for (const [k, v] of Object.entries(w)) {
        if (v === undefined) continue
        assertCol(b.cols, k)
        const c = condFor(b.table[k], v)
        if (c) all.push(c)
      }
    }
    if (this.ors.length) {
      const groups: SQL[] = []
      for (const o of this.ors) {
        const ps: SQL[] = []
        for (const [k, v] of Object.entries(o)) {
          if (v === undefined) continue
          assertCol(b.cols, k)
          const c = condFor(b.table[k], v)
          if (c) ps.push(c)
        }
        if (ps.length) groups.push(ps.length > 1 ? (and(...ps) as SQL) : (ps[0] as SQL))
      }
      if (groups.length) all.push(groups.length > 1 ? (or(...groups) as SQL) : (groups[0] as SQL))
    }
    return all.length ? and(...all) : undefined
  }

  private bound(handle: ApexDbHandle): Bound {
    return bindModel(this.cfg, handle)
  }

  async all(handle: ApexDbHandle, opts?: QueryOpts): Promise<Row[]> {
    const b = this.bound(handle)
    let q = handle.db.select().from(b.table)
    const w = this.conds(b, opts?.user ?? null)
    if (w) q = q.where(w)
    if (this.orders.length) {
      q = q.orderBy(
        ...this.orders.map((o) => (o.dir === 'desc' ? desc(b.table[o.col]) : asc(b.table[o.col]))),
      )
    }
    if (this.lim !== undefined) q = q.limit(this.lim)
    if (this.off !== undefined) q = q.offset(this.off)
    return (await q) as Row[]
  }

  async first(handle: ApexDbHandle, opts?: QueryOpts): Promise<Row | null> {
    this.lim = 1
    return (await this.all(handle, opts))[0] ?? null
  }

  async count(handle: ApexDbHandle, opts?: QueryOpts): Promise<number> {
    const b = this.bound(handle)
    const w = this.conds(b, opts?.user ?? null)
    let q = handle.db.select({ n: sql<number>`count(*)` }).from(b.table)
    if (w) q = q.where(w)
    const r = (await q) as Array<{ n: unknown }>
    return Number(r[0]?.n ?? 0)
  }

  async exists(handle: ApexDbHandle, opts?: QueryOpts): Promise<boolean> {
    return (await this.count(handle, opts)) > 0
  }

  private async agg(
    handle: ApexDbHandle,
    fn: 'sum' | 'avg' | 'min' | 'max',
    col: string,
    opts?: QueryOpts,
  ): Promise<number | null> {
    const b = this.bound(handle)
    assertCol(b.cols, col)
    const w = this.conds(b, opts?.user ?? null)
    let q = handle.db.select({ v: sql<number>`${sql.raw(fn)}(${b.table[col]})` }).from(b.table)
    if (w) q = q.where(w)
    const r = (await q) as Array<{ v: unknown }>
    return r[0]?.v == null ? null : Number(r[0].v)
  }
  sum(handle: ApexDbHandle, col: string, opts?: QueryOpts) {
    return this.agg(handle, 'sum', col, opts)
  }
  avg(handle: ApexDbHandle, col: string, opts?: QueryOpts) {
    return this.agg(handle, 'avg', col, opts)
  }
  min(handle: ApexDbHandle, col: string, opts?: QueryOpts) {
    return this.agg(handle, 'min', col, opts)
  }
  max(handle: ApexDbHandle, col: string, opts?: QueryOpts) {
    return this.agg(handle, 'max', col, opts)
  }

  async pluck(handle: ApexDbHandle, col: string, opts?: QueryOpts): Promise<unknown[]> {
    const b = this.bound(handle)
    assertCol(b.cols, col)
    const rows = await this.all(handle, opts)
    return rows.map((r) => r[col])
  }

  /** Bulk delete matching rows; returns the count. Honors soft-delete; bypasses per-row hooks. */
  async delete(handle: ApexDbHandle, opts?: QueryOpts): Promise<number> {
    const b = this.bound(handle)
    return b.repo.bulkRemove(this.conds(b, opts?.user ?? null))
  }
}

const tableCaches = new WeakMap<ModelArConfig, Map<Dialect, any>>()

function bindModel(cfg: ModelArConfig, handle: ApexDbHandle): Bound {
  let cache = tableCaches.get(cfg)
  if (!cache) {
    cache = new Map()
    tableCaches.set(cfg, cache)
  }
  let table = cache.get(handle.dialect)
  if (!table) {
    table = cfg.table(handle.dialect)
    cache.set(handle.dialect, table)
  }
  const repo = repository({
    name: cfg.name,
    db: handle.db,
    table,
    pk: cfg.pk,
    scope: cfg.scope,
    filters: cfg.filters,
    softDelete: cfg.softDelete,
    hooks: cfg.hooks,
    handle,
  })
  return { table, repo, cols: new Set([cfg.pk, ...Object.keys(cfg.fields)]) }
}

/** Attach the active-record statics to a model object (mutates and returns it). */
export function attachActiveRecord<T extends object>(model: T, cfg: ModelArConfig): T {
  const qb = (): QueryBuilder => new QueryBuilder(cfg)

  const create = async (handle: ApexDbHandle, values: Values, opts?: QueryOpts): Promise<Row> => {
    const b = bindModel(cfg, handle)
    const data = prepareWrite(values, b.cols, cfg.insertShape, false)
    return b.repo.create(data, opts?.user ?? null)
  }

  const update = async (
    handle: ApexDbHandle,
    id: unknown,
    values: Values,
    opts?: QueryOpts,
  ): Promise<Row | null> => {
    const b = bindModel(cfg, handle)
    const data = prepareWrite(values, b.cols, cfg.insertShape, true)
    return b.repo.update(eq(b.table[cfg.pk], id), data, opts?.user ?? null, id as number)
  }

  const insertMany = async (
    handle: ApexDbHandle,
    rows: Values[],
    opts?: QueryOpts,
  ): Promise<Row[]> => {
    if (!rows.length) return []
    const b = bindModel(cfg, handle)
    const scope = cfg.scope?.({ user: opts?.user ?? null }) ?? {}
    const data = rows.map((r) => ({ ...prepareWrite(r, b.cols, cfg.insertShape, false), ...scope }))
    return (await handle.db.insert(b.table).values(data).returning()) as Row[]
  }

  const updateMany = async (
    handle: ApexDbHandle,
    conds: WhereConds,
    values: Values,
    opts?: QueryOpts,
  ): Promise<number> => {
    const b = bindModel(cfg, handle)
    const all: SQL[] = [...b.repo.scopeConds(opts?.user ?? null)]
    for (const [k, v] of Object.entries(conds)) {
      if (v === undefined) continue
      assertCol(b.cols, k)
      const c = condFor(b.table[k], v)
      if (c) all.push(c)
    }
    const data = prepareWrite(values, b.cols, cfg.insertShape, true)
    const rows = await handle.db
      .update(b.table)
      .set(data)
      .where(all.length ? and(...all) : undefined)
      .returning()
    return (rows as unknown[]).length
  }

  const methods = {
    all: (handle: ApexDbHandle, opts?: QueryOpts) => qb().all(handle, opts),
    insertMany,
    updateMany,
    first: (handle: ApexDbHandle, opts?: QueryOpts) => qb().orderBy(cfg.pk, 'asc').first(handle, opts),
    find: (handle: ApexDbHandle, id: unknown, opts?: QueryOpts) =>
      qb().where({ [cfg.pk]: id }).first(handle, opts),
    where: (conds: WhereConds) => qb().where(conds),
    orderBy: (col: string, dir?: 'asc' | 'desc') => qb().orderBy(col, dir),
    scope: (name: string, ...args: unknown[]): QueryBuilder => {
      const fn = cfg.scopes?.[name]
      if (!fn) throw new Error(`[apex] unknown scope '${name}' on model '${cfg.name}'`)
      return fn(qb(), ...args)
    },
    count: (handle: ApexDbHandle, conds?: WhereConds, opts?: QueryOpts) =>
      (conds ? qb().where(conds) : qb()).count(handle, opts),
    exists: (handle: ApexDbHandle, conds?: WhereConds, opts?: QueryOpts) =>
      (conds ? qb().where(conds) : qb()).exists(handle, opts),
    delete: (handle: ApexDbHandle, conds: WhereConds, opts?: QueryOpts) =>
      qb().where(conds).delete(handle, opts),
    create,
    update,
    updateOrCreate: async (
      handle: ApexDbHandle,
      match: WhereConds,
      values: Values,
      opts?: QueryOpts,
    ): Promise<Row> => {
      const existing = await qb().where(match).first(handle, opts)
      if (existing) {
        const updated = await update(handle, existing[cfg.pk], values, opts)
        return updated ?? existing
      }
      return create(handle, { ...(match as Values), ...values }, opts)
    },
    upsert: async (
      handle: ApexDbHandle,
      conflictKeys: string[],
      values: Values,
      opts?: UpsertOptions,
    ): Promise<Row | null> => {
      const b = bindModel(cfg, handle)
      for (const k of conflictKeys) assertCol(b.cols, k)
      const data = prepareWrite(values, b.cols, cfg.insertShape, false)
      const keep = opts?.keep ?? {}
      const set: Record<string, unknown> = {}
      for (const col of Object.keys(values)) {
        if (conflictKeys.includes(col)) continue
        const mode = keep[col]
        if (mode) {
          const fn =
            handle.dialect === 'sqlite' ? mode : mode === 'max' ? 'GREATEST' : 'LEAST'
          set[col] = sql`${sql.raw(fn)}(${b.table[col]}, ${sql.raw(`excluded.${col}`)})`
        } else {
          set[col] = sql`${sql.raw(`excluded.${col}`)}`
        }
      }
      const target = conflictKeys.map((k) => b.table[k])
      const base = handle.db.insert(b.table).values(data)
      const stmt =
        Object.keys(set).length > 0
          ? base.onConflictDoUpdate({ target, set })
          : base.onConflictDoNothing({ target })
      const rows = (await stmt.returning()) as Row[]
      return rows[0] ?? null
    },
  }

  return Object.assign(model, methods)
}
