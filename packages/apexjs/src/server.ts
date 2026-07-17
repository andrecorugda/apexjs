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
// Authorization: roles+permissions (Spatie-style), opaque API tokens (Sanctum-style), auth flows.
export * from './authz/index.js'
// Cache subsystem (memory + file drivers, TTL, tags).
export * from './cache/index.js'
export {
  type ApexServerHooks,
  defineHooks,
  type ErrorContext,
  type RequestLogEntry,
} from './hooks/define.js'
// Mail (memory/http/smtp transports + presets + template helper).
export * from './mail/index.js'
// Multi-channel notifications (database channel + pluggable mail/custom channels).
export {
  type BoundNotification,
  buildMigrationSql as buildNotificationsMigrationSql,
  type Channel,
  type ChannelInput,
  createNotifier,
  type DatabaseChannel,
  type DatabaseChannelConfig,
  databaseChannel,
  defineNotification,
  type Notifiable,
  type NotificationContext,
  type NotificationDbHandle,
  type NotificationDescriptor,
  type NotificationFactory,
  type Notifier,
  type NotifierChannels,
  type NotifierConfig,
  type StoredNotification,
} from './notifications/index.js'
// Production server building blocks — run the built app as a standalone server
// or wrap it for a serverless target (Vercel, etc.).
export {
  createProdApp,
  createProdNodeHandler,
  createProdWebHandler,
  startProdServer,
} from './prod/server.js'
export { gracefulShutdown, onShutdown } from './prod/shutdown.js'
// Background job queue (memory + database drivers, retries/backoff, scheduling).
export {
  buildMigrationSql as buildQueueMigrationSql,
  createDatabaseDriver as createQueueDatabaseDriver,
  createMemoryDriver as createQueueMemoryDriver,
  createQueue,
  defineJob,
  type EnqueueOptions,
  type JobContext,
  type JobDefinition,
  type JobRecord,
  type JobStatus,
  type ProcessResult,
  type Queue,
  type QueueConfig,
  type QueueDbHandle,
  type QueueDriver,
  type SqlValue,
  type WorkHandle,
  type WorkOptions,
} from './queue/index.js'
// Real-time SSE broadcasting (pub/sub hub + h3 handler + browser client).
export * from './realtime/index.js'
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
// File/object storage (local + S3, signed URLs).
export {
  createLocalStorage,
  createS3Storage,
  createStorage,
  type LocalStorageConfig,
  type PutOptions,
  presignGetUrl,
  type S3StorageConfig,
  type Storage,
  type StorageConfig,
  type StorageEntry,
  StoragePathError,
  signRequest,
  type UrlOptions,
  verifySignedUrl,
} from './storage/index.js'
