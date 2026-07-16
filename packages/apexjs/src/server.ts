// @apex-stack/core/server — SERVER-ONLY helpers (import h3; never bundle to the
// client). Use these in server/auth.ts, middleware, and API routes.

export type { ApexUser, AuthConfig, AuthResolveContext, RouteGate } from './auth/define.js'
export { defineAuth } from './auth/define.js'
export { hashPassword, verifyPassword } from './auth/password.js'
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
export {
  type CorsConfig,
  DEFAULT_CSP,
  type HeadersConfig,
  type HstsConfig,
  type RateLimitConfig,
  type ResolvedSecurity,
  resolveSecurityConfig,
  type SecurityConfig,
} from './security/config.js'
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
// Cache subsystem (memory + file drivers, TTL, tags).
export * from './cache/index.js'
// File/object storage (local + S3, signed URLs).
export {
  createLocalStorage,
  createS3Storage,
  createStorage,
  type LocalStorageConfig,
  presignGetUrl,
  type PutOptions,
  type S3StorageConfig,
  signRequest,
  type Storage,
  type StorageConfig,
  type StorageEntry,
  StoragePathError,
  type UrlOptions,
  verifySignedUrl,
} from './storage/index.js'
