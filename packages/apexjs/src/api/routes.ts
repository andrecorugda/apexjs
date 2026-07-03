import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  type App,
  defineEventHandler,
  getQuery,
  getRequestURL,
  readBody,
  setResponseHeader,
  setResponseStatus,
} from 'h3'
import { z } from 'zod'
import type { ApexRoute } from './defineRoute.js'

export interface LoadedRoute {
  /** Mounted REST path, e.g. `/api/add`. */
  path: string
  /** Slug derived from the filename, e.g. `add`. */
  name: string
  route: ApexRoute
}

/**
 * Discover and load `server/api/*.ts` route modules. Each file's default export
 * must be an `ApexRoute` (from `defineApexRoute`). The REST path is derived from
 * the filename: `server/api/add.ts` → `/api/add`.
 */
export async function loadApiRoutes(
  root: string,
  loadModule: (id: string) => Promise<{ default?: ApexRoute }>,
): Promise<LoadedRoute[]> {
  const dir = join(root, 'server', 'api')
  if (!existsSync(dir)) return []

  const files = readdirSync(dir).filter((f) => /\.(ts|js|mjs)$/.test(f))
  const routes: LoadedRoute[] = []
  for (const file of files) {
    const name = file.replace(/\.(ts|js|mjs)$/, '')
    const mod = await loadModule(`/server/api/${file}`)
    const route = mod.default
    if (!route || typeof route.handler !== 'function') continue
    routes.push({ path: `/api/${name}`, name, route })
  }
  return routes
}

/** Mount each loaded route as a validated REST endpoint on the h3 app. */
export function mountRestRoutes(app: App, routes: LoadedRoute[]): void {
  for (const { path, route } of routes) {
    app.use(
      path,
      defineEventHandler(async (event) => {
        if (event.method !== route.method) {
          setResponseStatus(event, 405)
          return { error: `Method not allowed; expected ${route.method}` }
        }

        const raw =
          route.method === 'GET' ? getQuery(event) : ((await readBody(event)) ?? {})

        let input: unknown = raw
        if (route.inputShape) {
          const parsed = z.object(route.inputShape).safeParse(raw)
          if (!parsed.success) {
            setResponseStatus(event, 400)
            return { error: 'Invalid input', issues: parsed.error.issues }
          }
          input = parsed.data
        }

        const result = await route.handler({ input, url: getRequestURL(event).toString() })
        setResponseHeader(event, 'Content-Type', 'application/json')
        return result
      }),
    )
  }
}
