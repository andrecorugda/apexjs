// Server observability hooks (#25, 🟡 Experimental) — `server/hooks.ts` default-exports an
// `ApexServerHooks` (via `defineHooks`) and the production server calls them: every request,
// every server-side error (wire Sentry here), and shutdown. Discovered like `server/auth.ts`.

/** One completed request (also the shape of the default JSON log line). */
export interface RequestLogEntry {
  /** ISO timestamp. */
  time: string
  method: string
  path: string
  status: number
  /** Duration in milliseconds. */
  ms: number
}

/** Where a server-side error surfaced. */
export interface ErrorContext {
  /** `api` = an /api handler; `mcp` = a tool call; `page` = a page loader/render; `http` = the h3 boundary. */
  kind: 'api' | 'mcp' | 'page' | 'http'
  path?: string
  method?: string
}

export interface ApexServerHooks {
  /**
   * Called once per completed request with `{time, method, path, status, ms}`.
   * Defining it replaces the default JSON log line — emit your own format here.
   */
  onRequest?: (entry: RequestLogEntry) => void
  /**
   * Called with the FULL error (message/stack) wherever the client only got a safe
   * generic response — the place to wire Sentry/Datadog/etc.
   */
  onError?: (error: unknown, ctx: ErrorContext) => void
  /** Runs during graceful shutdown, after in-flight requests drain. */
  onShutdown?: () => void | Promise<void>
}

/** Author a `server/hooks.ts`. Identity function — exists for types + discoverability. */
export function defineHooks(hooks: ApexServerHooks): ApexServerHooks {
  return hooks
}
