// defineModel — a single source of truth for a data model.
//
// One field spec derives everything: a Drizzle table (per dialect), zod
// insert/update validation, the CREATE TABLE migration SQL, and a REST + MCP
// resource (via defineResource). Devs write the shape once instead of hand-wiring
// a Drizzle table + zod schema + resource separately.

import type { ApexResource } from '@apex-stack/core'
import {
  doublePrecision,
  jsonb,
  boolean as pgBoolean,
  integer as pgInteger,
  pgTable,
  text as pgText,
  serial,
  timestamp,
} from 'drizzle-orm/pg-core'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'
import { type Behavior, composeBehaviors } from './behavior.js'
import {
  type AccessMap,
  type ApexDbHandle,
  type Dialect,
  defineResource,
  type ScopeFn,
} from './index.js'
import type { Collection } from './collection.js'
import {
  attachActiveRecord,
  type ModelInstance,
  type QueryBuilder,
  type QueryOpts,
  type Row,
  type UpsertOptions,
  type Values,
  type WhereConds,
} from './query.js'

export type FieldType = 'string' | 'text' | 'int' | 'float' | 'boolean' | 'timestamp' | 'json'

export interface FieldDef {
  type: FieldType
  notNull?: boolean
  unique?: boolean
  default?: unknown
  /** Create a single-column index on this column (real apps need FKs/filters indexed). */
  index?: boolean
  /** Foreign key: this column references `table`(`column`, default the pk `id`). */
  references?: {
    table: string
    column?: string
    onDelete?: 'cascade' | 'restrict' | 'set null' | 'no action'
  }
}

/** A field is either a shorthand type string or a full definition. */
export type Field = FieldType | FieldDef
export type Fields = Record<string, Field>

export interface DefineModelOptions {
  fields: Fields
  /** Primary key column name (auto-increment integer). Default `id`. */
  pk?: string
  /** Composite / named indexes emitted after the table (e.g. `{ on: ['teamId','createdAt'] }`). */
  indexes?: Array<{ on: string[]; unique?: boolean; name?: string }>

  /**
   * Per-operation authorization for the derived resource (reuses the route gate).
   * Declaring it (or `scope`) gates the whole resource — unlisted ops default to
   * `'authed'`. See `defineResource`'s `access`.
   */
  access?: AccessMap
  /** Row-level scope applied to every op of the derived resource. See `ScopeFn`. */
  scope?: ScopeFn
  /**
   * Composable behaviors ("traits") — e.g. `timestamps()`, `owned()`, `observable(...)`.
   * They fold their fields/access/scope/hooks into this model. See `@apex-stack/data`
   * behaviors and AUTH_DESIGN.md §8.
   */
  use?: Behavior[]
  /**
   * Named, reusable query scopes — `Model.scope('published').all(h)`. Each receives a fresh
   * QueryBuilder (+ any args) and returns it chained: `{ published: (q) => q.where({ status: 'published' }) }`.
   */
  scopes?: Record<string, (qb: QueryBuilder, ...args: any[]) => QueryBuilder>
  /** Columns hidden from serialization — omitted by `instance.toJSON()` AND the REST/MCP resource
   * responses (e.g. `password`, `secret`). */
  hidden?: string[]
}

/** A model: its schema derivations + a factory for its REST/MCP resource. */
export interface ApexModel {
  name: string
  pk: string
  fields: Record<string, FieldDef>
  /** Zod shape validating the create payload (each field's schema exposes `.parse`). */
  insert: Record<string, z.ZodTypeAny>
  /** Build the dialect-specific Drizzle table (lazy — the dialect is known at db time). */
  table(dialect: Dialect): unknown
  /** `CREATE TABLE IF NOT EXISTS` SQL for the dialect (the model's initial migration). */
  migrationSql(dialect: Dialect): string
  /** Bind the model to a db handle → a REST + MCP resource (list/get/create/update/delete). */
  resource(handle: ApexDbHandle): ApexResource

  // ── Active-record query API (P1) ────────────────────────────────────────
  // Server code queries its own models without hand-writing SQL. Reads run through
  // Drizzle (operators/ordering/pagination; bool+JSON hydrate); writes run through the
  // SAME pipeline as REST/MCP — hooks (timestamps/observers/audit), row-level `scope`,
  // soft-delete, and validation all fire. Column names are validated against `fields`
  // (typo → throw, never an injection vector). `raw('plays + 1')` = a SQL expression.
  // `opts.user` drives row-level `scope` isolation (omitted = trusted/admin).

  /** All rows, as hydrated instances in a Collection. */
  all(handle: ApexDbHandle, opts?: QueryOpts): Promise<Collection<ModelInstance>>
  /** First row ordered by primary key, or `null`. */
  first(handle: ApexDbHandle, opts?: QueryOpts): Promise<ModelInstance | null>
  /** Row by primary key, or `null`. */
  find(handle: ApexDbHandle, id: unknown, opts?: QueryOpts): Promise<ModelInstance | null>
  /** First row, or throw `ModelNotFoundException` (HTTP 404). */
  firstOrFail(handle: ApexDbHandle, opts?: QueryOpts): Promise<ModelInstance>
  /** Row by primary key, or throw `ModelNotFoundException` (HTTP 404). */
  findOrFail(handle: ApexDbHandle, id: unknown, opts?: QueryOpts): Promise<ModelInstance>
  /** Start a filtered query: `Model.where({ team: 'A', plays: { gt: 5 } }).orderBy('plays','desc').all(h)`. */
  where(conds: WhereConds): QueryBuilder
  /** Start an ordered query. */
  orderBy(col: string, dir?: 'asc' | 'desc'): QueryBuilder
  /** Start a query from a named scope: `Model.scope('published').all(h)`. */
  scope(name: string, ...args: unknown[]): QueryBuilder
  /** Count rows (optionally matching `conds`). */
  count(handle: ApexDbHandle, conds?: WhereConds, opts?: QueryOpts): Promise<number>
  /** Whether any row matches. */
  exists(handle: ApexDbHandle, conds?: WhereConds, opts?: QueryOpts): Promise<boolean>
  /** Delete rows matching `conds` (soft-delete aware); returns the number removed. */
  delete(handle: ApexDbHandle, conds: WhereConds, opts?: QueryOpts): Promise<number>
  /** Insert a row through the write pipeline (hooks/timestamps/scope/validation); returns it. */
  create(handle: ApexDbHandle, values: Values, opts?: QueryOpts): Promise<ModelInstance>
  /** Bulk-insert rows in one statement; scope-stamped, returns them. Fast — bypasses per-row hooks. */
  insertMany(handle: ApexDbHandle, rows: Values[], opts?: QueryOpts): Promise<Row[]>
  /** Bulk-update all rows matching `conds`; returns the count. Fast — bypasses per-row hooks. */
  updateMany(
    handle: ApexDbHandle,
    conds: WhereConds,
    values: Values,
    opts?: QueryOpts,
  ): Promise<number>
  /** Update the row with the given primary key; returns it, or `null` if absent. */
  update(
    handle: ApexDbHandle,
    id: unknown,
    values: Values,
    opts?: QueryOpts,
  ): Promise<ModelInstance | null>
  /** Update the first row matching `match`, else create `{ ...match, ...values }`. */
  updateOrCreate(
    handle: ApexDbHandle,
    match: WhereConds,
    values: Values,
    opts?: QueryOpts,
  ): Promise<ModelInstance>
  /**
   * Insert; on conflict with `conflictKeys`, update the other columns. `opts.keep`
   * picks `max`/`min` per column instead of overwriting (e.g. a high-score row).
   * Fast bulk primitive — bypasses per-row hooks (like Eloquent `upsert`). Use
   * `updateOrCreate` when you need timestamps/observers.
   */
  upsert(
    handle: ApexDbHandle,
    conflictKeys: string[],
    values: Values,
    opts?: UpsertOptions,
  ): Promise<ModelInstance | null>
}

function normalize(field: Field): FieldDef {
  return typeof field === 'string' ? { type: field } : field
}

/** Zod validator for a field type (used for the create payload). */
function zodFor(def: FieldDef): z.ZodTypeAny {
  switch (def.type) {
    case 'int':
      return z.coerce.number().int()
    case 'float':
      return z.coerce.number()
    case 'boolean':
      return z.coerce.boolean()
    case 'timestamp':
      // ISO string, NOT z.coerce.date(): a Date output type can't be represented
      // in JSON Schema, which crashes MCP tools/list for the whole app.
      return z.string()
    case 'json':
      return z.any()
    default:
      return z.string()
  }
}

/** Build a dialect-specific Drizzle column for one field. */
function column(name: string, def: FieldDef, dialect: Dialect): unknown {
  let col: any
  if (dialect === 'sqlite') {
    col =
      def.type === 'int'
        ? integer(name)
        : def.type === 'float'
          ? real(name)
          : def.type === 'boolean'
            ? integer(name, { mode: 'boolean' })
            : def.type === 'timestamp'
              ? text(name) // ISO string (SQLite has no native timestamp type)
              : def.type === 'json'
                ? text(name, { mode: 'json' })
                : text(name)
  } else {
    col =
      def.type === 'int'
        ? pgInteger(name)
        : def.type === 'float'
          ? doublePrecision(name)
          : def.type === 'boolean'
            ? pgBoolean(name)
            : def.type === 'timestamp'
              ? timestamp(name, { mode: 'string' })
              : def.type === 'json'
                ? jsonb(name)
                : pgText(name)
  }
  if (def.notNull) col = col.notNull()
  if (def.unique) col = col.unique()
  if (def.default !== undefined) col = col.default(def.default)
  return col
}

/** SQL column type for the CREATE TABLE migration. */
function sqlType(def: FieldDef, dialect: Dialect): string {
  if (dialect === 'sqlite') {
    return def.type === 'float'
      ? 'REAL'
      : def.type === 'int' || def.type === 'boolean'
        ? 'INTEGER'
        : 'TEXT'
  }
  switch (def.type) {
    case 'int':
      return 'INTEGER'
    case 'float':
      return 'DOUBLE PRECISION'
    case 'boolean':
      return 'BOOLEAN'
    case 'timestamp':
      return 'TIMESTAMP'
    case 'json':
      return 'JSONB'
    default:
      return 'TEXT'
  }
}

function sqlDefault(value: unknown): string {
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  return `'${String(value).replace(/'/g, "''")}'`
}

/**
 * Define a model once → schema + validation + migration + REST/MCP CRUD.
 *
 * ```ts
 * export default defineModel('todos', {
 *   fields: { title: 'string', done: { type: 'boolean', default: false } },
 * })
 * ```
 */
export function defineModel(name: string, opts: DefineModelOptions): ApexModel {
  const pk = opts.pk ?? 'id'
  // Fold behaviors ("traits") + the model's own spec into one effective spec.
  const composed = composeBehaviors(opts.use ?? [], {
    fields: opts.fields,
    access: opts.access,
    scope: opts.scope,
  })
  const fields: Record<string, FieldDef> = {}
  for (const [key, f] of Object.entries(composed.fields)) fields[key] = normalize(f)

  const insert: Record<string, z.ZodTypeAny> = {}
  for (const [key, def] of Object.entries(fields)) {
    const base = zodFor(def)
    // Required only when NOT NULL and no default; otherwise optional.
    insert[key] = def.notNull && def.default === undefined ? base : base.optional()
  }
  // Drop behavior-managed columns (e.g. timestamps) from the create payload.
  for (const key of composed.omitFromInsert) delete insert[key]

  const table = (dialect: Dialect): unknown => {
    const cols: Record<string, unknown> = {
      [pk]:
        dialect === 'sqlite'
          ? integer(pk).primaryKey({ autoIncrement: true })
          : serial(pk).primaryKey(),
    }
    for (const [key, def] of Object.entries(fields)) cols[key] = column(key, def, dialect)
    return dialect === 'sqlite' ? sqliteTable(name, cols as never) : pgTable(name, cols as never)
  }

  // Quote identifiers so the DB column names match Drizzle's quoted names exactly — otherwise
  // Postgres lower-cases unquoted camelCase (teamId → teamid) and every camelCase column (ownerId,
  // createdAt, …) breaks. SQLite accepts double-quoted identifiers too.
  const q = (id: string) => `"${id}"`
  const migrationSql = (dialect: Dialect): string => {
    const pkSql = dialect === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'SERIAL PRIMARY KEY'
    const lines = [`  ${q(pk)} ${pkSql}`]
    for (const [key, def] of Object.entries(fields)) {
      let line = `  ${q(key)} ${sqlType(def, dialect)}`
      if (def.notNull) line += ' NOT NULL'
      if (def.unique) line += ' UNIQUE'
      if (def.default !== undefined) line += ` DEFAULT ${sqlDefault(def.default)}`
      if (def.references) {
        line += ` REFERENCES ${q(def.references.table)}(${q(def.references.column ?? 'id')})`
        if (def.references.onDelete) line += ` ON DELETE ${def.references.onDelete.toUpperCase()}`
      }
      lines.push(line)
    }
    let sql = `CREATE TABLE IF NOT EXISTS ${q(name)} (\n${lines.join(',\n')}\n);`
    // Indexes — single-column (`field.index`) + composite (`opts.indexes`). FK columns and
    // frequent filters need these or every query table-scans at scale.
    const idx: string[] = []
    for (const [key, def] of Object.entries(fields)) {
      if (def.index)
        idx.push(`CREATE INDEX IF NOT EXISTS idx_${name}_${key} ON ${q(name)} (${q(key)});`)
    }
    for (const i of opts.indexes ?? []) {
      const cols = i.on.map(q).join(', ')
      const iname = i.name ?? `idx_${name}_${i.on.join('_')}`
      idx.push(
        `CREATE ${i.unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS ${iname} ON ${q(name)} (${cols});`,
      )
    }
    if (idx.length) sql += `\n${idx.join('\n')}`
    return sql
  }

  const resource = (handle: ApexDbHandle): ApexResource =>
    defineResource(name, {
      db: handle.db,
      table: table(handle.dialect),
      insert,
      pk,
      access: composed.access,
      scope: composed.scope,
      filters: composed.filters,
      softDelete: composed.softDelete,
      hooks: composed.hooks,
      hidden: opts.hidden,
      handle,
    })

  const model = { name, pk, fields, insert, table, migrationSql, resource }
  // Attach the active-record statics (first/where/create/upsert/…). They share the
  // model's composed behaviors — so Model.* writes fire the SAME hooks/scope/soft-delete
  // pipeline as the REST/MCP resource (see repository.ts).
  return attachActiveRecord(model, {
    name,
    pk,
    fields,
    table,
    scope: composed.scope,
    filters: composed.filters,
    softDelete: composed.softDelete,
    hooks: composed.hooks,
    insertShape: insert,
    scopes: opts.scopes,
    hidden: opts.hidden ? new Set(opts.hidden) : undefined,
  }) as ApexModel
}
