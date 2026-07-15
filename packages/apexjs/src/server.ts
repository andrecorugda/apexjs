// @apex-stack/core/server — SERVER-ONLY helpers (import h3; never bundle to the
// client). Use these in server/auth.ts, middleware, and API routes.

export type { ApexUser, AuthConfig, AuthResolveContext, RouteGate } from './auth/define.js'
export { defineAuth } from './auth/define.js'
export { setStatus } from './auth/respond.js'
export {
  getSession,
  login,
  logout,
  type SessionOptions,
  sessionAuth,
} from './auth/session.js'
export {
  type ApexServerHooks,
  defineHooks,
  type ErrorContext,
  type RequestLogEntry,
} from './hooks/define.js'
// Production server building blocks — run the built app as a standalone server
// or wrap it for a serverless target (Vercel, etc.).
export {
  createProdApp,
  createProdNodeHandler,
  createProdWebHandler,
  startProdServer,
} from './prod/server.js'
export { gracefulShutdown, onShutdown } from './prod/shutdown.js'
export { checkCsrf, isCsrfSafe } from './security/csrf.js'
export { applySecurityHeaders, securityHeaders } from './security/headers.js'
export { createMemoryStore, type KvStore } from './security/kvStore.js'
export {
  type AsyncRateLimiter,
  createRateLimiter,
  type RateLimiter,
  type RateLimitOptions,
  rateLimitKey,
} from './security/rateLimit.js'
