// collection.ts — a fluent array wrapper returned by model reads (`Model.all()` etc.).
// Extends Array so length / iteration / spread / destructuring all work, but overrides
// Symbol.species to Array so `.map`/`.filter` return plain arrays (predictable for
// callers and test equality). Adds Eloquent-Collection-style helpers.

export class Collection<T> extends Array<T> {
  // map/filter/slice/etc. produce a plain Array, not a Collection.
  static override get [Symbol.species](): ArrayConstructor {
    return Array
  }

  /** Pluck one column's values into a plain array. */
  pluck<K extends keyof T>(key: K): Array<T[K]> {
    return this.map((x) => x[key])
  }

  /** Index the items by a column's value. */
  keyBy(key: keyof T): Record<string, T> {
    const out: Record<string, T> = {}
    for (const x of this) out[String(x[key])] = x
    return out
  }

  /** Group the items by a column's value. */
  groupBy(key: keyof T): Record<string, T[]> {
    const out: Record<string, T[]> = {}
    for (const x of this) {
      const k = String(x[key])
      const bucket = out[k] ?? []
      bucket.push(x)
      out[k] = bucket
    }
    return out
  }

  /** Sum a numeric column. */
  sum(key: keyof T): number {
    return this.reduce((a, x) => a + Number(x[key] ?? 0), 0)
  }

  isEmpty(): boolean {
    return this.length === 0
  }
  isNotEmpty(): boolean {
    return this.length > 0
  }

  /** A plain array copy. */
  toArray(): T[] {
    return [...this]
  }

  /** Serialize each item (honoring a model instance's `toJSON`, e.g. `hidden` fields). */
  toJSON(): unknown[] {
    return this.map((x) => {
      const j = (x as unknown as { toJSON?: () => unknown })?.toJSON
      return typeof j === 'function' ? j.call(x) : x
    })
  }
}

/** Build a Collection from an array (avoids the `new Array(n)` numeric-arg pitfall). */
export function collect<T>(items: readonly T[]): Collection<T> {
  const c = new Collection<T>()
  c.push(...items)
  return c
}
