# @apex-stack/core

## 0.40.0

### Minor Changes

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

## 0.39.0

### Minor Changes

- 6626091: Production APIs: idempotency + a pluggable KV store (#49). 🟡 Experimental.

  - **`Idempotency-Key` support, automatic in `/api`** — send the header on a POST/PUT/PATCH/DELETE
    and the pipeline runs the handler once, replaying the cached `{status, body}` for retries (24h,
    replays carry `x-idempotent-replay: true`). A concurrent duplicate gets `409 request in
progress`; 5xx outcomes are not cached so a retry re-executes. Keys are scoped per route + user
    (the check runs after auth). No header → zero cost, zero behavior change.
  - **`KvStore`** — the tiny async key/value-with-TTL primitive behind both features, with a
    built-in `createMemoryStore()` (single process, zero config). Implement it over Redis (or any
    shared store) for multi-instance deployments: `createProdApp({ idempotencyStore })`, and
    `createTestApp({ entries, idempotencyStore })` for isolated tests.
  - **`createRateLimiter({ store })`** — the existing limiter (unchanged and still synchronous
    without a store) now accepts a shared `KvStore` and returns an `AsyncRateLimiter` enforcing ONE
    global counter across instances, with epoch-aligned fixed windows.

## 0.38.3

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

## 0.38.2

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

## 0.38.1

### Patch Changes

- ef7fbf3: Fix `apex mobile android` in the published package: the `templates/mobile` shell (accidentally
  dropped from the `0.38.0` release) is restored, so the command has a native project to scaffold
  again. Also adds **`apex mobile ios`** — scaffolds the WKWebView + JavaScriptCore iOS shell into
  `mobile/ios`, applies `--app-id`/`--name`, and syncs the bundle assets; generate the Xcode project
  with `xcodegen` and build on a Mac.

## 0.38.0

### Minor Changes

- 99403d6: New `apex mobile android` command — package an app as an offline native Android app in one step.
  It builds the mobile bundle (`apex build --mobile` if needed), scaffolds the native WebView shell
  (the on-device Apex engine, fetch/cookie bridge, and DB persistence) into `mobile/android`, applies
  `--app-id` / `--name`, and syncs the server bundle + client assets into the APK. Pass `--assemble`
  to run `gradle assembleDebug`, or `--icon <file>` to generate launcher icons. The Android shell now
  ships as a template with the package.

### Patch Changes

- 7cd82a9: Mobile: pluggable SSR `fetch` seam for external HTTP (Supabase/Turso/any REST). The mobile
  runtime's server-side `fetch` now uses `globalThis.__APEX_FETCH__` when a network-capable host
  (iOS `JSContext`, RN/Hermes) provides one, and otherwise rejects with guidance instead of an
  opaque error. Client-side `fetch` (from `<script client>`, in the WebView) already reaches the
  network directly — the WebView fetch-patch passes cross-origin requests straight through — so
  `@supabase/supabase-js` and Turso-over-HTTP work today from client code. See the native-shell
  guide's "External APIs & Supabase" section.

## 0.37.0

### Minor Changes

- 3b344ad: Mobile runtime (beta). Run Apex's full SSR + API pipeline on a phone.

  - **`apex dev --mobile`** — the primary mobile dev loop: prints the LAN URL and wires
    `adb reverse` so an emulator/device WebView hits the dev server with live HMR (SSR + API run
    on your machine, like Metro).
  - **`apex build --mobile`** — the offline release bundle: manifest → static module registry +
    a VFS + a pure-JS runtime shim → one self-contained `dist/mobile/server.mjs` that runs on a
    bare on-device engine (Hermes/QuickJS), no Node. Auto-detects + reports routes that need
    on-device drivers (`crypto.subtle` / `@libsql/client/web`).
  - **`createProdApp` / `createProdWebHandler`** accept an optional `loadModule` — the mobile
    seam (a static registry instead of dynamic `import()`). Backward-compatible.

### Patch Changes

- 4c4e830: Fix #51: a page's root `<template>` now carries directives other than `x-data` (`x-init`,
  `x-effect`, `@events`, …) onto the emitted root element, so Alpine runs them on hydration.
  Previously they were silently dropped.

  Fix #52 (mobile): the `apex build --mobile` runtime shim now provides `atob`/`btoa`, a correct
  `Buffer.toString('binary'|'base64')`, and a 4-byte-safe `TextEncoder`/`TextDecoder`, so HTML
  entities (`&nbsp;`, …) decode correctly on a bare on-device engine (they were over-escaped).

- 8901599: Fix #53: a page's `<script client>` top-level side effects (`setTimeout`, `window.*`, event
  wiring) no longer run during server-side rendering. The SSR module now receives a
  declarations-only view of the client body — imports and `const`/`function`/`class`
  declarations are kept so the root `x-data` can still resolve composables, while side-effect
  statements are stripped (they still ship in the client module and run on hydration).
  Previously the full body executed at SSR eval time, which was semantically wrong on the web
  and crashed bare on-device engines (QuickJS/androidx.javascriptengine) with
  `setTimeout is not defined`.

  As defense-in-depth, the `apex build --mobile` runtime shim also stubs the common browser
  globals (`document`, `window`, `localStorage`, `navigator`, `location`, `matchMedia`,
  `requestAnimationFrame`) with inert no-ops, so a rare side-effectful _declaration_ initializer
  that the compiler keeps (e.g. `const t = document.title`, needed as a symbol by `rootData`)
  can't brick the whole app's boot on a bare engine — the real behavior still runs client-side
  in the WebView.

- 9872625: On-device sessions for `apex build --mobile`. Sealed-cookie auth (`login`/`logout`/`sessionAuth`,
  gated routes, `locals.user`) now works offline on a bare engine, which has no WebCrypto:

  - A dependency-free HMAC-SHA256 (verified against `node:crypto`) signs the session cookie when
    `globalThis.__APEX_DEVICE__` is set — the cookie is tamper-proof (signed) rather than encrypted,
    a sound tradeoff on-device where the payload is the user's own session on their own device. On
    a server, the encrypted h3/iron session is unchanged.
  - The mobile bundler no longer drops session/auth modules and restores `middleware` + `auth` in
    the mobile manifest.
  - Runtime-shim fix: the bundle's `Headers` now accepts an array of `[key, value]` pairs (how h3
    emits response headers), so `Set-Cookie` and `Content-Type` reach the client correctly — this
    fixes cookies **and** content-type on the real device, not just sessions.

  Verified E2E on a bare-V8 vm: gated `/api/whoami` returns 401 anonymous / 200 with the user
  after `POST /api/login`, `/account` renders the signed-in name server-side, and `logout` clears
  the session.

- 525d629: On-device database for `apex build --mobile`. DB-backed pages and API routes now run offline on
  a bare engine instead of being dropped from the bundle:

  - **`@apex-stack/data`**: a new `lazyDb(config, { init })` opens a database without top-level
    await (required by the classic-script mobile bundle) — `dialect` is known synchronously and
    the connection opens + seeds on first use, with a deferred Drizzle proxy so `defineResource`
    works unchanged. On-device, `createDb`'s `libsql`/`sqlite` driver transparently uses an
    in-memory **sql.js** SQLite (new optional peer `sql.js`), using its **asm.js** build (pure JS,
    no WebAssembly) so it runs on engines that can't compile WASM — androidx.javascriptengine's
    sandboxed V8 SIGSEGVs on WASM, and QuickJS/Hermes lack it entirely. App code is unchanged.
  - **`@apex-stack/core`** (`apex build --mobile`): the bundler now includes `@apex-stack/data`
    modules (bundling the asm.js SQLite; output is minified); the runtime shim gained
    `URLSearchParams`, `FormData`, a `Request.body` accessor, and `new URL(path, base)`
    base-resolution — so h3 body parsing, query parsing, and host/CSRF resolution work on the
    bare engine.

  Limitation: the on-device database is in-memory (seeded at boot, reset on cold start);
  persistence is a later step.

- Updated dependencies [4c4e830]
- Updated dependencies [8901599]
  - @apex-stack/kit@0.9.1
  - @apex-stack/vite@0.4.1

## 0.36.0

### Minor Changes

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

## 0.35.0

### Minor Changes

- 20f4375: `apex make` now co-generates a test for every logic-bearing kind.

  Previously only `api` / `service` / `model` scaffolded a matching `tests/*.test.ts`.
  Now `store`, `middleware`, `composable`, and `auth` do too (respecting `--no-test`):

  - **store** — instantiates the factory, asserts initial state + an action mutates.
  - **middleware** — calls it with a request ctx, asserts it runs and doesn't redirect by default.
  - **composable** — mocks `fetch`, asserts `fetch()` loads `items` and `create()` appends.
  - **auth** — boots `createTestApp`, asserts the login → logout round-trip (and 401 on empty creds).

  Closes the inconsistency where `apex make composable` (a sibling of `model`/`api`/`service`)
  shipped without a test. Kinds with nothing meaningful to assert (`page`, `component`, `layout`,
  `client`, `migration`) still don't emit one — a `page` route test needs page rendering that the
  test kit doesn't expose yet.

## 0.34.1

### Patch Changes

- f16817e: Fix: `@apex-stack/core/client` now re-exports `resolveRootMagic`.

  0.34.0 shipped the root-x-data magic helper in `@apex-stack/kit` and had the compiler
  emit `import { resolveRootMagic } from '@apex-stack/core/client'` into page glue — but
  core's client barrel forgot to forward the symbol. Any page using a plugin magic in its
  root `x-data` (e.g. `$persist`) then threw `does not provide an export named
'resolveRootMagic'` at module load, so Alpine never hydrated that page (other pages were
  unaffected). The one-line re-export restores it; a new `client.test.ts` locks the barrel
  to the set the compiler imports so this can't regress.

## 0.34.0

### Minor Changes

- 2d8bb33: Polish the two rough edges from the 0.33.0 verify.

  - **Smarter pluralizer** (`apex make model`). The resource normalizer now knows the
    common English irregulars and uncountables in both directions: `Person` → `people`,
    `Child` → `children`, `Datum` → `data`, `Analysis` → `analyses`, `Status` →
    `statuses` (not `stati`); `Sheep` / `Series` stay put. Still idempotent
    (`people` → `people`). Fixes the naive `Person` → `persons` result.

  - **Root x-data magic diagnostic** (#47 follow-up). A plugin magic used in a page's
    root `x-data` now routes through `resolveRootMagic(name, Alpine)` on the client:
    a magic with a global form (`$persist`) works as before; one _without_ a global form
    no longer degrades to a _silent_ no-op — it logs a one-time console warning naming the
    magic and the fix (use a nested `x-data`), then returns undefined so the page never
    crashes. The helper is imported only when a page actually uses such a magic.

### Patch Changes

- Updated dependencies [2d8bb33]
  - @apex-stack/kit@0.9.0
  - @apex-stack/vite@0.4.0

## 0.33.0

### Minor Changes

- ebf6f3b: `apex make model` normalizes the resource to lowercase-plural.

  `apex make model Post` now scaffolds a PascalCase file (`models/Post.ts`) whose
  `defineModel` uses a lowercase-plural resource — `defineModel('posts', …)` → REST at
  `/api/posts`, table `posts`, MCP tools `posts_*` — regardless of how the name is typed
  (`Post` / `post` / `posts` all → `posts`, `Category` → `categories`). Matches the
  Rails/Prisma convention and `apex make composable Post` → `usePosts()`, so the whole
  model→REST→MCP→client chain reads consistently. Previously the name was used verbatim,
  so `apex make model Post` produced a capitalized `/api/Post` route.

## 0.32.0

### Minor Changes

- 5706fce: Plugin magics with a global form (e.g. `$persist`) now work in a page's **root**
  `<template x-data>`.

  A page root's `x-data` compiles into an `Alpine.data` factory (ordinary JS), where
  a bare `$persist(0)` was a `ReferenceError` — even though it worked in a nested
  `x-data`. Apex now rewrites non-core `$magic(…)` calls in the root expression to
  Alpine's global form (`Alpine.$persist(…)`, the shape Alpine documents for use inside
  a data factory): a server-safe no-op during SSR, re-bound to the real magic on
  hydration, so it persists across reloads without throwing. A magic with no global
  form degrades to a no-op at the root (use a nested `x-data` for those). Core magics
  (`$el`, `$store`, `$refs`, …) and composable calls are left untouched. Fixes #47.

### Patch Changes

- Updated dependencies [5706fce]
  - @apex-stack/vite@0.3.0

## 0.31.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [82a7597]
  - @apex-stack/kit@0.8.0
  - @apex-stack/vite@0.2.6

## 0.30.0

### Minor Changes

- 3d37eb1: `.alpine` components are now strictly TypeScript.

  The `<script>` parser rejects `lang="js"` (and any non-`ts` value) with a clear
  error — `lang` is optional and always defaults to `ts`. This removes the
  ambiguity of a JS/TS toggle that never fully worked (loaders, `head()`, and
  composables were always type-checked as TS regardless of the attribute).

  Templates, examples, and docs are swept to bare `<script server>` /
  `<script client>` (no redundant `lang="ts"`).

### Patch Changes

- Updated dependencies [3d37eb1]
  - @apex-stack/kit@0.7.0
  - @apex-stack/vite@0.2.5

## 0.29.0

### Minor Changes

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

## 0.28.0

### Minor Changes

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

## 0.27.2

### Patch Changes

- fix(scaffold): guard `params.slug` in the blog `[slug].alpine` so a fresh app type-checks clean

  The scaffolded `pages/blog/[slug].alpine` passed `params.slug` straight to
  `posts.bySlug(...)`, but the scaffold's tsconfig enables `noUncheckedIndexedAccess`,
  so `params.slug` is `string | undefined` — a real `TS2345`. It was invisible until
  `apex check --alpine` started type-checking `.alpine` script blocks; now a brand-new
  app would fail its own `apex check --alpine`. Guarded the access
  (`params.slug ? posts.bySlug(params.slug) : null`). Fixes both scaffolders
  (`npm create apexjs` and `apex new`, which bundles the same template).

## 0.27.1

### Patch Changes

- fix(check --alpine): normalize paths to POSIX so it works on Windows

  `apex check --alpine` built its virtual-file map keyed on `path.join` output
  (backslashes on Windows), but TypeScript's compiler host normalizes paths to
  forward slashes before calling it — so every `.alpine` virtual file was silently
  skipped on Windows, and the command reported "No type errors" no matter what. Now
  the virtual paths are POSIX-normalized at generation and the host lookups normalize
  too, so the check works cross-platform. Added a regression test for the path
  normalization (the bug was invisible to Linux CI). Thanks to the Windows verifier
  who root-caused it.

## 0.27.0

### Minor Changes

- feat(check): `apex check --alpine` — type-check the `<script>` blocks inside `.alpine` components (preview)

  Plain `tsc` can't see inside `.alpine` files, so the TypeScript in your
  `<script server>` / `<script client>` blocks has never been type-checked. The new
  `apex check --alpine` represents each block as a line-preserved virtual `.ts` file
  and checks it alongside your `.ts` sources via the TypeScript compiler API, mapping
  any diagnostics back to the `.alpine` source. It caught a real latent error in the
  `examples/showcase` app on its first run.

  This is #21 Phase 1 — **script blocks** only; template-expression checking
  (`x-text`, `:class`, `x-for` against the `x-data` scope) is Phase 2. The `--alpine`
  path uses the compiler API (needs `typescript`, or `@typescript/typescript6` on a
  TypeScript 7 app) and does not use `tsgo`. Plain `apex check` is unchanged.
  Additive; the public API contract stays green.

## 0.26.0

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

## 0.25.0

### Minor Changes

- feat(check): `apex check` command + `apex_check` MCP tool — a fast, native-compiler-aware type gate

  New `apex check` type-checks the app with `tsc --noEmit`, honoring the app's own
  `tsconfig.json`. It prefers the native `tsgo` compiler when installed (and `tsc`
  is itself native + fast under TypeScript 7), so a full check is quick enough to
  run after every change. Extra args pass through (`apex check --watch`).

  `apex mcp-server` gains an eighth tool, `apex_check`, exposing the same gate to AI
  agents — so the agent loop becomes read → generate → **check** → test, catching
  type errors before a test run. Returns `isError: true` with the errors when the
  check fails. Scaffolded `AGENTS.md` now tells agents to check-then-test.

  Additive — the public API contract (`API.md`) stays green; `check` and
  `mcp-server` are documented there as 🟡 Experimental.

## 0.24.3

### Patch Changes

- fix(pkg): expose `./package.json` in the exports map

  Tools and user code commonly `require('@apex-stack/core/package.json')` (e.g. to
  read the version); with the `exports` map present but no `./package.json` entry,
  that threw `ERR_PACKAGE_PATH_NOT_EXPORTED`. Both packages now map
  `"./package.json": "./package.json"` so the conventional access works.

## 0.24.2

### Patch Changes

- fix(mcp-server): honor `force` on `apex_add` and set `isError` on failed tool calls

  The `apex mcp-server` tools now surface failure to the calling agent: any CLI
  tool that exits non-zero (e.g. `apex_add` with an unknown component) returns an
  MCP result with `isError: true` instead of a success-shaped text result, so an
  agent can tell a failure from a success. `apex_add` also gains a `force` boolean
  that appends `--force` to overwrite existing component files (previously the
  parameter was absent and overwrite was impossible via the tool).

## 0.24.1

### Patch Changes

- `apex mcp-server` tools now return clean, agent-friendly text — the ASCII brand
  banner and ANSI colour codes are stripped, so a tool response is just the signal
  (e.g. `✓ pages/foo.alpine`, `• Skipped 1 existing: Button (use --force)`). Failures
  report usefully (exit code / signal) instead of a bare "code null".

## 0.24.0

### Minor Changes

- `apex mcp-server` gains two tools that complete the agent loop: **`apex_project_info`**
  (read an app's routes, models, components, and installed features — so the agent can
  understand before it changes) and **`apex_test`** (run the app's tests once to verify
  its own work). Now agents can write, read, and verify through MCP tools.

## 0.23.0

### Minor Changes

- **AI-native tooling (Apex Compass + CLI-as-MCP).** New `apex mcp-server` runs an MCP
  server (stdio) that exposes the Apex CLI as tools — `apex_make`, `apex_extend`,
  `apex_add`, `apex_build`, `apex_list` — so an AI agent scaffolds/extends/builds an app
  by calling structured tools instead of hand-writing files. Point any agent host at
  `apex mcp-server`. Scaffolded apps now include an `AGENTS.md` that teaches agents the
  conventions, generators, and APIs (also synced into existing apps by `apex upgrade`).

## 0.22.0

### Minor Changes

- Netlify deploys: `apex build --preset netlify` scaffolds a Netlify Functions-v2
  handler (`netlify/functions/server.mjs`) that serves the whole app via the new
  `createProdWebHandler` (a Web `fetch` handler, exported from `@apex-stack/core/server`),
  plus `netlify.toml`. Commit and `netlify deploy`.

## 0.21.0

### Minor Changes

- Container deploys: `apex build --preset docker` scaffolds a Dockerfile (+ .dockerignore)
  that builds and runs the app on any container host — Railway, Render, Fly.io, a VPS,
  Kubernetes. `apex start` now honours `$PORT` (host-injected), then falls back to 3000.

## 0.20.0

### Minor Changes

- One-command Vercel deploys: `apex build --preset vercel` builds the server target
  and generates `api/index.mjs` (a serverless function serving the whole app via
  `createProdNodeHandler`) + `vercel.json` — commit them and run `vercel deploy`.
  The `data` feature is now Supabase-ready: its `db/index.ts` uses Postgres when
  `DATABASE_URL` is set (in-memory libSQL otherwise), and ships the `postgres` driver.

## 0.19.0

### Minor Changes

- Serverless-ready production server. New `createProdApp({ dir })` builds the h3 app
  from a `apex build --server` output without listening, and `createProdNodeHandler`
  returns a Node `(req, res)` handler — both exported from `@apex-stack/core/server`
  for serverless targets (Vercel, etc.). `startProdServer` now wraps them.

## 0.18.0

### Minor Changes

- Optional feature recipes. New `apex extend <data|auth|i18n>` adds a whole
  capability to an app — files plus wiring (deps, apex.config.ts, .env, nav),
  idempotently. The same features are offered interactively during `apex new`
  (per-feature prompts, or `--data`/`--auth`/`--i18n` flags) and by `apex upgrade`
  (only for features not already present). Distinct from `apex add` (UI components).

## 0.17.1

### Patch Changes

- af459fa: i18n: `createI18n` accepts an `onMissingKey(key)` hook, called when a key resolves to
  nothing (before falling back to the key literal). The dev server wires it to a
  `console.warn` so missing/typo'd translation keys are surfaced during `apex dev` while
  production stays silent. (From i18n verification feedback.)
- Support Vite 7. `@apex-stack/vite` widens its `vite` peer range to include `^7`
  (still `^5`/`^6`), and `@apex-stack/core` + `create-apexjs` build and run on Vite
  7.3.x. Also bumps `citty` to 0.2.2. No public API changes.
- Updated dependencies
  - @apex-stack/vite@0.2.4

## 0.17.0

### Minor Changes

- 666d30f: i18n. Declare `i18n: { defaultLocale, locales }` in `apex.config.ts` and put catalogs
  in `locales/<locale>.json`. Each request's locale is resolved from a `/<locale>` path
  prefix (else `Accept-Language`, else the default) and injected as `locale` + `t` into
  loaders, `head()`, and middleware (`locals.locale` / `locals.t`); routing matches the
  locale-stripped path, and the SSR shell sets `<html lang>` + seeds `window.__APEX_LOCALE__`.
  `createI18n({ messages, locale, defaultLocale })` gives a `t(key, params?)` that resolves
  dotted keys, interpolates `{param}`, and falls back (default locale → key). `resolveLocale`
  is exported too. Wired through dev + prod (the build copies `locales/` into the bundle).

## 0.16.2

### Patch Changes

- 7108e69: `apex make model`'s generated test now uses in-memory SQLite (`createDb({ driver:
'sqlite', url: ':memory:' })` — the `@libsql/client` driver the command already tells
  you to install) instead of `pglite`, so the test runs with no extra dependency. Uses a
  portable `COUNT(*)` query too.

## 0.16.1

### Patch Changes

- 1018a7e: Fix `createTestApp({ root })` — load the app's modules through Vite's SSR loader (like
  `apex dev`) instead of a native `import()` of a `file://` URL. The native path only
  transformed the top file, so any extensionless or TypeScript relative import in the
  route graph (idiomatic in Vite/Apex — e.g. `import { X } from '../../services/X'`) threw
  `ERR_MODULE_NOT_FOUND`. The whole graph now resolves correctly; Vite is closed on
  `app.close()`.

## 0.16.0

### Minor Changes

- b7ba151: Test kit. New `@apex-stack/core/testing` boots an app's API + MCP surface in-process for
  tests: `createTestApp({ root })` (or `{ entries, auth }`) returns REST helpers
  (`get/post/patch/put/delete` → `{ status, body, headers }`) and `mcp.listTools`/
  `mcp.call`. Authenticate a call with `{ user }` (injects a session, skipping login) or
  drive the real login flow — a cookie jar persists `Set-Cookie`; auth gating, `scope`,
  and CSRF stay live. New `apex test` command (thin Vitest wrapper; args pass through).
  `apex make service|api|model` now emits a matching test alongside the code (opt out with
  `--no-test`), and the default scaffold ships a sample harness test.

## 0.15.0

### Minor Changes

- Auth DX + hardening fixes from independent Phase C verification:

  - **Route handlers now receive `event`** — the raw h3 request event is passed into
    every `defineApexRoute` handler ctx (`undefined` for MCP calls). This makes the
    documented login flow actually work: `login(event, { user }, { password })`.
  - **Handler-set status is preserved** — `createApiHandler` no longer forces `200` over
    a status the handler set (e.g. a login route returning `setStatus(event, 401)`).
  - **`setStatus(event, code)`** added to `@apex-stack/core/server` so login routes need
    no direct h3 import; session helpers (`login`/`logout`/`getSession`) accept the
    loosely-typed handler `event` with no cast.
  - **`SameSite=Lax`** is now set explicitly on the sealed session cookie.
  - **No cookie for anonymous callers** — `sessionAuth` only reads an existing session
    cookie; it no longer initializes (and sets) an empty one on unauthenticated requests.
  - **`apex make auth`** now scaffolds working `server/api/login.ts` + `logout.ts`
    routes alongside `server/auth.ts`.

## 0.14.0

### Minor Changes

- d2a423d: Phase C1 — auth identity + route gating. New `defineAuth({ resolve })` in
  `server/auth.ts` resolves the request's user once per request and injects it as
  `user` into every route handler and MCP tool call (and `locals.user` for page
  loaders). Routes gain a `auth: true` gate (anonymous → 401) and an optional
  `can: ({ user, input }) => boolean` (→ 403). The MCP endpoint filters `tools/list`
  per user and re-checks authorization on `tools/call` (defense-in-depth). Enforced
  identically over REST and MCP, in the handler layer (not middleware-only),
  fail-closed. Wired through both the dev server and the production build/server.
- 233993e: Phase C3 — sessions + hardening (the "hybrid" scope). New `@apex-stack/core/server`
  subpath with server-only helpers:

  - **Sealed-cookie sessions** on h3: `sessionAuth({ password })` (an `AuthConfig` that
    resolves the user from an encrypted+signed, HttpOnly cookie) plus `login`/`logout`/
    `getSession`. `apex make auth` scaffolds `server/auth.ts`.
  - **CSRF** — `createApiHandler` now rejects cookie-authenticated mutations whose
    Origin/Referer host doesn't match (bearer/tokenless clients are exempt). Pure
    `isCsrfSafe` + `checkCsrf(event)`.
  - **Rate limiting** — `createRateLimiter({ limit, windowMs })` (pure, clock-injectable)
    - `rateLimitKey(event)`.
  - **Security headers** — `securityHeaders()` / `applySecurityHeaders(event)`.

  OAuth / JWT issuance / 2FA remain adapter territory (wire via `sessionAuth`'s `toUser`
  or a custom `defineAuth`).

## 0.13.1

### Patch Changes

- ebb0588: `apex make migration <name>` — scaffold an empty, reversible SQL migration.

  Creates a timestamped `db/migrations/<ts>_<name>.sql` with `up` + `-- @down` stubs
  for hand-written schema changes (`ALTER TABLE`, `CREATE INDEX`, `CREATE TRIGGER`,
  `CREATE VIEW`, data backfills, …). Migrations were never limited to CREATE/DROP — the
  runner executes any SQL in the up/down sections; this just gives you a quick way to
  author one (only `apex make model` had scaffolded migrations before).

## 0.13.0

### Minor Changes

- 01a2aff: Up/down migrations + rollback (Phase B).

  Migrations can now declare a reversible `down`: everything after a `-- @down` marker
  line in a `*.sql` file is the down section (files without it stay up-only, exactly as
  before — fully backward compatible). New `rollbackMigrations(handle, dir, steps?)`
  reverts the most-recent applied migration(s) by running their `down` and un-recording
  them, stopping safely at the first non-reversible one so nothing is undone out of
  order. `apex migrate --rollback [--steps N]` drives it from the CLI, and
  `apex make model` now generates a reversible migration (`CREATE TABLE` + `-- @down`
  `DROP TABLE`). `applyMigrations` runs the `up` section (unchanged behavior for
  existing plain-SQL migrations).

## 0.12.2

### Patch Changes

- aa24896: Follow-ups from the second model-verify pass.

  - Missing-table API error now actually surfaces the reason + hint: the driver's
    real message ("no such table: …") lives on the error's `.cause`, not the
    top-level "Failed query: …" — the handler now includes both, so the response
    carries the reason and the "run `apex migrate`" hint fires.
  - `apex make model` writes `TEXT` for `timestamp` columns in the generated
    migration (matching defineModel's ISO-string storage) — was `INTEGER`, which
    only worked under SQLite's loose typing and would mismatch on Postgres.

## 0.12.1

### Patch Changes

- 7df0b00: Fixes from the model-scaffolding verification pass.

  - **Blocker:** a `timestamp` field crashed MCP `tools/list` for the whole app
    (`z.coerce.date()` output can't convert to JSON Schema). Timestamps are now ISO
    strings end-to-end (SQLite `TEXT`, Postgres `TIMESTAMP` with string I/O). Plus the
    MCP layer now degrades ANY unrepresentable tool input schema to a loose one for
    that one tool instead of taking down the entire tool list — so a hand-written
    route using `z.date()` can't break MCP either.
  - API responses serialize explicitly: a `null` handler result (e.g. get-by-id not
    found) is now a parseable `200 null` JSON body, not h3's `204 No Content`.
  - Handler errors surface the real message (with a "run `apex migrate`" hint when a
    table is missing) instead of an opaque 500 with an empty stack.
  - Resource MCP tool descriptions reworded to read cleanly for plural model names
    ("Create todos", not "Create a todos").

## 0.12.0

### Minor Changes

- d478813: `apex make model <name> <field:type>…` — scaffold a full data model in one command.

  Generates three files: `models/<name>.ts` (a `defineModel`), `server/api/<name>.ts`
  (wires `model.resource(db)` — auto-served by the API loader as REST `/api/<name>`

  - MCP tools `<name>_list/_get/_create/_update/_delete`), and a starter
    `db/migrations/<ts>_create_<name>.sql`. Field syntax: `title:string`, `views:int`,
    `email:string!` (trailing `!` = NOT NULL). Types: string/text/int/float/boolean/
    timestamp/json. So: `apex make model todos title:string! done:boolean` → `apex migrate`
    → `apex dev` and a typed, AI-callable CRUD API is live with no hand-wiring.

## 0.11.0

### Minor Changes

- fc8538e: Component server loaders now run inside `x-for` / `x-if` (completes the feature).

  Each instance's loader runs once at SSR; the results are baked into the loop
  component's `x-data` as an inline object literal keyed by the loop `:key`, so the
  client re-evaluates `x-data` per clone and reads its item's slice — **no payload
  island, no extra client runtime** (it's native Alpine `x-data` evaluation). Identical
  props are deduped per render (mitigates N+1). Verified: per-item SSR data, correct
  per-clone client evaluation, and memoized loader calls. (Keyless loops over objects
  should use `:key`; primitives work either way.)

### Patch Changes

- Updated dependencies [fc8538e]
  - @apex-stack/kit@0.6.0
  - @apex-stack/vite@0.2.3

## 0.10.2

### Patch Changes

- b749167: Fix component-level server loaders never running in `apex build --server`.

  The prod server built its component registry inline and dropped the `loader` (and
  `componentId`) — so an embedded component's `<script server>` loader never ran under
  `apex start`: its data was missing, inner `x-for` didn't populate, and a throwing
  loader silently returned 200. (Dev worked; only the built Node-server target was
  affected.) Dev and prod now share one `toComponentEntry(mod)` mapping, so the loader
  can't be dropped in one path. Verified against a built prod module + regression tests.

## 0.10.1

### Patch Changes

- 39f59fe: Fix `apex upgrade` not actually upgrading.

  Two bugs: (1) it bumped `@apex-stack/*` deps to the CLI's own `VERSION` rather than
  the npm registry latest — so a project-local upgrade was capped at the running
  version and never consulted the registry; (2) it skipped `latest`/tag/range specs
  (the scaffold ships `"@apex-stack/core": "latest"`) and only reinstalled when it had
  rewritten a pinned spec, leaving `node_modules` stale.

  Now it queries the registry per package and rewrites pinned specs to `^<latest>`,
  and reinstalls whenever the project has any `@apex-stack/*` dep — so `latest`/range
  specs re-resolve to the newest published too. (The global-CLI self-update from 0.7.8
  still handles the binary itself; a CLI older than 0.7.8 still needs a one-time
  `npm i -g @apex-stack/core@latest`.)

## 0.10.0

### Minor Changes

- c08dabf: Component-level server loaders (singleton).

  A component (`components/*.alpine`) can now declare a `<script server>` with
  `export function loader({ props })` — it runs on the server when the component is
  embedded, its result merges into the component's scope (available to the template +
  x-data) and is baked into the instance's `x-data` literal, so the client hydrates
  without re-fetching and no extra state island is needed. Loaders may be async; the
  SSR render pipeline is now async end-to-end.

  Great for self-contained widgets (`<Sidebar/>`, `<LatestPosts/>`, `<Dashboard/>`)
  that own their data instead of receiving everything via props. Loaders inside
  `x-for`/`x-if` are not run yet (a dev warning points you to hoist to the parent
  loader); per-item keyed-payload loop hydration is the next increment.

### Patch Changes

- Updated dependencies [c08dabf]
  - @apex-stack/kit@0.5.0
  - @apex-stack/vite@0.2.2

## 0.9.2

### Patch Changes

- 2f9f457: CLI banner now reads **APEX JS** (was APEX) — consistent branding with the README and site.

## 0.9.1

### Patch Changes

- 09fbadd: Fix component `<style scoped>` not applying to components rendered inside `x-for` / `x-if`.

  The in-loop (structural) component expansion stamped the component's scope id only
  on the wrapper element, leaving its inner elements unstamped — then the loop-clone
  re-walk blanketed them with the enclosing page scope. So a component's scoped CSS
  (`button[data-apex-xxx]`) never matched inside a loop (Tailwind classes still worked,
  since utilities need no scope attribute). The expansion now stamps the component's
  own scope across its whole subtree (stopping at nested component boundaries), matching
  the non-loop path. Verified with a nested-element component in `x-for`.

- Updated dependencies [09fbadd]
  - @apex-stack/kit@0.4.1
  - @apex-stack/vite@0.2.1

## 0.9.0

### Minor Changes

- dcaa2d4: Style-only HMR (no more reload on CSS edits) + working islands in `apex build --islands`.

  **HMR.** Editing a `<style>` block in any `.alpine` file now hot-swaps that
  component's scoped CSS in place — no reload, Alpine state and scroll position
  untouched. The shell emits one `<style data-apex-css="<scopeId>">` per source
  (page / layout / component) and the Vite plugin diffs the file structure on hot
  update: style-only → a custom `apex:css` event replaces exactly that tag;
  template/script edits still full-reload, but now **save and restore the scroll
  position** so an edit no longer dumps you back at the top of the page.

  **Islands build.** `apex build --islands` previously emitted the dev island
  loader inline, whose bare `import('alpinejs')` only Vite's dev server can
  rewrite — in the static output the browser threw and **no island ever
  hydrated**. The build now bundles a real islands runtime asset (Alpine stays a
  lazily-loaded chunk, so pages without hydrating islands still ship zero JS) and
  compiles the project's global stylesheet (Tailwind) alongside it, linking both
  into the prerendered pages. Verified from a plain static file server:
  `client:visible` hydrates on scroll and is interactive; `client:none` stays inert.

### Patch Changes

- Updated dependencies [dcaa2d4]
  - @apex-stack/vite@0.2.0

## 0.8.3

### Patch Changes

- 9f0100a: Apply layouts in the `apex build --server` production target.

  The Node-server target rendered pages without their `layouts/*.alpine` wrapper — so
  the shared navbar/footer/theme chrome went missing in `apex start` (static `apex build`
  already applied layouts). `buildServer` now SSR-builds layout modules, the manifest
  carries them, and the prod server passes the layout chain to the renderer — matching
  dev and the static build. Verified: navbar + footer render on every route in a built
  `--server` app.

## 0.8.2

### Patch Changes

- 9b1a98b: Fix `apex start` crashing on Windows with `TypeError: The "path" argument must be
of type string. Received undefined`.

  `buildServer` matched built chunks to source pages by comparing `join(root, id)`
  (backslashes on Windows) against rollup's `facadeModuleId` (always forward slashes).
  On Windows the lookup missed, so every route's `serverFile` was `undefined` in the
  manifest and the prod server threw on the first request. Both sides are now
  normalized to forward slashes. No effect on macOS/Linux (already forward-slashed).

## 0.8.1

### Patch Changes

- 4f09ef6: Fix `apex build` failing with `"installNav" is not exported by @apex-stack/core/client`
  when the project's installed `@apex-stack/core` is older than the global CLI.

  The client build now aliases the runtime leaf modules (`@apex-stack/core/client`,
  `@apex-stack/kit/client`, `alpinejs`) to the CLI's own copies — the same thing the
  dev server already does — so the bundle always uses the CLI's matching runtime
  instead of a stale/mismatched one in the project's `node_modules`. Only the leaf
  runtime modules are aliased (not the bare `@apex-stack/core` package), so a
  `{ defineStore }` import can't drag the server CLI into the client bundle.

## 0.8.0

### Minor Changes

- eadbd06: Client-side navigation (SPA) + loading boundary + prefetch.

  Same-origin link clicks now swap pages in place instead of full-loading: Apex
  fetches the target page's HTML, adopts its `[data-apex-root]` region, merges the
  `head()` tags (title/meta/link), registers the incoming page's Alpine factory, and
  re-initialises Alpine on the new subtree — no reload, so Alpine, stores and the nav
  layer stay alive between pages. Includes `history` push/pop with scroll restoration,
  focus management, an always-on top progress bar, hover/viewport **prefetch**, and a
  `pages/loading.alpine` boundary shown on slow navigations.

  Degrades safely: cross-origin, downloads, modified clicks, non-OK responses and
  unrecognised markup fall back to a real browser navigation. Opt out per-link with
  `data-apex-no-nav` (and `data-apex-no-prefetch`), or globally with `clientNav: false`
  in `apex.config`. Works in dev and in the built static + Node-server targets
  (browser-verified end-to-end). Islands-mode SPA nav and persistent layout regions
  are deferred (see ROADMAP).

### Patch Changes

- Updated dependencies [eadbd06]
  - @apex-stack/kit@0.4.0
  - @apex-stack/vite@0.1.8

## 0.7.8

### Patch Changes

- bde3a2d: `apex upgrade` now self-updates the global CLI.

  The `.alpine` extension and scaffold templates are bundled inside a given
  `@apex-stack/core` build, so `apex upgrade` could only ever apply the version it
  was itself running — a stale global CLI silently upgraded projects to old assets.
  `apex upgrade` now checks npm for a newer core; if the global binary is behind it
  offers to run `npm i -g @apex-stack/core@latest` and re-execs on the new engine
  (one command instead of two). Skips cleanly when offline, non-interactive, or run
  from a project-local install (those update via the normal dependency bump).
  Control with `--self` / `--no-self`.

## 0.7.7

### Patch Changes

- 38b0fc3: Simplify `.alpine` highlighting to the parts that matter, robustly (VS Code 0.1.9).

  Drops the fragile `@`/`:`/slot/magic name-matching (left to the base HTML grammar,
  which handles them cleanly) and the embedded-JS attribute values. What's colored now,
  and reliably: **components** (`<Button>`), all **`x-` directives** (name + value
  swallowed as one token so HTML never flags the value invalid), and the three
  structural tags — **`<template>`**, **`<script>`**, **`<style>`** — plus the
  `server`/`client`/`scoped` modifiers. Verified with the TextMate engine: zero invalid
  tokens on real `.alpine` pages incl. nested `<template>`.

## 0.7.6

### Patch Changes

- 62b1885: Fix `.alpine` highlighting breaking attribute values (VS Code extension 0.1.8).

  The injection matched only the directive/bind/event **name** (`x-text`, `:href`,
  `@click`), which left the base HTML tag parser staring at a dangling `="…"` and
  flagging every value as `invalid.illegal.character-not-allowed-here` — so all the
  markup below the first directive rendered as errors. The value-bearing patterns now
  consume the whole `name="value"` and embed the expression as JS, so Alpine
  expressions are highlighted (strings, operators, identifiers) and nothing is flagged
  invalid. Verified against real `.alpine` pages (incl. nested `<template x-for>` /
  `<template x-if>`) with the TextMate engine: zero invalid tokens.

## 0.7.5

### Patch Changes

- 29b4f85: Fix `.alpine` syntax highlighting (VS Code extension 0.1.7) — it now actually works.

  The grammar's injection targeted the `text.html.basic` scope, which isn't on the
  scope stack when HTML is `include`d under `source.alpine` — so **none** of the
  Alpine/Apex highlighting fired (components, directives, events, binds all rendered
  as plain HTML). Injecting against `source.alpine` fixes it, verified with the
  TextMate engine. Also ships on-brand color defaults (`configurationDefaults`) so
  components, directives, `<template x-for/x-if>`, `<slot>`, events, binds, islands,
  and magics are visibly colored in any theme.

## 0.7.4

### Patch Changes

- 0451068: `.alpine` highlighting marks Alpine's structural tags (VS Code extension 0.1.6).

  Beyond components, `<template x-for>` / `<template x-if>` are now colored as
  control-flow (Alpine's loops & conditionals stand out), and `<slot>` (the
  component content outlet) gets its own color. Also documents the Apex Language
  Server (does-component-exist checks, go-to-definition, autocomplete) as a roadmap
  item — today's extension is grammar-only.

## 0.7.3

### Patch Changes

- 2a16365: Richer `.alpine` syntax highlighting (VS Code extension 0.1.5).

  Component tags (`<Button>`, `<Card/>`) are now colored as component types (they
  previously rendered like plain HTML tags), plus better coverage for Alpine
  directives (`x-*` with `:arg` split), event modifiers (`@click.prevent.window`),
  binds (`:class`), islands directives (`client:load|idle|visible|none`), Alpine
  magics (`$refs`, `$store`, …), and `<script server|client lang>` / `<style scoped>`.

## 0.7.2

### Patch Changes

- 18800ea: Dev error page fixes: the project file tree no longer disappears when toggling
  Frames/Raw (the tabs wrongly hid it), the tree is fully expanded by default, and
  the error's origin file is marked red even for compile/transform errors (e.g. a
  malformed `.alpine`) — the offending file is taken from Vite's error `loc`/`id`
  and surfaced as a top "compile error" frame with code context.
- 1e48f34: No more style flash — and production builds are actually styled.

  The global `app.css` (Tailwind + shared styles) was loaded via a deferred JS
  import at the end of `<body>`, so pages painted unstyled (white) for a moment
  before styling applied — a flash on every navigation. It's now a render-blocking
  `<link>` in `<head>`. Critically, the **production** client build never ran the
  Tailwind plugin nor linked the extracted CSS, so built sites shipped with **no
  Tailwind at all**; `apex build`/`--server` now process `app.css` through Tailwind,
  extract it to a hashed asset, and link it in every page's `<head>`. VS Code
  extension icon updated (0.1.4).

## 0.7.1

### Patch Changes

- 3739636: Clear "not an Apex app" page when `apex dev` runs outside a project.

  Running `apex dev` in a folder with no `pages/` (e.g. a parent folder containing
  several apps) previously showed a cryptic Vite error ("Failed to load url
  …/pages/index.alpine. Does the file exist?"). It now renders a helpful page that
  explains no `pages/*.alpine` were found and suggests the subfolders that ARE Apex
  apps (`cd my-app && apex dev`).

## 0.7.0

### Minor Changes

- 7d5caca: Sentry-style dev error page.

  When a page loader throws in dev (and there's no `pages/error.alpine`), the
  overlay is now a proper debugger: expandable stack-frame cards with inline code
  context (failing line highlighted), a Frames/Raw toggle, a project file tree
  with folder/file icons where the error's origin file is marked red, and
  "open in editor" links. A dev-only `/__apex_open` endpoint launches the file at
  its line/column in your editor (honors `$APEX_EDITOR`/`$EDITOR`, else the
  detected VS Code / Cursor / Windsurf / VSCodium CLI); it only opens files inside
  the project root.

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

## 0.6.0

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

### Patch Changes

- e39ef9a: Dev server no longer crashes with a cryptic `postcss ENOENT: … 'tailwindcss'`
  when `app.css` imports Tailwind but it isn't installed. It now skips the
  stylesheet and prints a clear warning telling you to run
  `npm i -D tailwindcss @tailwindcss/vite`, so the app still boots (unstyled).
- Updated dependencies [005de5d]
  - @apex-stack/kit@0.3.0
  - @apex-stack/vite@0.1.7

## 0.5.0

### Minor Changes

- 033bdaa: `apex add` now takes multiple components at once — `apex add button card modal` (or `apex add --all`). Pairs with the new UI Kit gallery on apexjs.site: tick the components you want and copy the single generated command.

## 0.4.1

### Patch Changes

- dd3997a: Component catalog → 36 (the full standard PenguinUI set, MIT-attributed).

  Added: Carousel, ChatBubble, Counter, Range, FileInput, Rating, Pagination, Steps, Navbar, Sidebar, Table, Combobox, Toast — converted to `.alpine` with token classes kept verbatim and Alpine wiring preserved on the interactive/structural ones (carousel, counter, rating, navbar/sidebar mobile menus, combobox search, toast stack). `apex add` now serves all 36.

## 0.4.0

### Minor Changes

- 26d83ca: Turnkey styling + `apex theme`.

  - **Scaffold is now styled out of the box** — `apex new` apps ship an `app.css` wired for Tailwind v4 (`@import 'tailwindcss'; @source './**/*.alpine';`) with the theme's `@theme` token block, plus `tailwindcss` + `@tailwindcss/vite` dev deps. Components added with `apex add` render themed immediately.
  - **`apex theme`** — write/update your theme tokens in `app.css` (or `--out`): `apex theme --primary '#e11d48' --radius 0.75rem --font-title '"Inter"'`. It edits a managed `/* apex-theme:start … end */` block, so every component restyles at once. No flags re-applies the default theme. (`@apex-stack/theme` is bundled into the CLI, so it works from a global install.)
  - `apex add` now nudges you to run `apex theme` if the project isn't Tailwind-wired yet.

## 0.3.1

### Patch Changes

- 557c35d: Adopt the PenguinUI token contract (adapted, MIT — see NOTICE).

  - **`@apex-stack/theme`** now uses the PenguinUI token vocabulary (`surface / surface-alt / on-surface(-strong) / primary / secondary / on-* / outline(-strong) / info-success-warning-danger / radius / fonts` + `-dark` variants) as a Tailwind v4 `@theme` contract. Ships `theme.css` (import after `@import 'tailwindcss'`), `defineTheme()`, `renderThemeCss()`. **BREAKING**: replaces the old `--ax-*` vocabulary + drops the `/preset` export.
  - **`@apex-stack/components`** — Button/Card/Badge re-authored against the tokens (`bg-primary`, `rounded-radius`, `dark:*`), so they inherit `apex theme`. Attribution `NOTICE` added.
  - More components (the full PenguinUI catalog) land next.

## 0.3.0

### Minor Changes

- 6bd3191: Themeable components + `apex add` (the components epic, first slice).

  - **`@apex-stack/theme`** — semantic design tokens as `--ax-*` CSS variables (light + dark), `defineTheme()` / `renderThemeCss()`, and a Tailwind preset (`bg-primary`, `rounded`, …). One theme, inherited by every component.
  - **`@apex-stack/components`** — a registry of `.alpine` components (Button, Card, Badge) styled against the theme tokens (with sane fallbacks, so they look right with or without a custom theme).
  - **`apex add <name>`** — copies a component's `.alpine` source into your `components/` (shadcn-style; non-destructive, `--force` to overwrite). `apex add` with no name lists what's available. The registry is bundled into the CLI, so it works right after `apex new`.

  Verified: changing a theme token (`primary`) restyles the component through the CSS cascade — proven end-to-end.

## 0.2.2

### Patch Changes

- 3586f27: VS Code extension: proper app-icon tile. The `.alpine` extension icon is now a branded gradient tile (indigo→cyan) with a white faceted "A" — no theme-dependent corner artifacts (the previous versions showed white triangles around the diagonal mark on light backgrounds). Extension → 0.1.2, re-bundled.

## 0.2.1

### Patch Changes

- d15b536: VS Code extension: transparent (backgroundless) icon. The bundled `.alpine` extension icon is now a proper transparent-background glyph (the faceted Apex "A" mark) instead of a solid-background image. Extension bumped to 0.1.1 and re-bundled into the package.

## 0.2.0

### Minor Changes

- 2f71124: Form-action sugar — `createAction(url, opts)` (from `@apex-stack/core/client`).

  Spread it into an `x-data` to bind a form to an Apex route with `pending` / `error` / `data` state and no boilerplate:

  ```html
  <script client>
    import { createAction } from "@apex-stack/core/client";
  </script>
  <template
    x-data="{ ...createAction('/api/messages', { onSuccess: () => location.reload() }) }"
  >
    <form @submit="submit($event)">
      <input name="body" />
      <button
        :disabled="pending"
        x-text="pending ? 'Saving…' : 'Post'"
      ></button>
      <p x-show="error" x-text="error"></p>
    </form>
  </template>
  ```

  Posts the form as JSON to the same typed route your REST clients + MCP tools hit — one server surface. Methods/fields survive object-spread (stays reactive).

- 6dd4d89: Shared FE/BE types — `defineApexRoute` now carries its input/output types, and `InferInput`/`InferOutput` derive them.

  ```ts
  // server/api/posts.ts
  export default defineApexRoute({
    input: { id: z.coerce.number() },
    handler: ({ input }) => getPost(input.id),
  });

  // on the frontend — one contract, no duplicated types, no drift
  import type { InferOutput } from "@apex-stack/core";
  import type posts from "../server/api/posts";
  type Post = InferOutput<typeof posts>;
  ```

  Phantom type fields (erased at runtime); use a `import type` on the frontend so no server code is bundled.

- ad58fe5: Nested layouts + per-route error boundaries.

  - **Nested layouts** — a layout can declare its own parent via `export const layout = '<name>'`; Apex wraps outward (page → layout → parent layout …), merging each layer's scoped CSS. Cycle-guarded.
  - **Error boundary** — add `pages/error.alpine`; when a page `loader()` throws, Apex renders the error page (wrapped in your layouts) with `{ error: { message, statusCode } }` instead of crashing. Wired in dev + prod. Throw a `{ statusCode }`-bearing error to set the code. (Loading boundaries pair with client-side navigation — tracked.)

- cc6ff69: Route middleware — `middleware/*.ts`, each `export default defineMiddleware(ctx => …)`.

  - Runs on every request (filename order; prefix `01.`/`02.` to sequence) before the page/API handler.
  - `ctx` = `{ url, method, config, headers, locals, redirect(to, status?) }`. Set `ctx.locals.*` to attach request-scoped state (an authenticated user, request id, flags); return `ctx.redirect('/login')` to short-circuit.
  - `locals` is threaded into the page `loader({ locals })` / `head`, and every `defineApexRoute`/resource handler (`{ locals }`) — REST and MCP.
  - Wired through dev, prod (`apex start`, baked into the build manifest), and the static/server build. `apex make middleware <name>` scaffolds one. Foundation for the planned auth/permissions layer.

- f1a7eca: Runtime configuration from `apex.config.ts` + `.env` (Nuxt/Laravel-style).

  - **`apex.config.ts`** with `defineConfig({ runtimeConfig })` — declare defaults; `public` values reach the browser, everything else is server-only.
  - **`.env` loading** — `.env`, `.env.<mode>`, `.env.local`, `.env.<mode>.local` (later wins), real env vars are never clobbered. Any declared leaf is overridden from the environment: `APEX_<KEY>` (private) / `APEX_PUBLIC_<KEY>` (public), camelCase ↔ SCREAMING_SNAKE, with type coercion.
  - **`useRuntimeConfig()`** — full config on the server, the `public` subset in the browser (seeded into the page, `</script>`-escaped). **`env('KEY', fallback)`** is the raw escape hatch.
  - **`config` in context** — page `loader({ config })`, `head({ config })`, and every `defineApexRoute` / resource handler (`{ input, config }`) — REST **and** MCP tool calls. Private values never ship to the client.
  - Wired through dev, prod (`apex start` applies deploy-time env over baked defaults), and the static/server build. The scaffold ships `apex.config.ts` + `.env.example` and gitignores real `.env` files.

- 6626d2d: `apex upgrade` + deploy-time env fixes (surfaced by fresh-install testing).

  - **`apex upgrade`** — adopt new scaffold defaults in an existing app, non-destructively: adds any template files the project is missing (e.g. a newly-introduced `apex.config.ts`), never overwrites existing files, and always preserves `package.json`. `--force` re-syncs changed files (still preserving `package.json`). Idempotent. The upgrade path stays non-breaking; only a deliberate overhaul (`--force`) can overwrite.
  - **fix(config): deploy-time env now works in prod.** The prod server loaded `.env` from the build dir instead of the working directory, so deploy-time overrides were ignored. It now reads `.env` (and always-respected real `process.env`) from `process.cwd()`.
  - **fix(config): no build-time env baked into `dist`.** `resolveApexConfig` shared the config's `public` object by reference and mutated it, leaking build-time env into the server manifest. It now deep-clones, so the manifest carries pristine defaults and the deploy env is applied at start (build once, deploy anywhere).

- 19756a6: `apex upgrade` now updates the project + bundled VS Code extension install.

  - **`apex upgrade` bumps the framework** — it now updates every `@apex-stack/*` dependency in `package.json` to the CLI's version and runs your package manager (`--no-install` to skip), in addition to adding any missing scaffold files. So upgrading actually updates the installed runtime, not just files. Still non-destructive (never overwrites your code; `package.json` entries are only version-bumped).
  - **VS Code extension, bundled + one prompt.** The `.alpine` extension `.vsix` now ships inside `@apex-stack/core`. `apex new` and `apex upgrade` offer to install it — an interactive **“Install the Apex VS Code extension? (Y/n)”** prompt (when a `code` CLI is on PATH), or pass `--vscode` / `--no-vscode`. No more hunting for a `.vsix` path.

### Patch Changes

- ef8082a: Fix client hydration in `apex build` output and add subpath deploy support.

  - **Hydration fix**: `buildClient` matched the Vite manifest entry by exact virtual-id equality, but Vite normalizes the virtual src (prefixing `../../`), so no entry matched. The prerendered HTML then fell back to an inline `import Alpine from 'alpinejs'`, which the browser cannot resolve — pages shipped dead. Entries are now matched by suffix, so the HTML references the hashed, bundled client and hydrates.
  - **Store registration**: the built client bundle never registered global `stores/*`, so `$store.*` was `undefined` after hydration (the dev shell registered them but the build did not). The built entry now imports and registers each store before `Alpine.start()`, matching the server-rendered state.
  - **`apex build --base <path>`**: assets and the client href are now prefixed with a configurable base, enabling subpath deploys (e.g. `/demo/`).

- Updated dependencies [2f71124]
  - @apex-stack/kit@0.2.0
  - @apex-stack/vite@0.1.6
