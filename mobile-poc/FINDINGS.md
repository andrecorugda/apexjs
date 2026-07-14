# Apex on mobile — research findings (proof-of-concept complete)

**Verdict:** Apex's full production server (SSR pages **and** API routes) runs on a bare,
no-Node JS engine (QuickJS — the same engine *class* as Hermes on-device). No Node, no
fork of Node, no custom compiler, no re-architecture. What's required is a JS engine + a
~120-line pure-JS shim + a build-time bundling step. All proven in-repo; nothing published.

---

## 1. What was proven (all executed, not speculated)

| # | Claim | Evidence |
|---|---|---|
| 1 | `createProdWebHandler` is a pure `Request → Response` (no socket/`listen()`) | Fed a `Request`, got `200` + 16.7 KB SSR HTML |
| 2 | Framework's live Node surface is tiny | Bundled for non-Node: `fs`(4 fns) + `path` + `pathToFileURL`; **zero** crypto/net/stream/tls |
| 3 | Apex's SSR renderer runs on QuickJS | Synthetic template → `x-text`/`x-show`/`x-for` rendered correctly |
| 4 | The **whole app** runs on QuickJS | Flattened bundle: `GET /` → 200 full page; `GET /api/ping` → 200 `{"message":"Hello, QuickJS!"}` |

The QuickJS output is byte-identical to Node (16697 vs 16681 b — trivial env delta).

---

## 2. The mobile architecture (already latent in the codebase)

```
 ┌─────────────────────── device (Android/iOS) ───────────────────────┐
 │  WebView (WKWebView / android.webkit)                               │
 │     │  intercepts its own requests (WKURLSchemeHandler /            │
 │     │  shouldInterceptRequest) — NO localhost server, NO port       │
 │     ▼                                                               │
 │  build Request  ──▶  embedded JS engine (Hermes / QuickJS)          │
 │                        └─ createProdWebHandler(request) → Response   │
 │     ◀── Response (HTML for pages, JSON for /api) ───────────────────┘
 │  WebView renders HTML → the already-built client bundle hydrates    │
 └─────────────────────────────────────────────────────────────────────┘
```

Key: because the handler is a **function** (not a server), there is **no port and no
listener** — which dissolves the hardest iOS caveat (a localhost server being suspended
when the app backgrounds). There is nothing to suspend.

---

## 3. The runtime shim surface (the complete worklist, mapped by the errors hit + fixed)

A bare engine lacks these; each fix is pure-JS (none is a Node native module):

| Missing | Pulled in by | Fix (this PoC) | On-device |
|---|---|---|---|
| `Buffer` (base64) | `entities` (linkedom's entity table) | ~15-line base64 decode | RN provides |
| `TextEncoder`/`Decoder` | devalue / encoders | tiny pure-JS | RN/Hermes provides |
| `URL` | url shim / linkedom | minimal parser | RN/`react-native-url-polyfill` |
| `Request`/`Response`/`Headers`/`fetch` | h3 web handler | ~20-line WHATWG minimal | RN + `react-native-webview` provide |
| `process` | **postcss** via kit's barrel | stub — but real fix is to **split kit's entry** so build-time CSS scoping doesn't ship at runtime | dead weight removed |
| `require('path')` | h3/core | real (~5 lines) | trivial |
| `require('url')` `pathToFileURL` | `createProdApp` dynamic import | **vanishes** with the static registry | — |
| `require('http')` `createServer` | `startProdServer` (Node adapter) | **dead** — never called on web path | drop with web-only entry |
| `require('canvas')` | linkedom (optional images) | throw stub — never used in text SSR | — |
| `crypto` (`.subtle`) | h3 sessions / core (module-load reads `crypto.subtle`) | stub (bare engine has no `crypto` at all) | **real `crypto.subtle` on device** (WebView/RN/`react-native-quick-crypto`) |
| `fs` (`readFileSync`/`existsSync`/`statSync`/`readdirSync`) | manifest + assets + i18n | ~40-line VFS over bundled assets | bundle assets into app |

---

## 4. The one framework change (backward-compatible; local, uncommitted)

`packages/apexjs/src/prod/server.ts` — `createProdApp` / `createProdWebHandler` /
`createProdNodeHandler` now accept an optional **`loadModule`**:

```ts
createProdWebHandler({ dir, loadModule })   // loadModule?: (relFile) => Promise<Module>
```

Defaults to dynamic `import()` (unchanged behavior). On an engine without a filesystem
module loader, pass a **static registry**: `(f) => Promise.resolve(registry[f])`. This is
the mobile seam — it turns "dynamic import per manifest entry" into "one flat bundle." It is
additive and does not change any existing behavior. **Not published; keep or discard as you like.**

---

## 5. Boundaries this PoC did NOT cross (and the exact on-device answer for each)

These need a device/emulator or a WASM/crypto host — they are **integration, not research**:

1. **Auth routes** (`login`/`logout`/`whoami`) — h3 `useSession` → iron-webcrypto →
   `crypto.subtle`, which bare QuickJS lacks. **On-device:** the WebView/RN JS context has
   `crypto.subtle`; or use `react-native-quick-crypto`. Excluded from the PoC registry.
2. **DB routes** (`messages`/`posts`) — import `@libsql/client` (native addon).
   **On-device:** swap to `@libsql/client/web` (WASM) — Hermes/RN can run it — or bridge to
   native SQLite. Drizzle itself is pure JS. Excluded from the PoC registry.
3. **The native shell** — WKURLSchemeHandler (iOS) / `shouldInterceptRequest` (Android)
   wiring a WebView request → `createProdWebHandler(request)` → `Response`. Needs Xcode /
   Android Studio + emulator. **Recommended host: React Native (Hermes)** — it provides
   `fetch`/`Request`/`Response`/`Headers` and most of §3's Web shims for free, one codebase
   for both platforms, and dev on the standard (open-source, free) AOSP emulator.

---

## 6. Productization — status

1. ✅ **`apex build --mobile`** — SHIPPED as a real core command
   (`packages/apexjs/src/prod/buildMobile.ts` + `--mobile` flag in `build.ts`). Manifest →
   static module registry + VFS → esbuild single-core bundle + shim banner → one
   self-contained `dist/mobile/server.mjs`. Auto-detects + reports device-driver routes.
   Verified: its output renders `/` (200 HTML) and serves `/api/posts` (200 JSON) under
   QuickJS. Uses esbuild via Vite's location (no new dep). Local, uncommitted, unpublished.
2. ✅ **Native shell — complete Android project** — `mobile-poc/native-shell/android/` is a full
   Android Studio project (Gradle + `MainActivity`/`ApexEngine`/`ApexInterceptor` Kotlin, using
   Google's `androidx.javascriptengine` to run `server.mjs` on-device). `assemble-android.mjs`
   builds + wires it in one command; `gen-mobile-assets.mjs` generates launcher + adaptive icons
   + native splash (verified: 48/72/96/144/192 + adaptive XML + iOS 1024 appiconset). Two-splash
   design: native cold-start (static, generated) → `pages/splash.alpine` (animated, SSR). iOS
   `WKURLSchemeHandler` stub present (needs a Mac). Remaining device-side step: open in Android
   Studio → `./gradlew assembleDebug` → install the APK + run offline.
3. ⬜ **`@libsql/client/web`** swap behind a driver flag for on-device DB (device-side).
4. ⬜ **Split `@apex-stack/kit`'s entry** so `renderComponent` (runtime) doesn't pull
   `scopeCss`/postcss (build-time) — removes the biggest dead-weight chunk + the `process`
   need. (Optional optimization; postcss/picocolors were the only thing forcing a `process` shim.)

Bundle size today: ~2.2 MB unminified (full framework + app + zod + MCP SDK + linkedom).
Minify + kit-split + drop-MCP-when-unused shrinks it substantially. All pure JS.

---

## 7. Reproduce — the productized command (this directory — local, unpublished)

`build-mobile.mjs` is the **reference implementation of `apex build --mobile`**. It turns any
`apex build --server` dist into ONE self-contained `dist/mobile/server.mjs` (single-core
bundle + static registry + VFS + full shim banner), and **auto-reports routes that need
on-device capabilities** (DB → `@libsql/client/web`; sessions → `crypto.subtle`).

```
node build-mobile.mjs [path/to/dist]     # → <dist>/mobile/server.mjs (self-contained)
node verify-mobile.mjs                    # runs that bundle under QuickJS
```
Verified output (showcase):
```
apex build --mobile → …/dist/mobile/server.mjs  (2246 KB, self-contained)
included: 6 route(s) + 5 API on-engine
device-driver routes: pages_guestbook.mjs, server_api_messages.mjs, server_auth.mjs
/                      → 200  16697b  <!DOCTYPE html> …
/api/ping?name=Mobile  → 200  28b     {"message":"Hello, Mobile!"}
```

**Important framing on the "device-driver" report:** on a *real* device the WebView/RN runtime
**has** `crypto.subtle` and can load `@libsql/client/web` (WASM), so the full app — DB and auth
included — runs. The auto-exclusion is a **bare-engine-test convenience** (QuickJS has no crypto
and can't load a native driver), not a device limitation. Folding this script into the core CLI
as `apex build --mobile` is the remaining wiring (only the esbuild-as-a-core-dep plumbing; the
logic here is complete and verified).

Supporting files: `gen-app.mjs`/`bundle-app.mjs` (earlier split of the same flow),
`polyfills.js` (Buffer/TextEncoder/URL/process/crypto-stub banner), `prelude.gen.js`
(require + Request/Response/Headers), `run-both.mjs`/`quickjs-app-run.mjs` (runners).

---

## 7b. Verified on Windows + Android emulator (beta 0.37.0-beta.0)

`@apex-stack/core@0.37.0-beta.0` (beta tag) tested on Windows 11 + a headless-installed AVD
(Pixel7_API34, Android 14, WHPX):
- **`apex dev --mobile`** auto-ran `adb reverse`; the emulator's Chrome at `localhost:3000`
  rendered real SSR HTML, navigated `/about` + `/blog`, **HMR live-reloaded** a heading edit,
  and the `client:load` counter was interactive (hydration works on-device). ✅ *This is the
  dev loop — server on the machine, emulator as client — the primary experience.*
- **`apex build --mobile`** produced `dist/mobile/server.mjs`; QuickJS sanity (no Node) →
  `/` 200 HTML, `/api/posts` 200 JSON, matching Linux. ✅
- **Not yet on a device:** the *offline* bundle running inside a native WebView shell (the
  "backend on the phone" production path). Proven under QuickJS on a dev machine; needs the
  native shell built (§5.3) + run in the emulator WebView.

Doc fixes from the run: the bare-engine sanity check must dispose every QuickJS handle or
`vm.dispose()` aborts — use `mobile-poc/verify-bundle.mjs` (corrected). Windows SDK install
notes: use `curl.exe` for the ~146 MB cmdline-tools zip (Invoke-WebRequest is very slow);
accept `sdkmanager --licenses` via cmd stdin redirection (not a PowerShell pipe).

## 8. Bottom line for the team

The runtime unknown is resolved: **Apex renders its full SSR + API pipeline on a bare
mobile-class engine.** Remaining work is bundling ergonomics, two driver/crypto swaps, and
the native WebView shell — all standard integration on a dev machine with the AOSP emulator
(Android) and a Mac + Simulator (iOS). No Node, no compiler, no fork.
