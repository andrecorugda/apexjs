// Model behaviors ("traits") — composable descriptors that augment a model once and
// flow to every surface. A behavior contributes any of: fields, an insert-shape tweak
// (server-managed columns), lifecycle hooks, a row-level scope, and per-op access.
// They fold into the model's effective spec inside defineModel, and their
// hooks/scope/access ride into defineResource — enforced identically over REST + MCP.
// See docs/architecture/auth.md §8.
import type { ApexUser } from '@apex-stack/core'
import { isNull, type SQL } from 'drizzle-orm'
import type { AccessMap, AccessRule, ApexDbHandle, ResourceOp, ScopeFn } from './index.js'
import type { Fields } from './model.js'

/** Context handed to lifecycle hooks. `data` is mutable in `before*` hooks. */
export interface HookCtx {
  op: 'create' | 'update' | 'delete' | 'list' | 'get'
  /** The authenticated user (or null). */
  user: ApexUser | null
  /** Create/update values — mutate in `before*` to add server-managed columns. */
  data: Record<string, unknown>
  /** The affected row — present in `after*` write hooks and `afterGet`. */
  row?: Record<string, unknown>
  /** The result rows — present in `afterList`. */
  rows?: Record<string, unknown>[]
  /** Target id — present for update/delete/get. */
  id?: number
  /** The Drizzle db instance + table for this model. */
  db: unknown
  table: unknown
  /** The resource/model name (e.g. for a companion `<name>_audit` table). */
  name: string
  /** The full db handle (`exec`/`query`/`dialect`) — for companion-table writes. */
  handle?: ApexDbHandle
}

type Hook = (ctx: HookCtx) => void | Promise<void>

export interface BehaviorHooks {
  beforeCreate?: Hook
  afterCreate?: Hook
  beforeUpdate?: Hook
  afterUpdate?: Hook
  beforeDelete?: Hook
  afterDelete?: Hook
  afterList?: Hook
  afterGet?: Hook
}

/** Extra Drizzle WHERE conditions a behavior injects into every read/write. */
export type FilterFn = (args: { user: ApexUser | null; table: any }) => SQL | SQL[] | undefined

/** A composable model trait. Author your own or use a built-in below. */
export interface Behavior {
  name: string
  /** Extra columns merged into the model (collision with a declared field = error). */
  fields?: Fields
  /** Columns to drop from the create payload (server-managed, e.g. timestamps). */
  omitFromInsert?: string[]
  /** Per-op access contribution (combined most-restrictive-wins with the model's). */
  access?: AccessMap
  /** Row-level scope contribution (AND-combined with the model's + other behaviors'). */
  scope?: ScopeFn
  /** Extra WHERE conditions for non-equality filters (e.g. `IS NULL`). */
  filter?: FilterFn
  /**
   * Turn delete into a soft delete: DELETE becomes an UPDATE stamping this column with
   * the current time. Only one behavior may set it.
   */
  softDelete?: string
  /** Lifecycle hooks (run in behavior order, before the model's own effect). */
  hooks?: BehaviorHooks
}

const OPS: ResourceOp[] = ['list', 'get', 'create', 'update', 'delete']
const isRule = (x: unknown): x is AccessRule => typeof x === 'string' || typeof x === 'function'

/** Normalize an AccessMap to a per-op lookup. */
function asMap(a: AccessMap | undefined): Partial<Record<ResourceOp, AccessRule>> {
  if (a === undefined) return {}
  if (isRule(a)) return Object.fromEntries(OPS.map((op) => [op, a]))
  return a
}

/** Combine access rules for one op, most-restrictive-wins (predicate > authed > public). */
function combineOp(rules: AccessRule[]): AccessRule | undefined {
  const preds = rules.filter(
    (r): r is Extract<AccessRule, (...a: never[]) => unknown> => typeof r === 'function',
  )
  if (preds.length) {
    // AND every predicate (an implicitly-authed gate).
    return async (ctx: { user: ApexUser | null; input: unknown }) => {
      for (const p of preds) if (!(await p(ctx))) return false
      return true
    }
  }
  if (rules.includes('authed')) return 'authed'
  if (rules.includes('public')) return 'public'
  return undefined
}

export interface ComposedSpec {
  fields: Fields
  omitFromInsert: string[]
  access?: AccessMap
  scope?: ScopeFn
  filters: FilterFn[]
  softDelete?: string
  hooks: BehaviorHooks[]
}

/**
 * Fold `behaviors` together with the model's own `fields`/`access`/`scope` into one
 * effective spec. Deterministic + fail-closed: fields merge (collision → throw),
 * scopes AND-combine, access is most-restrictive-wins, hooks run in array order.
 */
export function composeBehaviors(
  behaviors: Behavior[],
  own: { fields: Fields; access?: AccessMap; scope?: ScopeFn },
): ComposedSpec {
  // Fields — behaviors first, then the model's own; any duplicate key is an error.
  const fields: Fields = {}
  const claim = (source: string, f: Fields) => {
    for (const [key, def] of Object.entries(f)) {
      if (key in fields)
        throw new Error(`Behavior field collision: "${key}" is defined more than once (${source}).`)
      fields[key] = def
    }
  }
  for (const b of behaviors) if (b.fields) claim(`behavior "${b.name}"`, b.fields)
  claim('the model', own.fields)

  const omitFromInsert = behaviors.flatMap((b) => b.omitFromInsert ?? [])

  // Access — gather each op's rules from all sources, combine most-restrictive.
  const maps = [...behaviors.map((b) => asMap(b.access)), asMap(own.access)]
  const accessEntries = OPS.map(
    (op) => [op, combineOp(maps.flatMap((m) => m[op] ?? []))] as const,
  ).filter(([, rule]) => rule !== undefined)
  const access = accessEntries.length
    ? (Object.fromEntries(accessEntries) as Partial<Record<ResourceOp, AccessRule>>)
    : undefined

  // Scope — AND-combine by merging each source's filter object.
  const scopeFns = [...behaviors.map((b) => b.scope), own.scope].filter(
    (s): s is ScopeFn => typeof s === 'function',
  )
  const scope: ScopeFn | undefined = scopeFns.length
    ? (ctx) => Object.assign({}, ...scopeFns.map((s) => s(ctx)))
    : undefined

  const filters = behaviors
    .map((b) => b.filter)
    .filter((f): f is FilterFn => typeof f === 'function')

  const softDeleters = behaviors.filter((b) => b.softDelete)
  if (softDeleters.length > 1)
    throw new Error('Only one behavior may set `softDelete` (found more than one).')
  const softDelete = softDeleters[0]?.softDelete

  const hooks = behaviors.map((b) => b.hooks).filter((h): h is BehaviorHooks => !!h)

  return { fields, omitFromInsert, access, scope, filters, softDelete, hooks }
}

// ── Built-in behaviors ───────────────────────────────────────────────────────

/** `created_at` / `updated_at`, server-stamped on write (never client-settable). */
export function timestamps(opts?: { createdAt?: string; updatedAt?: string }): Behavior {
  const c = opts?.createdAt ?? 'created_at'
  const u = opts?.updatedAt ?? 'updated_at'
  return {
    name: 'timestamps',
    fields: { [c]: 'timestamp', [u]: 'timestamp' },
    omitFromInsert: [c, u],
    hooks: {
      beforeCreate: (ctx) => {
        const now = new Date().toISOString()
        ctx.data[c] = now
        ctx.data[u] = now
      },
      beforeUpdate: (ctx) => {
        ctx.data[u] = new Date().toISOString()
      },
    },
  }
}

/**
 * Row-level ownership: scopes every op to the caller's rows and stamps the owner on
 * create (unspoofable). Requires an authenticated user — the auth `access`/`scope`
 * of Phase C, packaged as a reusable trait.
 */
export function owned(column = 'ownerId'): Behavior {
  return {
    name: 'owned',
    access: 'authed',
    scope: ({ user }) => ({ [column]: (user as { id?: unknown } | null)?.id }),
  }
}

/**
 * Attach lifecycle hooks (fire identically over REST and MCP). Each hook receives a
 * single {@link HookCtx} — destructure what you need:
 *
 * ```ts
 * observable({
 *   beforeCreate: ({ data, user }) => { data.slug = slugify(data.title) },
 *   afterCreate:  ({ row }) => notify(row),
 *   afterList:    ({ rows }) => metric('list', rows?.length),
 * })
 * ```
 *
 * `before*` hooks may mutate `ctx.data` or throw to veto the op; `after*` hooks are
 * best-effort side-effects (a throw is logged, never failing the committed write).
 */
export function observable(hooks: BehaviorHooks): Behavior {
  return { name: 'observable', hooks }
}

// SQL string literal (doubles single quotes; NULL for nullish). standard_conforming_strings
// is on by default in Postgres and SQLite doesn't process backslash escapes, so this is safe.
const lit = (v: unknown): string => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
const numLit = (v: unknown): string => (v == null ? 'NULL' : String(Number(v)))

/**
 * Audit trail: logs every create/update/delete to a companion `<name>_audit` table
 * (`row_id`, `action`, `actor_id` from `ctx.user`, `changes` JSON, `at`). The table is
 * auto-provisioned (`CREATE TABLE IF NOT EXISTS`) on first write. Because it rides the
 * same dispatch path, it logs an AI's MCP tool calls exactly like a browser's writes.
 */
export function auditable(opts?: { table?: string }): Behavior {
  let ensured = false
  const auditTable = (ctx: HookCtx) => opts?.table ?? `${ctx.name}_audit`

  const ensure = async (ctx: HookCtx): Promise<void> => {
    if (ensured || !ctx.handle) return
    const sqlite = ctx.handle.dialect === 'sqlite'
    const idType = sqlite ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'SERIAL PRIMARY KEY'
    const jsonType = sqlite ? 'TEXT' : 'JSONB'
    await ctx.handle.exec(
      `CREATE TABLE IF NOT EXISTS ${auditTable(ctx)} (` +
        `id ${idType}, row_id INTEGER, action TEXT NOT NULL, ` +
        `actor_id TEXT, changes ${jsonType}, at TEXT NOT NULL)`,
    )
    ensured = true
  }

  const write =
    (action: string) =>
    async (ctx: HookCtx): Promise<void> => {
      if (!ctx.handle) return
      await ensure(ctx)
      const rowId = (ctx.row as { id?: number } | undefined)?.id ?? ctx.id ?? null
      const actor = (ctx.user as { id?: unknown } | null)?.id ?? null
      const changes = action === 'delete' ? '{}' : JSON.stringify(ctx.data ?? {})
      await ctx.handle.exec(
        `INSERT INTO ${auditTable(ctx)} (row_id, action, actor_id, changes, at) VALUES (` +
          `${numLit(rowId)}, ${lit(action)}, ${lit(actor)}, ${lit(changes)}, ${lit(new Date().toISOString())})`,
      )
    }

  return {
    name: 'auditable',
    hooks: {
      afterCreate: write('create'),
      afterUpdate: write('update'),
      afterDelete: write('delete'),
    },
  }
}

/**
 * Soft delete: adds a nullable `deleted_at`, turns DELETE into a timestamp stamp, and
 * hides soft-deleted rows from every read/write (a `deleted_at IS NULL` filter). The
 * row stays in the table — restore it by clearing the column.
 */
export function softDeletes(column = 'deleted_at'): Behavior {
  return {
    name: 'softDeletes',
    fields: { [column]: 'timestamp' },
    omitFromInsert: [column], // server-managed — a client can't create a pre-deleted row
    filter: ({ table }) => isNull(table[column]),
    softDelete: column,
  }
}
