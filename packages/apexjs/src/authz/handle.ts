// The minimal DB handle the authz pillar persists through. Every module here talks to storage ONLY
// via `exec`/`query` with `?` placeholders (portable across SQLite/Postgres — the handle translates
// them), so no module in this dir carries a top-level `node:` import and none string-concatenates a
// bound value into SQL. `@apex-stack/data`'s `ApexDbHandle` satisfies this structurally, as does any
// hand-rolled handle over your own driver.

/** A bound SQL parameter — the only value shapes the authz modules ever pass to the handle. */
export type SqlValue = string | number | boolean | null

/** Parameterized `exec`/`query` with `?` placeholders. `dialect` is advisory and unused here. */
export interface AuthzDbHandle {
  exec(sql: string, params?: readonly SqlValue[]): Promise<void>
  query(sql: string, params?: readonly SqlValue[]): Promise<Array<Record<string, unknown>>>
  dialect?: string
}

/**
 * Identifiers can't be bound as parameters, so a table/prefix must be a plain SQL identifier. This
 * is the injection guard for every table name derived from user-supplied config.
 */
export function assertIdentifier(name: string, label = 'identifier'): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid ${label}: ${JSON.stringify(name)}`)
  }
  return name
}

/**
 * Compose `prefix + base` into a validated table identifier. The prefix (when non-empty) and the
 * final composed name are BOTH validated, so neither can smuggle in SQL. An empty/undefined prefix
 * yields the bare base name.
 */
export function tableName(prefix: string | undefined, base: string): string {
  const p = prefix ?? ''
  if (p !== '') assertIdentifier(p, 'table prefix')
  return assertIdentifier(`${p}${base}`, 'table name')
}

/** Build a `(?, ?, ...)` placeholder list of length `n`. Caller must guarantee `n > 0`. */
export function placeholders(n: number): string {
  return Array.from({ length: n }, () => '?').join(', ')
}
