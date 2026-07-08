// Sealed-cookie sessions — server-only helpers built on h3's encrypted+signed
// session cookies (HttpOnly, SameSite=Lax by default). This is Apex's built-in
// identity store for the "hybrid" auth scope; OAuth/JWT/2FA remain adapter territory.
import { type H3Event, useSession } from 'h3'
import { type ApexUser, type AuthConfig, defineAuth } from './define.js'

export interface SessionOptions {
  /**
   * The secret used to seal (encrypt + sign) the cookie. **Must be at least 32
   * characters** and kept private — put it in `runtimeConfig` / env, never in code
   * or the client bundle.
   */
  password: string
  /** Cookie name. Default `apex-session`. */
  name?: string
  /** Cookie max-age in seconds. */
  maxAge?: number
}

const NAME = 'apex-session'

// The `event` params are typed `unknown` (not `H3Event`) so route handlers — whose
// ctx.event is intentionally loosely typed — can pass it with no cast. It is an
// h3 event at runtime.

/** Open (or create) the sealed session for this request. Sets a `SameSite=Lax` cookie. */
export async function getSession<T extends Record<string, unknown> = Record<string, unknown>>(
  event: unknown,
  opts: SessionOptions,
) {
  return useSession<T>(event as H3Event, {
    password: opts.password,
    name: opts.name ?? NAME,
    cookie: { sameSite: 'lax', ...(opts.maxAge ? { maxAge: opts.maxAge } : {}) },
  })
}

/** Log a caller in: merge `data` (e.g. `{ user }`) into the sealed session cookie. */
export async function login<T extends Record<string, unknown>>(
  event: unknown,
  data: T,
  opts: SessionOptions,
): Promise<T> {
  const session = await getSession<T>(event, opts)
  await session.update(data)
  return session.data
}

/** Log a caller out: clear the sealed session cookie. */
export async function logout(event: unknown, opts: SessionOptions): Promise<void> {
  const session = await getSession(event, opts)
  await session.clear()
}

/**
 * An `AuthConfig` that resolves the user from the sealed session cookie — drop it
 * into `server/auth.ts`:
 *
 * ```ts
 * export default sessionAuth({ password: useRuntimeConfig().sessionPassword })
 * ```
 *
 * By default it returns `session.data.user`. Pass `toUser` to map the raw session
 * payload to your user object (and to return `null` for "not logged in").
 */
export function sessionAuth(
  opts: SessionOptions & { toUser?: (data: Record<string, unknown>) => ApexUser | null },
): AuthConfig {
  const name = opts.name ?? NAME
  return defineAuth({
    async resolve({ event, cookies }) {
      // Don't initialize (and thus set) a session cookie for anonymous callers —
      // only read one that already exists. Keeps anonymous responses cookie-free.
      if (!cookies[name]) return null
      const session = await getSession(event, opts)
      const data = session.data as Record<string, unknown>
      if (opts.toUser) return opts.toUser(data)
      return (data.user as ApexUser | undefined) ?? null
    },
  })
}
