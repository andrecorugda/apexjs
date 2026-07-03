// @apex-stack/core — programmatic API.
export { defineApexRoute } from './api/defineRoute.js'
export type {
  ApexRoute,
  ApexRouteConfig,
  ApexRouteHandlerContext,
  HttpMethod,
} from './api/defineRoute.js'
export { isApexResource } from './api/resource.js'
export type { ApexResource, ResourceRoute } from './api/resource.js'
export { startDevServer } from './dev/server.js'
export type { DevServer, DevServerOptions } from './dev/server.js'
export { renderPage } from './dev/renderPage.js'
export type { PageModule, RenderPageOptions } from './dev/renderPage.js'
