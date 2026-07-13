// Reactive CRUD data-hook for a model's REST resource — the client half of
// `defineModel`. `createResourceClient('posts')` returns a plain Alpine data object
// (spread it into an x-data) that loads the list and keeps it in sync locally as you
// create / update / remove, hitting the same `/api/<name>` routes your MCP tools use.
//
//   <script client>
//     import { createResourceClient } from '@apex-stack/core/client'
//   </script>
//   <template x-data="{ ...createResourceClient('posts'), init() { this.fetch() } }">
//     <template x-for="p in items" :key="p.id"><li x-text="p.title"></li></template>
//   </template>
//
// `apex make composable <Model>` generates a typed wrapper (`usePosts()`) around this.

export interface ResourceClientOptions {
  /** Base URL of the resource. Defaults to `/api/<name>`. */
  base?: string
  /** Primary-key field used to match rows in the local cache. Defaults to `id`. */
  idKey?: string
}

export interface ResourceClientState<T, New = Partial<T>, Patch = Partial<T>> {
  /** The list, kept in sync by `create` / `update` / `remove`. Call `fetch()` to load it. */
  items: T[]
  /** The row loaded by the most recent `find(id)`, or null. */
  current: T | null
  /** True while any request is in flight. */
  loading: boolean
  /** The last error message, or null. */
  error: string | null
  /** GET the full list into `items` (also returned). */
  fetch(): Promise<T[]>
  /** GET one row by id into `current` (also returned). */
  find(id: string | number): Promise<T | null>
  /** POST a new row; on success appends it to `items` and returns it. */
  create(input: New): Promise<T | null>
  /** PATCH a row by id; on success replaces it in `items` and returns it. */
  update(id: string | number, input: Patch): Promise<T | null>
  /** DELETE a row by id; on success removes it from `items`. Returns whether it succeeded. */
  remove(id: string | number): Promise<boolean>
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

const JSON_HEADERS = { 'content-type': 'application/json', accept: 'application/json' }

export function createResourceClient<
  T = Record<string, unknown>,
  New = Partial<T>,
  Patch = Partial<T>,
>(name: string, options: ResourceClientOptions = {}): ResourceClientState<T, New, Patch> {
  const base = options.base ?? `/api/${name}`
  const idKey = options.idKey ?? 'id'
  const sameId = (row: T, id: string | number) =>
    String((row as Record<string, unknown>)[idKey]) === String(id)

  return {
    items: [] as T[],
    current: null as T | null,
    loading: false,
    error: null as string | null,

    async fetch() {
      this.loading = true
      this.error = null
      try {
        const res = await fetch(base, { headers: { accept: 'application/json' } })
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        this.items = ((await res.json()) as T[]) ?? []
        return this.items
      } catch (err) {
        this.error = message(err)
        return this.items
      } finally {
        this.loading = false
      }
    },

    async find(id) {
      this.loading = true
      this.error = null
      try {
        const res = await fetch(`${base}/${id}`, { headers: { accept: 'application/json' } })
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        this.current = ((await res.json()) as T) ?? null
        return this.current
      } catch (err) {
        this.error = message(err)
        return null
      } finally {
        this.loading = false
      }
    },

    async create(input) {
      this.loading = true
      this.error = null
      try {
        const res = await fetch(base, {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify(input),
        })
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const row = ((await res.json()) as T) ?? null
        if (row) this.items.push(row)
        return row
      } catch (err) {
        this.error = message(err)
        return null
      } finally {
        this.loading = false
      }
    },

    async update(id, input) {
      this.loading = true
      this.error = null
      try {
        const res = await fetch(`${base}/${id}`, {
          method: 'PATCH',
          headers: JSON_HEADERS,
          body: JSON.stringify(input),
        })
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const row = ((await res.json()) as T) ?? null
        if (row) {
          const i = this.items.findIndex((r) => sameId(r, id))
          if (i !== -1) this.items.splice(i, 1, row)
        }
        return row
      } catch (err) {
        this.error = message(err)
        return null
      } finally {
        this.loading = false
      }
    },

    async remove(id) {
      this.loading = true
      this.error = null
      try {
        const res = await fetch(`${base}/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const i = this.items.findIndex((r) => sameId(r, id))
        if (i !== -1) this.items.splice(i, 1)
        return true
      } catch (err) {
        this.error = message(err)
        return false
      } finally {
        this.loading = false
      }
    },
  }
}
