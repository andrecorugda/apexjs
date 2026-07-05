// Runtime configuration — the client-safe half of Apex's config system.
//
// This module is dependency-light (no `node:fs`) so it can be imported in the
// browser. The server-only loader (reads apex.config.ts + .env) lives in
// ./resolve.ts and is never bundled to the client.

/** A runtime-config object. Top-level keys are private (server-only); `public` is exposed to the client. */
export interface RuntimeConfig {
  /** Values under `public` are serialized into the page and readable in the browser. */
  public?: Record<string, unknown>
  [key: string]: unknown
}

/** The shape of `apex.config.ts`'s default export. */
export interface ApexConfig {
  /**
   * Config resolved at runtime. Declare defaults here (the structure), then
   * override any leaf from the environment — `APEX_<KEY>` for private keys and
   * `APEX_PUBLIC_<KEY>` for `public` keys (camelCase ↔ SCREAMING_SNAKE).
   */
  runtimeConfig?: RuntimeConfig
  /**
   * Client-side navigation (SPA link nav + prefetch + progress bar). On by
   * default; set `false` to fall back to full-page loads.
   */
  clientNav?: boolean
  [key: string]: unknown
}

/** Author an `apex.config.ts`. Identity function — exists for types + discoverability. */
export function defineConfig(config: ApexConfig): ApexConfig {
  return config
}

const SERVER_KEY = '__APEX_RUNTIME_CONFIG__'
const CLIENT_KEY = '__APEX_CONFIG__'

/** Server-side: stash the fully-resolved runtime config for `useRuntimeConfig()`. */
export function setRuntimeConfig(cfg: RuntimeConfig): void {
  ;(globalThis as Record<string, unknown>)[SERVER_KEY] = cfg
}

/** The `<script>` payload that seeds the public config for the client. */
export function clientConfigScript(publicConfig: Record<string, unknown>): string {
  return `<script>window.${CLIENT_KEY}=${JSON.stringify({ public: publicConfig }).replace(/</g, '\\u003c')}</script>`
}

/**
 * Read the runtime config. On the server this is the full config (private +
 * public); in the browser it's the `public` subset seeded by the SSR shell.
 * Mirrors Nuxt's `useRuntimeConfig()` — access public values as `config.public.*`.
 */
export function useRuntimeConfig(): RuntimeConfig {
  if (typeof window !== 'undefined') {
    return (
      ((window as unknown as Record<string, unknown>)[CLIENT_KEY] as RuntimeConfig) ?? {
        public: {},
      }
    )
  }
  return ((globalThis as Record<string, unknown>)[SERVER_KEY] as RuntimeConfig) ?? { public: {} }
}

/**
 * Read a raw environment variable with an optional fallback — the Laravel-style
 * `env('KEY', default)` escape hatch for values not declared in `runtimeConfig`.
 * Server-only in practice (returns the fallback in the browser).
 */
export function env(key: string, fallback?: string): string | undefined {
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key]
  }
  return fallback
}
