// Model behaviors ("traits") — composable descriptors that augment a model once and
// flow to every surface. A behavior contributes any of: fields, an insert-shape tweak
// (server-managed columns), lifecycle hooks, a row-level scope, and per-op access.
// They fold into the model's effective spec inside defineModel, and their
// hooks/scope/access ride into defineResource — enforced identically over REST + MCP.
// See AUTH_DESIGN.md §8.
import type { ApexUser } from '@apex-stack/core'
import type { AccessMap, AccessRule, ResourceOp, ScopeFn } from './index.js'
import type { Fields } from './model.js'

/** Context handed to lifecycle hooks. `data` is mutable in `before*` hooks. */
export interface HookCtx {
  op: 'create' | 'update' | 'delete'
  /** The authenticated user (or null). */
  user: ApexUser | null
  /** Create/update values — mutate in `before*` to add server-managed columns. */
  data: Record<string, unknown>
  /** The affected row — present in `after*` hooks. */
  row?: Record<string, unknown>
  /** Target id — present for update/delete. */
  id?: number
  /** The Drizzle db handle + table (for companion writes, e.g. an audit table). */
  db: unknown
  table: unknown
}

type Hook = (ctx: HookCtx) => void | Promise<void>

export interface BehaviorHooks {
  beforeCreate?: Hook
  afterCreate?: Hook
  beforeUpdate?: Hook
  afterUpdate?: Hook
  beforeDelete?: Hook
  afterDelete?: Hook
}

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

  const hooks = behaviors.map((b) => b.hooks).filter((h): h is BehaviorHooks => !!h)

  return { fields, omitFromInsert, access, scope, hooks }
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

/** Attach lifecycle hooks (fire identically over REST and MCP). */
export function observable(hooks: BehaviorHooks): Behavior {
  return { name: 'observable', hooks }
}
