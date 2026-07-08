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
import { type ZodRawShape, z } from 'zod'
import { type Behavior, composeBehaviors } from './behavior.js'
import {
  type AccessMap,
  type ApexDbHandle,
  type Dialect,
  defineResource,
  type ScopeFn,
} from './index.js'

export type FieldType = 'string' | 'text' | 'int' | 'float' | 'boolean' | 'timestamp' | 'json'

export interface FieldDef {
  type: FieldType
  notNull?: boolean
  unique?: boolean
  default?: unknown
}

/** A field is either a shorthand type string or a full definition. */
export type Field = FieldType | FieldDef
export type Fields = Record<string, Field>

export interface DefineModelOptions {
  fields: Fields
  /** Primary key column name (auto-increment integer). Default `id`. */
  pk?: string
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
}

/** A model: its schema derivations + a factory for its REST/MCP resource. */
export interface ApexModel {
  name: string
  pk: string
  fields: Record<string, FieldDef>
  /** Zod shape validating the create payload. */
  insert: ZodRawShape
  /** Build the dialect-specific Drizzle table (lazy — the dialect is known at db time). */
  table(dialect: Dialect): unknown
  /** `CREATE TABLE IF NOT EXISTS` SQL for the dialect (the model's initial migration). */
  migrationSql(dialect: Dialect): string
  /** Bind the model to a db handle → a REST + MCP resource (list/get/create/update/delete). */
  resource(handle: ApexDbHandle): ApexResource
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

  const migrationSql = (dialect: Dialect): string => {
    const pkSql = dialect === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'SERIAL PRIMARY KEY'
    const lines = [`  ${pk} ${pkSql}`]
    for (const [key, def] of Object.entries(fields)) {
      let line = `  ${key} ${sqlType(def, dialect)}`
      if (def.notNull) line += ' NOT NULL'
      if (def.unique) line += ' UNIQUE'
      if (def.default !== undefined) line += ` DEFAULT ${sqlDefault(def.default)}`
      lines.push(line)
    }
    return `CREATE TABLE IF NOT EXISTS ${name} (\n${lines.join(',\n')}\n);`
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
      handle,
    })

  return { name, pk, fields, insert, table, migrationSql, resource }
}
