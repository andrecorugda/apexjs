// Sealed-cookie sessions — server-only helpers built on h3's encrypted+signed
// session cookies (HttpOnly, SameSite=Lax by default, Secure in production). This is
// Apex's built-in identity store for the "hybrid" auth scope; OAuth/JWT/2FA remain
// adapter territory.
//
// REVOCATION LIMITATION: these sessions are STATELESS — the whole payload lives in the
// (encrypted/signed) cookie, with no server-side store to invalidate. There is therefore
// no true server-side "log this session out everywhere" until `maxAge` expires. `logout()`
// only clears the cookie in the caller's own browser; a copied/stolen cookie stays valid
// until it expires. For hard revocation, keep a server-side session/token store (adapter
// territory) or rotate the sealing `password` (invalidates ALL sessions at once).
import { deleteCookie, getCookie, type H3Event, setCookie, useSession } from 'h3'
import { type ApexUser, type AuthConfig, defineAuth } from './define.js'
import { sealHmac, unsealHmac } from './hmac.js'

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
  /**
   * Set the `Secure` cookie flag (HTTPS-only). Defaults to true in production
   * (`NODE_ENV === 'production'`) and false otherwise so local http dev still works.
   */
  secure?: boolean
}

const NAME = 'apex-session'

/** Whether the session cookie should carry `Secure` — explicit opt-in wins, else prod-only. */
function secureCookie(opts: SessionOptions): boolean {
  return opts.secure ?? process.env.NODE_ENV === 'production'
}

// The `event` params are typed `unknown` (not `H3Event`) so route handlers — whose
// ctx.event is intentionally loosely typed — can pass it with no cast. It is an
// h3 event at runtime.

/** A minimal session object — the subset of h3's `useSession` return that Apex's helpers use. */
interface ApexSession<T> {
  readonly id: string | undefined
  readonly data: T
  update(patch: Partial<T>): Promise<unknown>
  clear(): Promise<unknown>
}

/**
 * Sealed cookie sessions for the bare on-device engine (`apex build --mobile`), which has no
 * WebCrypto — so h3's iron-sealed (encrypted) session can't run. The cookie is HMAC-SIGNED
 * (tamper-proof) rather than encrypted; on-device that's a sound tradeoff (the payload is the
 * user's own session, on their own device). See {@link file://./hmac.ts}.
 */
function deviceSession<T extends Record<string, unknown>>(
  event: unknown,
  opts: SessionOptions,
): ApexSession<T> {
  const ev = event as H3Event
  const name = opts.name ?? NAME
  let data = unsealHmac(getCookie(ev, name), opts.password) as T
  const cookie = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: secureCookie(opts),
    path: '/',
    ...(opts.maxAge ? { maxAge: opts.maxAge } : {}),
  }
  return {
    id: undefined,
    get data() {
      return data
    },
    async update(patch: Partial<T>) {
      data = { ...data, ...patch }
      setCookie(ev, name, sealHmac(data, opts.password), cookie)
      return this
    },
    async clear() {
      data = {} as T
      deleteCookie(ev, name, { path: '/' })
      return this
    },
  }
}

/** Open (or create) the sealed session for this request. Sets a `SameSite=Lax` cookie. */
export async function getSession<T extends Record<string, unknown> = Record<string, unknown>>(
  event: unknown,
  opts: SessionOptions,
): Promise<ApexSession<T>> {
  // On a bare engine (mobile bundle) there's no crypto.subtle → use the pure-JS signed cookie.
  if ((globalThis as { __APEX_DEVICE__?: boolean }).__APEX_DEVICE__) {
    return deviceSession<T>(event, opts)
  }
  return useSession<T>(event as H3Event, {
    password: opts.password,
    name: opts.name ?? NAME,
    cookie: {
      sameSite: 'lax',
      secure: secureCookie(opts),
      ...(opts.maxAge ? { maxAge: opts.maxAge } : {}),
    },
  }) as unknown as ApexSession<T>
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
