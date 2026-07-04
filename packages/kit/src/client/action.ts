// Form-action sugar: bind a form to an Apex API route with pending/error/data
// state, no boilerplate. Spread it into an x-data (methods + plain fields survive
// the spread, so it stays reactive):
//
//   <script client>
//     import { createAction } from '@apex-stack/core/client'
//   </script>
//   <template x-data="{ ...createAction('/api/messages', { onSuccess: () => location.reload() }) }">
//     <form @submit="submit($event)">
//       <input name="body" />
//       <button :disabled="pending" x-text="pending ? 'Saving…' : 'Save'"></button>
//       <p x-show="error" x-text="error"></p>
//     </form>
//   </template>

export interface ActionOptions {
  /** HTTP method. Defaults to POST. */
  method?: string
  /** Called with the parsed JSON response on success. */
  onSuccess?: (data: unknown) => void
  /** Called with the Error on failure. */
  onError?: (error: Error) => void
}

export interface ActionState {
  pending: boolean
  error: string | null
  data: unknown
  submit(event?: Event): Promise<void>
  reset(): void
}

/**
 * Build a reactive action object for use in `x-data`. `submit(event)` sends the
 * form (as JSON) to `url`, tracking `pending` / `error` / `data`. Runs the same
 * typed route your MCP tools + REST clients hit — one server surface.
 */
export function createAction(url: string, options: ActionOptions = {}): ActionState {
  return {
    pending: false,
    error: null as string | null,
    data: null as unknown,
    async submit(event?: Event) {
      if (
        event &&
        typeof (event as { preventDefault?: () => void }).preventDefault === 'function'
      ) {
        event.preventDefault()
      }
      this.pending = true
      this.error = null
      try {
        const target = event?.target as HTMLFormElement | undefined
        let body: string | undefined
        const headers: Record<string, string> = {}
        if (target && typeof FormData !== 'undefined' && target.tagName === 'FORM') {
          body = JSON.stringify(
            Object.fromEntries(new FormData(target) as unknown as Iterable<[string, string]>),
          )
          headers['content-type'] = 'application/json'
        }
        const res = await fetch(url, { method: options.method ?? 'POST', headers, body })
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        this.data = await res.json().catch(() => null)
        options.onSuccess?.(this.data)
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        this.error = e.message
        options.onError?.(e)
      } finally {
        this.pending = false
      }
    },
    reset() {
      this.pending = false
      this.error = null
      this.data = null
    },
  }
}
