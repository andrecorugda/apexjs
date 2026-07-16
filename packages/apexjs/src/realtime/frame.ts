// SSE (Server-Sent Events) wire-format encoders — pure string functions, no I/O, no `node:`
// import, so they run on a bare JS engine (QuickJS et al.) and are trivially unit-testable.
// See https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events for the field grammar.

/**
 * A single SSE message. `data` is the payload as a string (JSON-encode objects before passing).
 * `event`/`id`/`retry` map to the optional SSE fields; omit them for a bare `data:` frame.
 */
export interface SseFrame {
  /** The `event:` field — the named type an `EventSource` listener keys off. */
  event?: string
  /** The `id:` field — the last-event-id a client echoes on reconnect. */
  id?: string
  /** The `retry:` field — reconnection delay hint, in milliseconds (integers only). */
  retry?: number
  /** The `data:` payload. Multi-line strings are split into one `data:` line each, per spec. */
  data: string
}

/** Strip CR/LF so a single field value can never inject extra SSE lines. */
function sanitizeLine(value: string): string {
  return value.replace(/[\r\n]/g, '')
}

/**
 * Encode an {@link SseFrame} into the on-the-wire text block, e.g. `event: x\ndata: {...}\n\n`.
 * Field order is `id`, `event`, `retry`, then `data` line(s); the frame is terminated by the
 * mandatory blank line. Multi-line `data` becomes multiple `data:` lines (browsers rejoin with
 * `\n`).
 */
export function encodeSseFrame(frame: SseFrame): string {
  let out = ''
  if (frame.id !== undefined) out += `id: ${sanitizeLine(frame.id)}\n`
  if (frame.event !== undefined) out += `event: ${sanitizeLine(frame.event)}\n`
  if (frame.retry !== undefined && Number.isInteger(frame.retry)) out += `retry: ${frame.retry}\n`
  for (const line of frame.data.split(/\r\n|\r|\n/)) out += `data: ${line}\n`
  out += '\n'
  return out
}

/**
 * Encode an SSE comment line (`: text\n\n`). Comments are ignored by `EventSource` and are the
 * conventional keep-alive heartbeat that holds an idle connection (and intermediary proxies) open.
 */
export function encodeSseComment(text = ''): string {
  return `: ${sanitizeLine(text)}\n\n`
}
