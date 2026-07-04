// Server-only middleware plumbing: discover `middleware/*.ts` and run the chain.
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { RuntimeConfig } from '../config/runtime.js'
import { type Middleware, type MiddlewareResult, isRedirect } from './define.js'

/**
 * Discover and load `middleware/*.ts` in filename order (prefix with `01.`, `02.`
 * to control ordering, like Nuxt). Each module's default export is a Middleware.
 */
export async function loadMiddleware(
  root: string,
  loadModule: (id: string) => Promise<{ default?: Middleware }>,
): Promise<Middleware[]> {
  const dir = join(root, 'middleware')
  if (!existsSync(dir)) return []
  const files = readdirSync(dir)
    .filter((f) => /\.(ts|js|mjs)$/.test(f))
    .sort()
  const out: Middleware[] = []
  for (const f of files) {
    const mod = await loadModule(`/middleware/${f}`)
    if (typeof mod.default === 'function') out.push(mod.default)
  }
  return out
}

export interface RunMiddlewareInput {
  url: string
  method: string
  config: RuntimeConfig
  headers: Record<string, string>
}

export interface RunMiddlewareResult {
  /** Set when a middleware short-circuited with a redirect. */
  redirect?: MiddlewareResult
  /** Accumulated request-scoped state, threaded to loaders + handlers. */
  locals: Record<string, unknown>
}

/**
 * Run the middleware chain in order over a shared `locals` object. Stops at the
 * first middleware that returns a redirect.
 */
export async function runMiddleware(
  middleware: Middleware[],
  input: RunMiddlewareInput,
): Promise<RunMiddlewareResult> {
  const locals: Record<string, unknown> = {}
  for (const mw of middleware) {
    const result = await mw({
      url: input.url,
      method: input.method,
      config: input.config,
      headers: input.headers,
      locals,
      redirect: (to, status = 302) => ({ __apexRedirect: true, to, status }),
    })
    if (isRedirect(result)) return { redirect: result, locals }
  }
  return { locals }
}
