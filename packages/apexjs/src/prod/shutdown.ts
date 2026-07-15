// Graceful shutdown (#25, 🟡 Experimental) — drain in-flight HTTP requests, then run the
// registered shutdown hooks (DB pools close themselves via the registry below). Wired to
// SIGTERM/SIGINT by `apex start`; serverless embedders can call `gracefulShutdown` themselves.
import type { Server } from 'node:http'

// ── Shutdown-hook registry ─────────────────────────────────────────────────
// A globalThis Set (precedent: __APEX_DEVICE__, __APEX_RUNTIME_CONFIG__) so other packages —
// notably @apex-stack/data, which registers each opened DB handle's close() — can participate
// without importing core (immune to two-copies-of-core version skew).

type ShutdownHook = () => void | Promise<void>

const KEY = '__APEX_SHUTDOWN_HOOKS__'

function hookSet(): Set<ShutdownHook> {
  const g = globalThis as Record<string, unknown>
  g[KEY] ??= new Set<ShutdownHook>()
  return g[KEY] as Set<ShutdownHook>
}

/**
 * Register a cleanup function to run when the server shuts down (after in-flight requests
 * drain). DB handles from `@apex-stack/data` register themselves — use this for anything
 * else that must flush or close (queues, watchers, telemetry).
 */
export function onShutdown(hook: ShutdownHook): void {
  hookSet().add(hook)
}

/**
 * Run every registered hook (parallel, error-tolerant — one failing hook never blocks the
 * rest), then clear the registry. Safe to call more than once.
 */
export async function runShutdownHooks(): Promise<void> {
  const hooks = [...hookSet()]
  hookSet().clear()
  const results = await Promise.allSettled(hooks.map((h) => h()))
  for (const r of results) {
    if (r.status === 'rejected') {
      console.error(
        '[apex] shutdown hook failed:',
        r.reason instanceof Error ? r.reason.message : r.reason,
      )
    }
  }
}

// ── HTTP drain ─────────────────────────────────────────────────────────────

export interface GracefulShutdownOptions {
  /** How long to wait for in-flight requests before force-closing sockets. Default 10s. */
  timeoutMs?: number
}

const closing = new WeakMap<Server, Promise<void>>()

/**
 * Drain a node:http server, then run the shutdown hooks:
 *
 *  1. stop accepting new connections + close idle keep-alive sockets,
 *  2. wait for in-flight requests to complete (up to `timeoutMs`, then force-close),
 *  3. run the {@link onShutdown} hooks (DB pools close here — after the requests that
 *     might still need them).
 *
 * Idempotent — repeat calls return the same promise.
 */
export function gracefulShutdown(
  server: Server,
  opts: GracefulShutdownOptions = {},
): Promise<void> {
  const existing = closing.get(server)
  if (existing) return existing

  const timeoutMs = opts.timeoutMs ?? 10_000
  const promise = (async () => {
    await new Promise<void>((resolve) => {
      // Force-close stragglers after the drain window; unref'd so a clean exit never
      // waits out the timer.
      const force = setTimeout(() => server.closeAllConnections(), timeoutMs)
      force.unref()
      server.close(() => {
        clearTimeout(force)
        resolve()
      })
      // Idle keep-alive sockets hold `close` open indefinitely — drop them now; sockets
      // with an in-flight request are untouched.
      server.closeIdleConnections()
    })
    await runShutdownHooks()
  })()

  closing.set(server, promise)
  return promise
}
