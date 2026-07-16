// Optional, framework-agnostic browser helper wrapping the native `EventSource`. Ships in docs +
// scaffolds so an app can consume an {@link sseHandler} endpoint in a few lines. Browser-only (uses
// the DOM `EventSource`); it is NOT imported by any server module, so it never pulls DOM globals
// into the server bundle.

/** Options for {@link apexRealtimeClient}. */
export interface RealtimeClientOptions {
  /**
   * Called for every message. `event` is the SSE event name (`'message'` when the frame had no
   * `event:` field); `data` is the JSON-parsed payload, or the raw string if it wasn't JSON.
   */
  onEvent: (event: string, data: unknown) => void
  /** Extra named events to listen for. Defaults to just the generic `'message'` stream. */
  events?: string[]
  /** Called on the underlying `EventSource` error (network drop; the browser auto-reconnects). */
  onError?: (error: Event) => void
  /** Called once when the connection opens. */
  onOpen?: () => void
  /** Send cookies/credentials with the request (cross-origin). Maps to `withCredentials`. */
  withCredentials?: boolean
}

/** A live realtime connection. `close()` tears down the `EventSource`. */
export interface RealtimeClient {
  /** Close the connection and stop reconnection attempts. */
  close: () => void
  /** The underlying `EventSource` (readyState, url, …). */
  source: EventSource
}

/**
 * Open an SSE connection to `url` and dispatch each frame to `onEvent`. Best-effort JSON-decodes
 * the payload (falls back to the raw string). The browser reconnects automatically on transient
 * errors; call {@link RealtimeClient.close} to stop.
 *
 * ```ts
 * const rt = apexRealtimeClient('/events', {
 *   onEvent: (event, data) => console.log(event, data),
 * })
 * // later: rt.close()
 * ```
 */
export function apexRealtimeClient(url: string, opts: RealtimeClientOptions): RealtimeClient {
  const source = new EventSource(url, { withCredentials: opts.withCredentials ?? false })

  const dispatch = (name: string, raw: string) => {
    let data: unknown = raw
    try {
      data = JSON.parse(raw)
    } catch {
      // Non-JSON payload — hand the raw string through unchanged.
    }
    opts.onEvent(name, data)
  }

  const handler = (ev: MessageEvent) => dispatch(ev.type, ev.data)
  source.addEventListener('message', handler)
  for (const name of opts.events ?? []) source.addEventListener(name, handler)

  if (opts.onOpen) source.addEventListener('open', opts.onOpen)
  if (opts.onError) source.addEventListener('error', opts.onError)

  return {
    close: () => source.close(),
    source,
  }
}
