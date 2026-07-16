// An in-memory pub/sub hub for real-time fan-out. Channels are plain strings; a publish delivers
// synchronously to every current subscriber of that channel. Pure JS with no `node:` import, so it
// runs on a bare engine (QuickJS et al.) — the factory + interface shape mirrors the cache/security
// primitives (see cache/cache.ts). The SSE handler in ./sse.ts is the primary consumer, but the
// hub is transport-agnostic: any code can subscribe.

/**
 * A channel subscriber. Invoked once per {@link Broadcaster.publish} to the subscribed channel,
 * with the published event name and its (already-decoded) payload.
 */
export type BroadcastListener = (event: string, data: unknown) => void

/**
 * The pub/sub surface. `subscribe` returns an unsubscribe thunk; `publish` fans a message out to
 * the channel's current subscribers; the bookkeeping accessors report live channel/subscriber
 * state (used by tests and health/introspection).
 */
export interface Broadcaster {
  /**
   * Register `listener` on `channel`. Returns an idempotent unsubscribe function — calling it
   * removes the listener (and drops the channel once its last subscriber leaves).
   */
  subscribe(channel: string, listener: BroadcastListener): () => void
  /**
   * Deliver `event` + `data` to every current subscriber of `channel`, synchronously. Iterates a
   * snapshot, so a listener may (un)subscribe during delivery without affecting the current fan-out.
   * A throwing listener is isolated — the remaining subscribers still receive the message.
   */
  publish(channel: string, event: string, data: unknown): void
  /** The channels that currently have at least one subscriber. */
  channels(): string[]
  /** Number of subscribers on `channel` (0 when the channel is absent). */
  subscriberCount(channel: string): number
}

/** Create an in-memory {@link Broadcaster}. Per instance; zero config; on-device safe. */
export function createBroadcaster(): Broadcaster {
  const channels = new Map<string, Set<BroadcastListener>>()

  return {
    subscribe(channel, listener) {
      let listeners = channels.get(channel)
      if (!listeners) {
        listeners = new Set<BroadcastListener>()
        channels.set(channel, listeners)
      }
      listeners.add(listener)
      let active = true
      return () => {
        if (!active) return // idempotent — a second call is a no-op
        active = false
        const set = channels.get(channel)
        if (!set) return
        set.delete(listener)
        if (set.size === 0) channels.delete(channel)
      }
    },
    publish(channel, event, data) {
      const listeners = channels.get(channel)
      if (!listeners) return
      // Snapshot so (un)subscribing inside a listener doesn't perturb this fan-out.
      for (const listener of [...listeners]) {
        try {
          listener(event, data)
        } catch {
          // Isolate a bad subscriber — one throw must not starve the others.
        }
      }
    },
    channels() {
      return [...channels.keys()]
    },
    subscriberCount(channel) {
      return channels.get(channel)?.size ?? 0
    },
  }
}
