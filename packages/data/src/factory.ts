// Test-data factories, inferred from a model's schema (Laravel-factory style, but no
// blueprint — the fields ARE the blueprint). Zero-dep by default; plug in @faker-js/faker
// (or anything) via the `fake` hook for richer values.
import type { ApexDbHandle } from './index.js'
import type { ApexModel, FieldDef } from './model.js'

let seq = 0

/** Default value generator — deterministic, dependency-free. */
function genValue(field: string, def: FieldDef, n: number): unknown {
  switch (def.type) {
    case 'boolean':
      return n % 2 === 0
    case 'int':
      return n
    case 'float':
      return n + 0.5
    case 'json':
      return {}
    case 'timestamp':
      // Server-managed by convention (timestamps/softDeletes) — leave null unless
      // overridden, so a generated row isn't accidentally "soft-deleted".
      return undefined
    default: {
      const l = field.toLowerCase()
      if (l.includes('email')) return `user${n}@example.com`
      if (l === 'name' || l.endsWith('name')) return `Name ${n}`
      if (l.includes('url')) return `https://example.com/${n}`
      return `${field}-${n}`
    }
  }
}

export interface FactoryOptions {
  /** Override value generation per field — e.g. return faker-based values. */
  fake?: (field: string, def: FieldDef, seq: number) => unknown
}

type Row = Record<string, unknown>

export interface Factory {
  /** Build one row (not persisted). Overrides win; extra keys pass through. */
  make(overrides?: Row): Row
  /** Build `count` rows. */
  makeMany(count: number, overrides?: Row): Row[]
  /** Insert one row and return it (raw insert — skips resource hooks/behaviors). */
  create(handle: ApexDbHandle, overrides?: Row): Promise<Row>
  /** Insert `count` rows. */
  createMany(handle: ApexDbHandle, count: number, overrides?: Row): Promise<Row[]>
}

/**
 * A factory for `model`, inferred from its fields.
 *
 * ```ts
 * const users = factory(User)
 * users.make({ role: 'admin' })            // one fake row, override any field
 * await users.createMany(db, 5)            // insert 5
 * factory(User, { fake: (f, d) => faker.… })  // richer values via faker
 * ```
 */
export function factory(model: ApexModel, opts?: FactoryOptions): Factory {
  const gen = opts?.fake ?? genValue

  const make = (overrides: Row = {}): Row => {
    const n = ++seq
    const row: Row = {}
    for (const [field, def] of Object.entries(model.fields)) {
      if (field in overrides) {
        row[field] = overrides[field]
        continue
      }
      const v = gen(field, def, n)
      if (v !== undefined) row[field] = v
    }
    return { ...row, ...overrides } // extra (non-field) overrides pass through
  }

  const makeMany = (count: number, overrides?: Row): Row[] =>
    Array.from({ length: count }, () => make(overrides))

  const create = async (handle: ApexDbHandle, overrides?: Row): Promise<Row> => {
    const table = model.table(handle.dialect)
    return (await handle.db.insert(table).values(make(overrides)).returning())[0]
  }

  const createMany = async (
    handle: ApexDbHandle,
    count: number,
    overrides?: Row,
  ): Promise<Row[]> => {
    const out: Row[] = []
    for (let i = 0; i < count; i++) out.push(await create(handle, overrides))
    return out
  }

  return { make, makeMany, create, createMany }
}
