import type { ApexRoute } from './defineRoute.js'

/** One route within a resource, mounted at `/api/<name><pathSuffix>`. */
export interface ResourceRoute {
  /** Path suffix after the resource name, e.g. '' or '/:id'. */
  pathSuffix: string
  /** MCP tool name for this route (e.g. `todos_list`). */
  mcpName: string
  route: ApexRoute
}

/**
 * A resource expands to several routes (list/get/create/…) from one definition.
 * Built by `defineResource` in `@apex-stack/data`; recognized by the core API loader.
 */
export interface ApexResource {
  __apexResource: true
  name: string
  routes: ResourceRoute[]
}

export function isApexResource(x: unknown): x is ApexResource {
  return (
    typeof x === 'object' &&
    x !== null &&
    (x as { __apexResource?: unknown }).__apexResource === true
  )
}
