// @apex-stack/core — public programmatic API.
//
// This entry is CLIENT-SAFE: it exports only pure, dependency-light definitions
// (they may be imported in the browser, e.g. store files). Server-only internals
// like the dev server + render seam are NOT re-exported here — the CLI imports
// them via their module paths.
export { defineApexRoute } from './api/defineRoute.js'
export type {
  ApexRoute,
  ApexRouteConfig,
  ApexRouteHandlerContext,
  HttpMethod,
  InferInput,
  InferOutput,
  TypedApexRoute,
} from './api/defineRoute.js'
export { isApexResource } from './api/resource.js'
export type { ApexResource, ResourceRoute } from './api/resource.js'
export { defineStore, isApexStore } from './store.js'
export type { ApexStore, StoreState } from './store.js'
export { defineConfig, env, useRuntimeConfig } from './config/runtime.js'
export type { ApexConfig, RuntimeConfig } from './config/runtime.js'
export { defineMiddleware } from './middleware/define.js'
export type { Middleware, MiddlewareContext, MiddlewareResult } from './middleware/define.js'
