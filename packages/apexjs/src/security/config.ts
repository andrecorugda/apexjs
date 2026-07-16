// Resolved security configuration for the production server. Pure data + a resolver with
// defaults — NO node/h3 imports, so this stays importable in the browser bundle (it is a
// leaf of the `RuntimeConfig` type). The h3 wiring that consumes it lives in ./middleware.ts.
//
// Every layer is on by default and individually opt-out-able. Apps tune it under
// `runtimeConfig.security` in apex.config.ts (env-overridable via `APEX_SECURITY_*`).

/** HSTS (`Strict-Transport-Security`) options — emitted in production only. */
export interface HstsConfig {
  /** max-age in seconds. Default 15552000 (180 days). 0 disables HSTS. */
  maxAge?: number
  /** Add `includeSubDomains`. Default true. */
  includeSubDomains?: boolean
  /** Add `preload` (only if you've submitted to the HSTS preload list). Default false. */
  preload?: boolean
}

/** Response-header hardening. */
export interface HeadersConfig {
  /** Master switch for the header layer. Default true. */
  enabled?: boolean
  /** Extra headers merged over (and able to override) the built-in set. */
  extra?: Record<string, string>
  /**
   * `Content-Security-Policy` value. A conservative baseline is applied by default (it keeps
   * Alpine working — see {@link DEFAULT_CSP}). Set to `''` to omit the header, or tighten it.
   */
  contentSecurityPolicy?: string
  /** HSTS — production only. */
  hsts?: HstsConfig
}

/** Fixed-window rate limiting in front of `/api` + `/mcp`. IP-keyed. */
export interface RateLimitConfig {
  /** Master switch for the rate-limit layer. Default true. */
  enabled?: boolean
  /** Requests per window for the general `/api` + `/mcp` bucket. Default 120. */
  limit?: number
  /** Window length in ms for the general bucket. Default 60000. */
  windowMs?: number
  /** Requests per window for the stricter auth bucket. Default 10. */
  authLimit?: number
  /** Window length in ms for the auth bucket. Default 60000. */
  authWindowMs?: number
  /** Path prefixes routed to the stricter auth bucket. Default `['/api/login','/api/auth']`. */
  authPaths?: string[]
}

/** Deny-by-default CORS for `/api` + `/mcp`. */
export interface CorsConfig {
  /** Off by default — same-origin apps need no CORS, and a missing ACAO header blocks browsers. */
  enabled?: boolean
  /** Allowed origins. Use `['*']` for any origin (incompatible with `credentials`). */
  origins?: string[]
  /** Allowed methods for preflight. Default `['GET','POST','PUT','PATCH','DELETE','OPTIONS']`. */
  methods?: string[]
  /** Allowed request headers for preflight. Default `['Content-Type','Authorization','Idempotency-Key']`. */
  headers?: string[]
  /** Emit `Access-Control-Allow-Credentials: true`. Default false. */
  credentials?: boolean
  /** Preflight cache seconds (`Access-Control-Max-Age`). Default 86400. */
  maxAge?: number
}

/** The `runtimeConfig.security` block. All layers default ON (except CORS). */
export interface SecurityConfig {
  /** Master kill-switch for ALL default hardening. Default true. */
  enabled?: boolean
  headers?: HeadersConfig
  rateLimit?: RateLimitConfig
  cors?: CorsConfig
  /** Max request body size in bytes for `/api` + `/mcp` (413 over the cap). Default 1000000 (1 MB). */
  bodyLimitBytes?: number
  /** Node server per-request timeout in ms (`server.requestTimeout`). Default 30000. */
  requestTimeoutMs?: number
  /** Node server headers timeout in ms (`server.headersTimeout`). Default 35000. */
  headersTimeoutMs?: number
  /** Node server keep-alive timeout in ms (`server.keepAliveTimeout`). Default 5000. */
  keepAliveTimeoutMs?: number
  /** Cap on concurrent sockets (`server.maxConnections`). Default 0 = unlimited. */
  maxConnections?: number
}

/** A conservative baseline CSP: locks down `object`/`base`/frame-ancestors while leaving
 * `'unsafe-inline'`/`'unsafe-eval'` on scripts+styles — Alpine (the client runtime) evaluates
 * `x-*` expressions via `Function`, and the SSR shell seeds config through an inline `<script>`.
 * Security-conscious apps should tighten this (nonces/hashes) via `security.headers.contentSecurityPolicy`. */
export const DEFAULT_CSP =
  "default-src 'self'; base-uri 'self'; frame-ancestors 'self'; object-src 'none'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'"

/** The fully-resolved config — every field present, defaults filled in. */
export interface ResolvedSecurity {
  enabled: boolean
  headers: {
    enabled: boolean
    extra: Record<string, string>
    contentSecurityPolicy: string
    hsts: { maxAge: number; includeSubDomains: boolean; preload: boolean }
  }
  rateLimit: {
    enabled: boolean
    limit: number
    windowMs: number
    authLimit: number
    authWindowMs: number
    authPaths: string[]
  }
  cors: {
    enabled: boolean
    origins: string[]
    methods: string[]
    headers: string[]
    credentials: boolean
    maxAge: number
  }
  bodyLimitBytes: number
  requestTimeoutMs: number
  headersTimeoutMs: number
  keepAliveTimeoutMs: number
  maxConnections: number
}

/** Read the security block off a runtimeConfig and fill in every default. */
export function resolveSecurityConfig(cfg?: SecurityConfig): ResolvedSecurity {
  const s = cfg ?? {}
  const h = s.headers ?? {}
  const rl = s.rateLimit ?? {}
  const cors = s.cors ?? {}
  return {
    enabled: s.enabled !== false,
    headers: {
      enabled: h.enabled !== false,
      extra: h.extra ?? {},
      contentSecurityPolicy: h.contentSecurityPolicy ?? DEFAULT_CSP,
      hsts: {
        maxAge: h.hsts?.maxAge ?? 15552000,
        includeSubDomains: h.hsts?.includeSubDomains !== false,
        preload: h.hsts?.preload === true,
      },
    },
    rateLimit: {
      enabled: rl.enabled !== false,
      limit: rl.limit ?? 120,
      windowMs: rl.windowMs ?? 60000,
      authLimit: rl.authLimit ?? 10,
      authWindowMs: rl.authWindowMs ?? 60000,
      authPaths: rl.authPaths ?? ['/api/login', '/api/auth'],
    },
    cors: {
      enabled: cors.enabled === true,
      origins: cors.origins ?? [],
      methods: cors.methods ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      headers: cors.headers ?? ['Content-Type', 'Authorization', 'Idempotency-Key'],
      credentials: cors.credentials === true,
      maxAge: cors.maxAge ?? 86400,
    },
    bodyLimitBytes: s.bodyLimitBytes ?? 1_000_000,
    requestTimeoutMs: s.requestTimeoutMs ?? 30000,
    headersTimeoutMs: s.headersTimeoutMs ?? 35000,
    keepAliveTimeoutMs: s.keepAliveTimeoutMs ?? 5000,
    maxConnections: s.maxConnections ?? 0,
  }
}

/** Build the HSTS header value from resolved HSTS options (empty string when disabled). */
export function hstsHeaderValue(hsts: ResolvedSecurity['headers']['hsts']): string {
  if (hsts.maxAge <= 0) return ''
  let v = `max-age=${hsts.maxAge}`
  if (hsts.includeSubDomains) v += '; includeSubDomains'
  if (hsts.preload) v += '; preload'
  return v
}
