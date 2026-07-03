export interface ForExpression {
  /** The item variable name, e.g. `item`. */
  item: string
  /** Optional index variable name, e.g. `index`. */
  index?: string
  /** The source expression to evaluate for the iterable, e.g. `items`. */
  items: string
}

// Matches Alpine's x-for forms:
//   item in items
//   (item, index) in items
//   item of items
const FOR_RE = /^\s*(?:\(\s*([^,\s]+)\s*(?:,\s*([^)\s]+)\s*)?\)|([^,\s]+))\s+(?:in|of)\s+(.+?)\s*$/

/** Parse an `x-for` expression. Returns null if it doesn't match a known form. */
export function parseForExpression(expr: string): ForExpression | null {
  const m = FOR_RE.exec(expr)
  if (!m) return null
  const item = m[1] ?? m[3]
  if (!item) return null
  return { item, index: m[2], items: m[4] as string }
}

/** Normalize an evaluated iterable into an array of [value, index] pairs. */
export function toIterablePairs(value: unknown): Array<[unknown, number]> {
  if (value == null) return []
  // A number produces a 1..n range, matching Alpine (`i in 3` → 1,2,3).
  if (typeof value === 'number') {
    return Array.from({ length: value }, (_, i) => [i + 1, i])
  }
  if (Array.isArray(value)) return value.map((v, i) => [v, i])
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map((v, i) => [v, i])
  }
  return []
}
