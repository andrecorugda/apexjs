// Server-only auth plumbing: discover `server/auth.ts` and resolve the request's
// user once per request (memoized on the h3 event, shared by pages/REST/MCP).
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getRequestHeaders, getRequestURL, type H3Event, parseCookies } from 'h3'
import type { RuntimeConfig } from '../config/runtime.js'
import type { ApexUser, AuthConfig } from './define.js'

/**
 * Load `server/auth.ts` (its default export is an AuthConfig). Returns undefined
 * when the app hasn't defined auth — in which case every `auth: true` route is
 * effectively closed (no user can ever be resolved), which is the safe default.
 */
export async function loadAuth(
  root: string,
  loadModule: (id: string) => Promise<{ default?: AuthConfig }>,
): Promise<AuthConfig | undefined> {
  const file = ['server/auth.ts', 'server/auth.js', 'server/auth.mjs'].find((p) =>
    existsSync(join(root, p)),
  )
  if (!file) return undefined
  const mod = await loadModule(`/${file}`)
  return mod.default && typeof mod.default.resolve === 'function' ? mod.default : undefined
}

/**
 * Resolve (and memoize) the request's user. Reads the cached value if a prior step
 * already resolved it this request; otherwise runs `auth.resolve`. A resolver that
 * throws yields an anonymous request (fail-closed) rather than a 500.
 */
export async function getRequestUser(
  event: H3Event,
  auth: AuthConfig | undefined,
  config?: RuntimeConfig,
): Promise<ApexUser | null> {
  const ctx = event.context as { apexUserResolved?: boolean; apexUser?: ApexUser | null }
  if (ctx.apexUserResolved) return ctx.apexUser ?? null

  let user: ApexUser | null = null
  if (auth) {
    try {
      user =
        (await auth.resolve({
          headers: getRequestHeaders(event) as Record<string, string>,
          cookies: parseCookies(event),
          url: getRequestURL(event).toString(),
          method: event.method,
          config: config ?? { public: {} },
          event,
        })) ?? null
    } catch {
      user = null
    }
  }
  ctx.apexUser = user
  ctx.apexUserResolved = true
  return user
}
