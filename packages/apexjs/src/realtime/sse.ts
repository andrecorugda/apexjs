// An h3 event handler that streams a client the messages published to its channel(s) as
// Server-Sent Events. Built on a manual web `ReadableStream` (rather than h3's experimental
// `createEventStream`) so we fully control the wire — explicit SSE headers, comment keep-alives,
// and deterministic teardown on both web-fetch and Node request aborts. `sendStream` handles the
// Node/Web response duality (same call h3's own EventStream uses internally).

import {
  defineEventHandler,
  type H3Event,
  sendStream,
  setResponseHeaders,
  setResponseStatus,
} from 'h3'
import type { Broadcaster } from './broadcaster.js'
import { encodeSseComment, encodeSseFrame } from './frame.js'

/** Resolve the channel list a given connection subscribes to, from its h3 request event. */
export type SseChannelResolver = (event: H3Event) => string[] | Promise<string[]>

/** Options for {@link sseHandler}. */
export interface SseHandlerOptions {
  /**
   * Which channels this connection subscribes to, derived from the request (auth, query, route
   * params). Defaults to a single `'default'` channel when omitted.
   */
  channels?: SseChannelResolver
  /** Called once, after the stream opens and subscriptions are wired. Runtime side effects only. */
  onConnect?: (event: H3Event) => void | Promise<void>
  /**
   * Keep-alive heartbeat interval in ms (an SSE comment holds idle connections + proxies open).
   * Default 15000; pass `0` to disable.
   */
  keepAliveMs?: number
}

const DEFAULT_CHANNELS = ['default']

/**
 * Build an h3 event handler that opens an SSE stream and relays `broadcaster` messages on the
 * client's resolved channel(s). Sets `Content-Type: text/event-stream`, `Cache-Control: no-cache`,
 * `Connection: keep-alive` (plus `X-Accel-Buffering: no` to defeat proxy buffering), emits an
 * `event:`/`data:` frame per published message, sends periodic keep-alive comments, and tears down
 * its subscriptions + timer when the client disconnects or the stream is cancelled.
 */
export function sseHandler(broadcaster: Broadcaster, opts: SseHandlerOptions = {}) {
  const keepAliveMs = opts.keepAliveMs ?? 15000
  const resolveChannels = opts.channels ?? (() => DEFAULT_CHANNELS)

  return defineEventHandler(async (event) => {
    const channels = await resolveChannels(event)
    const encoder = new TextEncoder()

    let unsubscribe: (() => void) | undefined
    let heartbeat: ReturnType<typeof setInterval> | undefined
    let closed = false

    const cleanup = () => {
      if (closed) return
      closed = true
      if (heartbeat !== undefined) clearInterval(heartbeat)
      unsubscribe?.()
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (text: string) => {
          if (closed) return
          try {
            controller.enqueue(encoder.encode(text))
          } catch {
            // Controller already closed (client vanished mid-write) — stop feeding it.
            cleanup()
          }
        }

        // Wire one subscription per channel; the unsubscribe thunk tears them all down.
        const unsubs = channels.map((channel) =>
          broadcaster.subscribe(channel, (name, data) => {
            send(encodeSseFrame({ event: name, data: JSON.stringify(data) }))
          }),
        )
        unsubscribe = () => {
          for (const u of unsubs) u()
        }

        // Open the stream immediately with a comment so the client's `onopen` fires without
        // waiting for the first real event.
        send(encodeSseComment('connected'))

        if (keepAliveMs > 0) {
          heartbeat = setInterval(() => send(encodeSseComment('keep-alive')), keepAliveMs)
        }

        // Node request abort — the web-fetch path relies on `cancel()` below, but under
        // `toNodeListener` the socket 'close' is the reliable disconnect signal.
        event.node?.req?.on('close', cleanup)

        await opts.onConnect?.(event)
      },
      cancel() {
        cleanup()
      },
    })

    setResponseHeaders(event, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    setResponseStatus(event, 200)
    return sendStream(event, stream)
  })
}
