import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Optional feature "recipes". Each bundles a set of files (templates/features/<key>)
// plus the wiring to slot them into an app — dependencies, apex.config.ts edits,
// .env keys, and nav links. Used by three commands: `apex new` (interactive
// prompts), `apex add <feature>`, and `apex upgrade` (offers missing ones).
// Every recipe is idempotent: `detect()` short-circuits anything already present,
// and each patch is guarded, so re-running is a no-op.

const FEATURES_DIR = fileURLToPath(new URL('../templates/features', import.meta.url))
const NAV_CLASS =
  'rounded-radius px-3 py-1.5 text-sm font-medium hover:bg-surface-alt dark:hover:bg-surface-dark-alt'

export interface Feature {
  key: string
  title: string
  /** One line: what this brings (shown in the `apex new` prompt). */
  summary: string
  /** True when the feature is already installed in `root` — never offered/re-applied. */
  detect: (root: string) => boolean
  deps?: Record<string, string>
  navLinks: { href: string; label: string }[]
  patchConfig?: (src: string) => string
  patchEnv?: (src: string) => string
}

function read(p: string): string {
  return existsSync(p) ? readFileSync(p, 'utf8') : ''
}

export const FEATURES: Record<string, Feature> = {
  data: {
    key: 'data',
    title: 'Data & models',
    summary:
      'a DB-backed model (defineModel) → SQLite/libSQL + migrations + REST & MCP CRUD, with a live /guestbook demo',
    detect: (root) =>
      existsSync(join(root, 'models')) || existsSync(join(root, 'server/api/messages.ts')),
    deps: {
      '@apex-stack/data': 'latest',
      '@libsql/client': '^0.17.4', // local dev (in-memory)
      postgres: '^3.4.5', // production: Supabase/Neon via DATABASE_URL
      'drizzle-orm': '^0.45.2',
      'sql.js': '^1.13.0', // on-device SQLite for `apex build --mobile` (pure-JS/asm.js)
    },
    navLinks: [{ href: '/guestbook', label: 'Guestbook' }],
  },

  auth: {
    key: 'auth',
    title: 'Auth',
    summary:
      'sealed-cookie sessions (server/auth.ts) with login/logout, a gated /api/whoami, and an /account page',
    detect: (root) => existsSync(join(root, 'server/auth.ts')),
    navLinks: [{ href: '/account', label: 'Account' }],
    patchConfig: (s) =>
      s.includes('sessionPassword')
        ? s
        : s.replace(
            "apiSecret: '', // ← APEX_API_SECRET",
            "apiSecret: '', // ← APEX_API_SECRET\n    // Seals the session cookie (auth). MUST be ≥32 chars; override in prod.\n    sessionPassword: 'dev-only-change-me-min-32-characters-long', // ← APEX_SESSION_PASSWORD",
          ),
    patchEnv: (s) =>
      s.includes('APEX_SESSION_PASSWORD')
        ? s
        : s.replace(
            'APEX_API_SECRET=',
            'APEX_API_SECRET=\n# Seals the session cookie — MUST be at least 32 characters. Change in production.\nAPEX_SESSION_PASSWORD=dev-only-change-me-min-32-characters-long',
          ),
  },

  i18n: {
    key: 'i18n',
    title: 'i18n',
    summary:
      'server-side translation from locales/*.json (a /fr path prefix selects the catalog), with a /hello demo',
    detect: (root) =>
      existsSync(join(root, 'locales')) || read(join(root, 'apex.config.ts')).includes('i18n:'),
    navLinks: [{ href: '/hello', label: 'i18n' }],
    patchConfig: (s) =>
      s.includes('i18n:')
        ? s
        : s.replace(
            /\n\}\)\s*$/,
            "\n\n  // Internationalization — catalogs in locales/<locale>.json; a /<locale>\n  // path prefix (or Accept-Language) selects the active locale.\n  i18n: {\n    defaultLocale: 'en',\n    locales: ['en', 'fr'],\n  },\n})\n",
          ),
  },

  pwa: {
    key: 'pwa',
    title: 'PWA',
    summary:
      'installable + offline (🟡): apex build emits manifest.webmanifest + a precache service worker; icons generated from your favicon',
    detect: (root) => read(join(root, 'apex.config.ts')).includes('pwa:'),
    // `apex build` rasterizes public/favicon.svg → dist/icons/ via @resvg/resvg-js (added below).
    deps: { '@resvg/resvg-js': '^2.6.2' },
    navLinks: [],
    patchConfig: (s) =>
      s.includes('pwa:')
        ? s
        : s.replace(
            /\n\}\)\s*$/,
            "\n\n  // Progressive Web App (🟡 Experimental) — `apex build` emits a web manifest +\n  // a precache service worker: installable, works offline. Icons are generated from\n  // public/favicon.svg (change it → the app icons follow); or drop your own PNGs in\n  // public/icons/pwa-{192,512,maskable-512}.png to override.\n  pwa: {\n    name: 'My Apex App',\n  },\n})\n",
          ),
  },
}

export function isFeature(key: string): boolean {
  return key in FEATURES
}

export function featureKeys(): string[] {
  return Object.keys(FEATURES)
}

export function featureList(): Feature[] {
  return Object.values(FEATURES)
}

/** Typed lookup: returns the feature (throws on an unknown key). */
export function getFeature(key: string): Feature {
  const f = FEATURES[key]
  if (!f) throw new Error(`Unknown feature: ${key}`)
  return f
}

/**
 * Add a feature's files + wiring into the app at `root`. Idempotent: returns
 * false (and changes nothing) if the feature is already present.
 */
export function applyFeature(
  root: string,
  key: string,
  log: (m: string) => void = () => {},
): boolean {
  const f = getFeature(key)
  if (f.detect(root)) {
    log(`  • ${f.title} already present — skipped`)
    return false
  }

  // 1. Copy the recipe's files, if it ships any (merges into existing dirs; no base-file
  // collisions). Some recipes are config/deps-only (e.g. PWA, whose icons are generated from
  // the favicon at build) and have no template dir — skip the copy rather than ENOENT.
  const filesDir = join(FEATURES_DIR, key)
  if (existsSync(filesDir)) cpSync(filesDir, root, { recursive: true })

  // 2. Merge dependencies (never downgrade an existing pin).
  if (f.deps) {
    const pkgPath = join(root, 'package.json')
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
      pkg.dependencies = pkg.dependencies ?? {}
      for (const [d, v] of Object.entries(f.deps)) if (!pkg.dependencies[d]) pkg.dependencies[d] = v
      pkg.dependencies = Object.fromEntries(
        Object.entries(pkg.dependencies as Record<string, string>).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      )
      writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
    }
  }

  // 3. Patch apex.config.ts.
  if (f.patchConfig) {
    const cfg = join(root, 'apex.config.ts')
    if (existsSync(cfg)) writeFileSync(cfg, f.patchConfig(readFileSync(cfg, 'utf8')))
  }

  // 4. Patch .env.example.
  if (f.patchEnv) {
    const env = join(root, '.env.example')
    if (existsSync(env)) writeFileSync(env, f.patchEnv(readFileSync(env, 'utf8')))
  }

  // 5. Insert nav links into layouts/default.alpine, just before the About link.
  const layout = join(root, 'layouts/default.alpine')
  if (existsSync(layout) && f.navLinks.length) {
    let s = readFileSync(layout, 'utf8')
    const about = `        <a href="/about" class="${NAV_CLASS}">About</a>`
    for (const { href, label } of f.navLinks) {
      if (s.includes(`href="${href}"`)) continue
      const link = `        <a href="${href}" class="${NAV_CLASS}">${label}</a>`
      if (s.includes(about)) s = s.replace(about, `${link}\n${about}`)
    }
    writeFileSync(layout, s)
  }

  log(`  ✓ Added ${f.title}`)
  return true
}
