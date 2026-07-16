// Runtime configuration — the client-safe half of Apex's config system.
//
// This module is dependency-light (no `node:fs`) so it can be imported in the
// browser. The server-only loader (reads apex.config.ts + .env) lives in
// ./resolve.ts and is never bundled to the client.

// Type-only import (erased at build) — keeps this browser-safe module free of any node/h3 code.
import type { SecurityConfig } from '../security/config.js'

/** A runtime-config object. Top-level keys are private (server-only); `public` is exposed to the client. */
export interface RuntimeConfig {
  /** Values under `public` are serialized into the page and readable in the browser. */
  public?: Record<string, unknown>
  /**
   * Production-server hardening knobs (security headers/CSP/HSTS, rate limiting, CORS, body-size
   * cap, server timeouts). Server-only — never serialized to the client. Every layer is on by
   * default; see {@link SecurityConfig}. Env-overridable via `APEX_SECURITY_*`.
   */
  security?: SecurityConfig
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
  /**
   * Internationalization. Declare your locales + default; put catalogs in
   * `locales/<locale>.json`. A `/<locale>` path prefix or `Accept-Language` selects
   * the active locale, and `t` is available in loaders, templates, and the client.
   */
  i18n?: { defaultLocale: string; locales: string[] }
  /**
   * Progressive Web App (🟡 Experimental). When set, `apex build` emits a
   * `manifest.webmanifest` + a service worker (`sw.js`) that precaches the built
   * pages/assets — the app becomes installable and works offline — and the HTML
   * shells link the manifest, theme color, and worker registration automatically.
   * Icons default to `/icons/pwa-192.png` / `/icons/pwa-512.png` (+ a maskable
   * 512) — `apex extend pwa` scaffolds them.
   */
  pwa?: PwaConfig
  [key: string]: unknown
}

/** The `pwa` block of `apex.config.ts` (🟡 Experimental). */
export interface PwaConfig {
  /** Full app name (install prompts, splash). */
  name: string
  /** Short name for the home screen (defaults to `name`). */
  shortName?: string
  /** Browser-chrome theme color (defaults to `#0a0e1a`). */
  themeColor?: string
  /** Splash background color (defaults to `themeColor`). */
  backgroundColor?: string
  description?: string
  /** Manifest icons; defaults to the `apex extend pwa` set under `/icons/`. */
  icons?: Array<{ src: string; sizes: string; type?: string; purpose?: string }>
}

/**
 * The `<head>` fragments the HTML shells inject when `pwa` is configured. Lives here (not in
 * build/pwa.ts) so the RENDERERS — which also run inside the mobile bundle on a bare engine —
 * never import node:fs/node:crypto at module level.
 */
export function pwaHeadTags(pwa: PwaConfig): string {
  const theme = pwa.themeColor ?? '#0a0e1a'
  return `<link rel="manifest" href="/manifest.webmanifest" />\n  <meta name="theme-color" content="${theme}" />`
}

/** The service-worker registration snippet the shells embed when `pwa` is configured. */
export function pwaRegisterScript(): string {
  return `<script>if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))</script>`
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
