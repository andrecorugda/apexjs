// Server-only config resolution: read `.env` files + `apex.config.ts`, then
// override the declared `runtimeConfig` defaults from the environment. Uses
// node:fs, so it must never be imported into a client bundle.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { type ApexConfig, type RuntimeConfig, setRuntimeConfig } from './runtime.js'

/** Minimal `.env` parser: `KEY=value`, `#` comments, optional quotes, `export ` prefix. */
export function parseEnvFile(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line[0] === '#') continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line
      .slice(0, eq)
      .trim()
      .replace(/^export\s+/, '')
    let val = line.slice(eq + 1).trim()
    if ((val[0] === '"' && val.endsWith('"')) || (val[0] === "'" && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

/**
 * Load `.env`, `.env.<mode>`, `.env.local`, `.env.<mode>.local` from `root`
 * (later files win), merge into `process.env` WITHOUT clobbering real env vars
 * already set, and return the effective env map (real `process.env` wins).
 */
export function loadDotenv(
  root: string,
  mode: string = process.env.NODE_ENV || 'development',
): Record<string, string> {
  const merged: Record<string, string> = {}
  for (const file of ['.env', `.env.${mode}`, '.env.local', `.env.${mode}.local`]) {
    const p = join(root, file)
    if (existsSync(p)) Object.assign(merged, parseEnvFile(readFileSync(p, 'utf8')))
  }
  for (const [k, v] of Object.entries(merged)) {
    if (process.env[k] === undefined) process.env[k] = v
  }
  return { ...merged, ...(process.env as Record<string, string>) }
}

function screamingSnake(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toUpperCase()
}

function coerce(def: unknown, raw: string): unknown {
  if (typeof def === 'number') {
    const n = Number(raw)
    return Number.isNaN(n) ? def : n
  }
  if (typeof def === 'boolean') return raw === 'true' || raw === '1'
  return raw
}

/** Override each declared leaf from env: `APEX_<PATH>` (private) / `APEX_PUBLIC_<PATH>` (public). */
function applyOverrides(
  node: Record<string, unknown>,
  env: Record<string, string>,
  prefix: string,
): void {
  for (const [key, val] of Object.entries(node)) {
    if (key === 'public' && prefix === 'APEX_' && val && typeof val === 'object') {
      applyOverrides(val as Record<string, unknown>, env, 'APEX_PUBLIC_')
      continue
    }
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      applyOverrides(val as Record<string, unknown>, env, `${prefix}${screamingSnake(key)}_`)
      continue
    }
    const envKey = `${prefix}${screamingSnake(key)}`
    if (env[envKey] !== undefined) node[key] = coerce(val, env[envKey] as string)
  }
}

/** Apply env overrides to an existing runtimeConfig (used at prod start from baked defaults). */
export function applyEnvToRuntimeConfig(runtimeConfig: RuntimeConfig, root: string): RuntimeConfig {
  const env = loadDotenv(root)
  if (!runtimeConfig.public) runtimeConfig.public = {}
  applyOverrides(runtimeConfig as Record<string, unknown>, env, 'APEX_')
  setRuntimeConfig(runtimeConfig)
  return runtimeConfig
}

export interface ResolvedConfig {
  config: ApexConfig
  runtimeConfig: RuntimeConfig
  publicConfig: Record<string, unknown>
}

/**
 * Resolve the project config: load `.env` files + `apex.config.{ts,js,mjs}`,
 * apply env overrides to the declared `runtimeConfig`, register it globally for
 * `useRuntimeConfig()`, and hand back the full + public views.
 */
export async function resolveApexConfig(
  root: string,
  loadModule: (id: string) => Promise<{ default?: ApexConfig }>,
): Promise<ResolvedConfig> {
  loadDotenv(root)
  let config: ApexConfig = {}
  const file = ['apex.config.ts', 'apex.config.js', 'apex.config.mjs'].find((f) =>
    existsSync(join(root, f)),
  )
  if (file) {
    try {
      config = (await loadModule(`/${file}`)).default ?? {}
    } catch {
      config = {}
    }
  }
  const runtimeConfig: RuntimeConfig = { public: {}, ...(config.runtimeConfig ?? {}) }
  if (!runtimeConfig.public) runtimeConfig.public = {}
  applyEnvToRuntimeConfig(runtimeConfig, root)
  return {
    config,
    runtimeConfig,
    publicConfig: (runtimeConfig.public ?? {}) as Record<string, unknown>,
  }
}
