// API idempotency (#49) — client-driven request de-duplication, Stripe-style. When a client
// sends an `Idempotency-Key` header on an unsafe method, the pipeline runs the handler once,
// caches the `{status, body}` outcome, and REPLAYS it for any retry with the same key — so a
// network blip + client retry can't execute a POST twice. Automatic in `/api` (like CSRF);
// no header → zero cost, zero behavior change.
//
// Semantics:
//  - Keys are scoped by method + path + USER + key. User scoping is a security requirement:
//    without it, a caller who learns another user's key would receive that user's cached
//    response body. (Consequence: the check runs AFTER auth in the pipeline.)
//  - A concurrent duplicate (same key while the first is still running) gets 409.
//  - 2xx–4xx outcomes are cached (deterministic); 5xx / thrown are NOT — the lock is released
//    so the client's retry re-executes (caching a transient failure would defeat retries).
//  - Trade-offs: a process crash mid-handler wedges the key for `inFlightTtlMs` (default 60s),
//    after which retries re-execute; request-body fingerprinting (rejecting same-key-different-
//    payload) is a non-goal in v1.
import { getRequestHeader, type H3Event } from 'h3'
import type { ApexUser } from '../auth/define.js'
import { createMemoryStore, type KvStore } from '../security/kvStore.js'

/** Methods where a retried duplicate is dangerous (mirrors the CSRF mutation set). */
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export interface IdempotencyOptions {
  /** The shared store (Redis, …) for multi-instance deployments. Default: in-memory. */
  store?: KvStore
  /** How long a completed response is replayable. Default 24h. */
  ttlMs?: number
  /** How long an in-flight key blocks duplicates (crash recovery bound). Default 60s. */
  inFlightTtlMs?: number
}

/** A cached outcome: the exact status + result value the first execution produced. */
interface CachedResponse {
  status: number
  body: unknown
}

export type IdempotencyDecision =
  | { kind: 'replay'; status: number; body: unknown }
  | { kind: 'conflict' }
  | {
      kind: 'proceed'
      commit(status: number, body: unknown): Promise<void>
      release(): Promise<void>
    }

// The default store is a lazy MODULE-LEVEL singleton — deliberately not owned by a
// createApiHandler closure: the dev server builds a fresh handler per request, so a
// closure-scoped store would be recreated every request and idempotency would silently
// never work in dev.
let defaultStore: KvStore | undefined
function getDefaultStore(): KvStore {
  defaultStore ??= createMemoryStore()
  return defaultStore
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000
const DEFAULT_INFLIGHT_TTL_MS = 60 * 1000

/** Release an in-flight lock: delete when the store supports it, else expire ~immediately. */
async function releaseLock(store: KvStore, lockKey: string): Promise<void> {
  if (store.delete) await store.delete(lockKey)
  else await store.set(lockKey, '0', 1)
}

/**
 * Decide how to handle a request under idempotency. Returns `null` when idempotency does not
 * apply (no header, or a safe method) — the pipeline proceeds normally with no store traffic.
 *
 * Race-free with only get/set/incr: `incr` is the atomic lock acquire. Two concurrent firsts
 * both read a miss; `incr` returns 1 to exactly one; the loser re-checks the result key (the
 * winner may have committed between the loser's `get` and `incr`) and otherwise conflicts.
 */
export async function beginIdempotency(
  event: H3Event,
  request: { method: string; path: string },
  user: ApexUser | null,
  opts: IdempotencyOptions = {},
): Promise<IdempotencyDecision | null> {
  if (!MUTATING.has(request.method)) return null
  const key = getRequestHeader(event, 'idempotency-key')
  if (!key) return null

  const store = opts.store ?? getDefaultStore()
  const ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS
  const inFlightTtlMs = opts.inFlightTtlMs ?? DEFAULT_INFLIGHT_TTL_MS
  // Scope: concrete path (so /api/todos/1 and /api/todos/2 are distinct) + user + key.
  // `ApexUser.id` is conventional-but-optional; anonymous callers (and users without an id)
  // share the 'anon' scope — documented in the auth docs.
  const userId = String((user as { id?: unknown } | null)?.id ?? 'anon')
  const resultKey = `idem:${request.method}:${request.path}:${userId}:${key}`
  const lockKey = `${resultKey}:lock`

  // 1) Completed already? Replay the cached outcome.
  const cached = await store.get(resultKey)
  if (cached) {
    const parsed = JSON.parse(cached) as CachedResponse
    return { kind: 'replay', status: parsed.status, body: parsed.body }
  }

  // 2) Atomically acquire the in-flight lock.
  const n = await store.incr(lockKey, inFlightTtlMs)
  if (n > 1) {
    // 3) Lost the race — but the winner may have committed between our get and incr.
    const nowCached = await store.get(resultKey)
    if (nowCached) {
      const parsed = JSON.parse(nowCached) as CachedResponse
      return { kind: 'replay', status: parsed.status, body: parsed.body }
    }
    return { kind: 'conflict' }
  }

  // 4) We own the key — run the handler; the pipeline commits or releases afterwards.
  return {
    kind: 'proceed',
    async commit(status, body) {
      await store.set(resultKey, JSON.stringify({ status, body } satisfies CachedResponse), ttlMs)
      await releaseLock(store, lockKey)
    },
    async release() {
      await releaseLock(store, lockKey)
    },
  }
}
