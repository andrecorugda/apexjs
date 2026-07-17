# create-apexjs

## 0.7.3

### Patch Changes

- PWA: generate the installable app icons from the app's `public/favicon.svg` at `apex build`
  (via `@resvg/resvg-js`), instead of shipping Apex-robot default icons. Change your favicon and
  the 192/512/maskable icons follow; drop your own PNGs in `public/icons/` to override. `apex
extend pwa` adds the (lazy, optional) rasterizer dep. Also: `apex dev` now unregisters any
  stale service worker + clears its caches on every page, so a lingering PWA `sw.js` on
  `localhost:<port>` can't keep serving cached/broken modules across reloads or app switches.

## 0.7.2

### Patch Changes

- Scaffold new apps with `@apex-stack/kit` as a direct dependency, so the documented
  `import { image } from '@apex-stack/kit'` (feature #18) resolves out of the box in a fresh
  app instead of failing with `ERR_MODULE_NOT_FOUND` under pnpm's strict `node_modules`.

## 0.7.1

### Patch Changes

- 62c02bc: Mobile fixes from a real on-device build (canvas game APK):

  - **Build shims** (`apex build --mobile`): the bundled `fs/promises` shim now exports `rm` (and the
    full surface, so no lib's named import breaks the build), and `require('crypto')` / `require('node:crypto')`
    return a working shim (`randomBytes`/`randomUUID`/`getRandomValues`/`timingSafeEqual`; hash fns fail loud
    instead of crashing boot). `require()` also normalizes the `node:` prefix. Previously these were a build
    error (`rm` missing) and an on-device boot crash (`require('crypto')`).
  - **Native shell asset serving** (Android `ApexInterceptor` + iOS `ApexSchemeHandler`): the WebView/scheme
    handler now serves **any** bundled static file (sprites, audio, images, fonts, manifest…), not just
    `/assets/` + favicon — extensionless paths still route to the SSR engine. Fixed the iOS nested-path bug
    (subdir was only the last component) and expanded the MIME map (image/audio/video/font/wasm). Previously
    non-`/assets/` files 404'd on-device → broken `<img>` → canvas `drawImage` threw.
  - **Docs**: bumped the stale site version (v0.17 → v0.43) + example deps, and documented the
    `<script client>` island-scope gotcha (imports are page-root-only, not in `client:*` islands).

## 0.7.0

### Minor Changes

- 1a93618: Scaffolds now use real, versioned migration files instead of pushing the schema from the model.
  `db/index.ts`'s `init` runs `applyMigrations(handle, 'db/migrations')` on the server/dev (the tracked
  `.sql` files, recorded in the `_apex_migrations` ledger so each runs once and `apex migrate` shares
  it) and only falls back to `model.migrationSql()` on-device (the mobile bundle has no filesystem).
  The data feature ships a real first migration (`0001_create_messages.sql`); `apex make model`'s
  generated migration now quotes identifiers (matching `defineModel`'s own SQL — fixes Postgres
  camelCase drift) and is actually applied. Local dev defaults to a persistent `file:./data.db`
  (data + history survive restarts); `*.db` is gitignored.

## 0.6.12

### Patch Changes

- d03d1d2: Install feature dependencies during scaffolding. Features (`--data`, `--auth`, …) merge new
  dependencies into `package.json` after the initial install — the scaffolder now runs the package
  manager again so a fresh `--data` app starts without a manual `npm install`
  (previously: `ERR_MODULE_NOT_FOUND: @apex-stack/data` on first run).

## 0.6.11

### Patch Changes

- c59dba1: Offer the PWA feature during scaffolding — `npm create apexjs@latest my-app --pwa` (or answer the
  new prompt) applies `apex extend pwa` after install, like the other features.

## 0.6.10

### Patch Changes

- bdccb37: PWA support (#15). 🟡 Experimental. Declare a `pwa` block and `apex build` makes the app
  installable + offline:

  ```ts
  export default defineConfig({
    pwa: { name: "My Apex App" },
  });
  ```

  - The build emits `manifest.webmanifest` + a small generated **service worker** (`sw.js`) that
    precaches the built site — content-hashed cache name, so a new deploy activates a fresh cache
    and cleans the old one. The HTML shells (default + islands) automatically link the manifest and
    theme color and register the worker.
  - `apex build` / `--islands` precache the whole dist (full offline). `apex build --server`
    precaches assets; pages are served network-first with a cache fallback, and `apex start` serves
    the correct `application/manifest+json` MIME + `Cache-Control: no-cache` on `/sw.js`.
  - **`apex extend pwa`** scaffolds default icons (`public/icons/pwa-{192,512,maskable-512}.png`)
    and the config block; also offered by `apex new` (or `--pwa`). `gen-mobile-assets` emits the PWA
    sizes from `--icon` too.

  Zero new dependencies — the worker is generated (~60 lines) rather than pulling in
  vite-plugin-pwa/workbox, since Apex's HTML shells are string-built (no index.html to transform)
  and the precache list is fully known at build time.

## 0.6.9

### Patch Changes

- 71b4ecf: Close the last two "mobile out of the box" gaps a fresh app hit:

  - **On-device SQLite wasn't installed.** The data feature now adds `sql.js` — so `apex build
--mobile` bundles the on-device database and the guestbook works offline without a manual
    `npm i sql.js`.
  - **`/splash` 404'd on launch.** `apex mobile android` / `ios` now scaffold a branded default
    `pages/splash.alpine` when the app has none (delete it to opt out), so the shell's splash route
    exists.

  Also: `apex mobile android` / `ios` now **rebuild the bundle by default** so it's never stale after
  an app change (pass `--no-build` to reuse the existing `dist/mobile`).

## 0.6.8

### Patch Changes

- c0427ec: Fix three blockers that stopped a freshly-scaffolded app from going mobile:

  - **Scaffold DB used top-level await.** `apex new` (data feature) shipped a `db/index.ts` with
    `await createDb(…)`, which fails `apex build --mobile` (`Top-level await … not supported with the
"iife" output format`). It now uses `lazyDb()` — no top-level await — matching the showcase.
  - **Unused DB drivers were bundled for mobile.** `apex build --mobile` followed `createDb`'s
    `drizzle-orm/pglite` / `postgres-js` / `libsql` imports and tried to bundle them, failing with
    `Could not resolve "@electric-sql/pglite"` on a libsql/sqlite app that never installed it. Those
    drivers are now externalized in the mobile bundle (the on-device path uses sql.js); the bundle is
    also smaller.
  - **A custom `--appId` produced a non-launching APK.** `apex mobile android --appId <id>` set the
    gradle `namespace` to the custom id while the Kotlin sources stay `site.apexjs.shell`, so
    `.MainActivity` resolved to `<id>.MainActivity` → `ClassNotFoundException` at launch. Now only
    `applicationId` (the install identity) changes; `namespace` stays matched to the sources. The
    `--appId` flag also accepts `--app-id`.

## 0.6.7

### Patch Changes

- 85580f5: `createTestApp` no longer lets one unresolvable `/api` route crash every test with a cryptic error.

  Previously, a single route whose import didn't resolve — e.g. a generated model route that
  needs `@apex-stack/data` before it's installed — failed the whole app boot with a raw ESM
  "Cannot find module", and the co-generated tests' `afterAll(() => app.close())` then threw a
  second, masking `TypeError`. So an unrelated `auth`/`api` test would fail with two confusing
  errors.

  - **Clear, actionable error (default).** A route that fails to load now throws a message naming
    the route file, the module that couldn't resolve, and how to install it
    (`npm i @apex-stack/data @libsql/client`).
  - **`createTestApp({ root, lenientRoutes: true })`** — opt in to skip unresolvable routes (with a
    warning) and boot the rest of the surface, e.g. to test `auth` without installing the data layer.
  - **Hardened generated tests.** `api` / `auth` co-generated tests use `afterAll(() => app?.close())`,
    so a failed `beforeAll` surfaces its own error without a masking teardown throw.
  - **Docs/AGENTS** use `Article` (not `Post`) in `apex make model` examples — the starter ships a
    `posts` demo, so `Post` collided — and note that a model route needs `@apex-stack/data` installed
    to be test-mountable.

## 0.6.6

### Patch Changes

- ebf6f3b: `apex make model` normalizes the resource to lowercase-plural.

  `apex make model Post` now scaffolds a PascalCase file (`models/Post.ts`) whose
  `defineModel` uses a lowercase-plural resource — `defineModel('posts', …)` → REST at
  `/api/posts`, table `posts`, MCP tools `posts_*` — regardless of how the name is typed
  (`Post` / `post` / `posts` all → `posts`, `Category` → `categories`). Matches the
  Rails/Prisma convention and `apex make composable Post` → `usePosts()`, so the whole
  model→REST→MCP→client chain reads consistently. Previously the name was used verbatim,
  so `apex make model Post` produced a capitalized `/api/Post` route.

## 0.6.5

### Patch Changes

- 82a7597: Generate a typed client data-hook from a model (`apex make composable`).

  - **New runtime factory** `createResourceClient<T>(name, opts?)` (exported from
    `@apex-stack/core/client`) — a reactive Alpine data object you spread into an
    `x-data`, exposing `items / current / loading / error` plus
    `fetch / find / create / update / remove`, wired to the model's `/api/<name>`
    REST resource and keeping the local list in sync.
  - **New generator** `apex make composable <Model>` reads `models/<Model>.ts` and
    emits `composables/use<Plural>.ts` — a typed `usePosts()` wrapper with the item
    interface + create-payload type lifted from `defineModel` (behaviors like
    `timestamps()` / `softDeletes()` are reflected in the shape). Also exposed as an
    MCP tool kind for AI agents.

  One `defineModel` now spans schema + migration + REST + MCP **and** the browser.
  Additive — no change to the Stable API surface.

## 0.6.4

### Patch Changes

- 3d37eb1: `.alpine` components are now strictly TypeScript.

  The `<script>` parser rejects `lang="js"` (and any non-`ts` value) with a clear
  error — `lang` is optional and always defaults to `ts`. This removes the
  ambiguity of a JS/TS toggle that never fully worked (loaders, `head()`, and
  composables were always type-checked as TS regardless of the attribute).

  Templates, examples, and docs are swept to bare `<script server>` /
  `<script client>` (no redundant `lang="ts"`).

## 0.6.3

### Patch Changes

- feat(client): `app.client.ts` hook — register Alpine plugins, directives & magics

  An optional `app.client.ts` at the app root, default-exporting `(Alpine) => void`,
  now runs **before `Alpine.start()`** in every client bootstrap — dev, production
  build, and islands. This unlocks the official Alpine plugin ecosystem (`$persist`,
  `x-intersect`, `x-collapse`, `x-mask`, `x-trap`, `morph`, `sort`, `anchor`) plus
  custom `Alpine.directive()` / `Alpine.magic()` — none of which had a registration
  point before.

  ```ts
  // app.client.ts
  import persist from "@alpinejs/persist";
  export default (Alpine) => {
    Alpine.plugin(persist);
  };
  ```

  - `apex make client` scaffolds it; the `apex_make` MCP tool gains the `client` kind,
    so an AI agent can add it too.
  - **Additive & opt-in** — apps without the file are byte-identical; the public API
    contract stays green (documented in `API.md` as a 🟡 Experimental convention).
  - Verified end-to-end: a custom magic + directive registered via `app.client.ts`
    work in `apex dev`, `apex build` (served), and `apex build --islands`.

## 0.6.2

### Patch Changes

- feat(components): group components in folders (Nuxt-style, folder-namespaced tags)

  `components/` is now scanned recursively, so you can organize components into
  subfolders. Nested components are namespaced by folder, Nuxt-style, with overlapping
  segments deduped: `components/ui/Card.alpine` → `<UiCard/>`,
  `components/base/BaseButton.alpine` → `<BaseButton/>`. **Top-level components are
  unchanged** (`components/Card.alpine` → `<Card/>`), so existing apps are unaffected.
  A build-time error is thrown if two files resolve to the same tag.

  CLI: `apex make component ui/Navbar` and `apex add ui/button` now accept a folder
  path (creating it if missing), matching how `apex make page` already worked.

  AI-native: `apex_project_info` reports each component's resolved `<Tag>` name, and
  the `apex_make`/`apex_add` tool descriptions document folder paths — so an agent
  knows to write `<UiCard/>` for `components/ui/Card.alpine`. Additive; the public API
  contract stays green.

## 0.6.1

### Patch Changes

- fix(scaffold): guard `params.slug` in the blog `[slug].alpine` so a fresh app type-checks clean

  The scaffolded `pages/blog/[slug].alpine` passed `params.slug` straight to
  `posts.bySlug(...)`, but the scaffold's tsconfig enables `noUncheckedIndexedAccess`,
  so `params.slug` is `string | undefined` — a real `TS2345`. It was invisible until
  `apex check --alpine` started type-checking `.alpine` script blocks; now a brand-new
  app would fail its own `apex check --alpine`. Guarded the access
  (`params.slug ? posts.bySlug(params.slug) : null`). Fixes both scaffolders
  (`npm create apexjs` and `apex new`, which bundles the same template).

## 0.6.0

### Minor Changes

- feat: `npm create apexjs` feature parity + richer `apex_project_info`

  **create-apexjs** now supports the optional-feature selection that `apex new`
  always had: pass `--data` / `--auth` / `--i18n` (or answer the interactive
  prompt) and the scaffolder applies them via `apex extend` after install, landing
  them in the initial commit. Previously these flags were silently ignored by the
  `npm create apexjs` path — the two entry points are now at parity.

  **`apex_project_info`** (the MCP tool agents read before writing) now returns
  _shape_, not just an inventory: API routes carry their `method`, mounted `path`,
  and `mcp`/`auth` flags (and whether they're a route or a model resource); models
  carry their `table`, `fields` (name/type/notNull/default), and `behaviors`. An
  agent can now act — "add a `views:int` field to `Post`" — without opening files.
  Best-effort static parse; never throws. Additive; API contract stays green.

## 0.5.3

### Patch Changes

- **AI-native tooling (Apex Compass + CLI-as-MCP).** New `apex mcp-server` runs an MCP
  server (stdio) that exposes the Apex CLI as tools — `apex_make`, `apex_extend`,
  `apex_add`, `apex_build`, `apex_list` — so an AI agent scaffolds/extends/builds an app
  by calling structured tools instead of hand-writing files. Point any agent host at
  `apex mcp-server`. Scaffolded apps now include an `AGENTS.md` that teaches agents the
  conventions, generators, and APIs (also synced into existing apps by `apex upgrade`).

## 0.5.2

### Patch Changes

- One-command Vercel deploys: `apex build --preset vercel` builds the server target
  and generates `api/index.mjs` (a serverless function serving the whole app via
  `createProdNodeHandler`) + `vercel.json` — commit them and run `vercel deploy`.
  The `data` feature is now Supabase-ready: its `db/index.ts` uses Postgres when
  `DATABASE_URL` is set (in-memory libSQL otherwise), and ships the `postgres` driver.

## 0.5.1

### Patch Changes

- Support Vite 7. `@apex-stack/vite` widens its `vite` peer range to include `^7`
  (still `^5`/`^6`), and `@apex-stack/core` + `create-apexjs` build and run on Vite
  7.3.x. Also bumps `citty` to 0.2.2. No public API changes.

## 0.5.0

### Minor Changes

- 9600a30: Islands mode now applies layouts + `head()`, and the demo scaffold is branded.

  - **Islands fix:** `apex dev --islands` (and the islands build) previously rendered
    the bare page — no layout, no `head()`/SEO — so nav/branding/footer vanished and
    pages looked broken. The page is now wrapped in its layout chain and the whole
    tree (layout + page) runs through the islands walker, so `client:*` directives in
    the layout or page hydrate. Root x-data defaults are available as SSR scope too.
  - **Branded scaffold:** the starter ships the Apex mark (`public/favicon.svg`),
    shows it in the nav + a hero ("Built with Apex JS"), and the shell emits a
    `<link rel="icon">` by default. The demo's interactivity now uses `client:*`
    islands, so it works in BOTH default and islands mode (dark toggle, counter,
    and the reveal all hydrate). Theme also respects `prefers-color-scheme` on first
    visit.
  - **Smarter editor extension prompt:** `apex new` / `apex upgrade` now detect VS
    Code **and its forks** (Cursor, Windsurf, VSCodium) and check the installed
    extension version — they only prompt to _install_ (not present) or _update_
    (older), and stay quiet with an "up to date" note when it's already current.
    Extension icon is the Apex mark.

## 0.4.0

### Minor Changes

- f39ad83: New default scaffold: a real, themed multi-page demo app.

  `create-apexjs` / `apex new` now scaffold a proper starter instead of a bare
  placeholder — a themed layout with a navbar, branding, and a dark-mode toggle; a
  landing page; a blog (list + dynamic `[slug]` detail) served from a sample-data
  `PostService` (no database); an About page with SEO via `head()`; bundled themed
  components (Button, Card, Badge, Counter); and an API route that's also an MCP
  tool. The default `build` script targets the server (SSR + dynamic routes + API/
  MCP work in production); `build:static` prerenders the static pages. Verified via
  a fresh install: dev, server build + start, typecheck, and tests all green.

## 0.3.0

### Minor Changes

- 26d83ca: Turnkey styling + `apex theme`.

  - **Scaffold is now styled out of the box** — `apex new` apps ship an `app.css` wired for Tailwind v4 (`@import 'tailwindcss'; @source './**/*.alpine';`) with the theme's `@theme` token block, plus `tailwindcss` + `@tailwindcss/vite` dev deps. Components added with `apex add` render themed immediately.
  - **`apex theme`** — write/update your theme tokens in `app.css` (or `--out`): `apex theme --primary '#e11d48' --radius 0.75rem --font-title '"Inter"'`. It edits a managed `/* apex-theme:start … end */` block, so every component restyles at once. No flags re-applies the default theme. (`@apex-stack/theme` is bundled into the CLI, so it works from a global install.)
  - `apex add` now nudges you to run `apex theme` if the project isn't Tailwind-wired yet.

## 0.2.0

### Minor Changes

- f1a7eca: Runtime configuration from `apex.config.ts` + `.env` (Nuxt/Laravel-style).

  - **`apex.config.ts`** with `defineConfig({ runtimeConfig })` — declare defaults; `public` values reach the browser, everything else is server-only.
  - **`.env` loading** — `.env`, `.env.<mode>`, `.env.local`, `.env.<mode>.local` (later wins), real env vars are never clobbered. Any declared leaf is overridden from the environment: `APEX_<KEY>` (private) / `APEX_PUBLIC_<KEY>` (public), camelCase ↔ SCREAMING_SNAKE, with type coercion.
  - **`useRuntimeConfig()`** — full config on the server, the `public` subset in the browser (seeded into the page, `</script>`-escaped). **`env('KEY', fallback)`** is the raw escape hatch.
  - **`config` in context** — page `loader({ config })`, `head({ config })`, and every `defineApexRoute` / resource handler (`{ input, config }`) — REST **and** MCP tool calls. Private values never ship to the client.
  - Wired through dev, prod (`apex start` applies deploy-time env over baked defaults), and the static/server build. The scaffold ships `apex.config.ts` + `.env.example` and gitignores real `.env` files.
