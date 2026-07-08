// Tiny response helper so route handlers (e.g. a /login route) can set a status
// without importing h3 directly. `event` is the loosely-typed ctx.event.
import { type H3Event, setResponseStatus } from 'h3'

/** Set the HTTP status for the current response (e.g. `setStatus(event, 401)`). */
export function setStatus(event: unknown, code: number): void {
  setResponseStatus(event as H3Event, code)
}
