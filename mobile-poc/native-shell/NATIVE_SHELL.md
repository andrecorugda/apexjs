# Apex mobile — native shell guide

`apex build --mobile` produces `dist/mobile/server.mjs`: a **self-contained** bundle that runs
Apex's full SSR + API pipeline on a bare JS engine. This guide is the device-side glue that
turns that bundle into an app. (Everything before this is proven; this is the one part that
needs a device/emulator.)

## The architecture (no server, no port)

```
 WebView (WKWebView / android.webkit)
   │  every request it makes is INTERCEPTED natively:
   │    iOS   → WKURLSchemeHandler   (ios/ApexSchemeHandler.swift)
   │    Android → shouldInterceptRequest (android/ApexInterceptor.kt)
   ▼
 native → embedded JS engine:  __apexHandle(requestJSON)   (apex-bridge.js)
                                   └─ APEX.run(request) → { status, headers, body }
   ▲
   └── served straight back to the WebView (HTML for pages, JSON for /api)
 then the WebView loads the client bundle (dist/assets/*) and HYDRATES the HTML.
```

Because the handler is a **function call**, there is no listener and no port — so there is
nothing for iOS to suspend when the app backgrounds. That's the whole point.

## Dynamic requests (POST bodies + cookies)

`shouldInterceptRequest` **cannot read a request body**, so `fetch()` POSTs from the page (add a
guestbook message, log in) can't deliver their JSON through the interceptor. So the Android shell
adds a second path:

- **`ApexBridge`** (`@JavascriptInterface __ApexNative.handle`) receives `fetch()` requests **with
  the body** and forwards them to the engine. A document-start `fetch` patch (installed via
  `WebViewCompat.addDocumentStartJavaScript`) reroutes same-origin `fetch()` to it.
- **Cookies**: the session is an **HttpOnly** cookie, so the page can't read/write it. `ApexBridge`
  and `ApexInterceptor` manage it via `CookieManager` — injecting the stored `Cookie` on the way in
  and persisting `Set-Cookie` on the way out — so a login via `fetch()` is visible to the next full
  page load (navigations still go through the interceptor).

Navigations/static stay on `shouldInterceptRequest`; only body-bearing `fetch()` uses the bridge.
(An RN/Hermes shell wouldn't need this — RN's `fetch` reaches the engine directly with the body.)

## Recommended host: React Native (Hermes)

Hermes is the same engine class we proved on. RN also polyfills most of what a bare engine
lacks (`fetch`/`Request`/`Response`/`Headers`), so the shim in `server.mjs` mostly no-ops.
One RN codebase covers Android + iOS; dev runs on the free/open-source AOSP emulator (Android)
and Xcode Simulator (iOS). Alternative: thin native (Kotlin/Swift WebView) + an embedded
QuickJS (`react-native-quick-js` / `quickjs-android` / JavaScriptCore). Same three files below.

## Wiring, in four steps

1. **Bundle:** `apex build --mobile` → copy `dist/mobile/server.mjs` + `dist/assets/**` into the
   app (Android `assets/`, iOS bundle resources).
2. **Load the engine:** create an `ApexEngine` wrapper that evaluates, in order,
   `server.mjs` then `apex-bridge.js`. After that, `globalThis.APEX.run` and
   `globalThis.__apexHandle` exist. Expose `callHandle(requestJSON) -> responseJSON`.
3. **Intercept:** install `ApexSchemeHandler` (iOS) / `ApexInterceptor` (Android). Route
   `/assets/**` to the bundled static files; everything else → `__apexHandle`.
4. **Load the WebView** at the app root (`apex://localhost/` or `https://localhost/`). Pages
   render from SSR HTML instantly, then the client bundle hydrates them.

## Files here

| File | Role |
|---|---|
| `apex-bridge.js` | JS side — `__apexHandle(json)` wraps `APEX.run`. Load after `server.mjs`. |
| **`android/`** | **Complete Android Studio project** — Gradle + `MainActivity`/`ApexEngine`/`ApexInterceptor` (Kotlin) + res. See `android/README.md`. |
| `assemble-android.mjs` | One command: `apex build --mobile` → copy bundle + assets → generate icons → ready to `./gradlew assembleDebug`. |
| `../gen-mobile-assets.mjs` | One source PNG → Android launcher + adaptive icons + native splash + iOS appiconset (`sharp`). |
| `splash.alpine` | Example **animated** splash — copy to `pages/splash.alpine`; the shell renders it first. |
| `ios/ApexSchemeHandler.swift` | iOS `WKURLSchemeHandler` → engine → WebView (needs a Mac to build). |

## Icons, splash & building the app

**Two splashes:** the native cold-start splash (static — generated from your icon, shown before
JS runs) then your **`pages/splash.alpine`** (animated, SSR-rendered instant, dismisses to `/`).
The native launch screen *can't* be `.alpine` (it shows before the engine); the animated one is
just a page.

```ts
// apex.config.ts
mobile: { name: 'My App', icon: './public/icon.png', splash: { image: './public/icon.png', background: '#0b1120', alpine: 'pages/splash.alpine' } }
```

Build an installed APK from your app root:
```bash
node native-shell/assemble-android.mjs --icon public/icon.png --splash public/icon.png --bg '#0b1120'
cd native-shell/android && ./gradlew assembleDebug   # → app-debug.apk (branded icon, offline)
```

## On-device drivers (the two capabilities the bare engine lacked)

`apex build --mobile` reports routes that need these; they are **available on-device**, so
include them once wired:

- **`crypto.subtle`** (sessions/auth) — present in the WebView/RN JS context; or add
  `react-native-quick-crypto`. The bundle ships a stub so non-session routes boot; swap it
  for the real WebCrypto in `ApexEngine`.
- **`@libsql/client/web`** (DB routes) — the WASM SQLite driver. Alias `@libsql/client` →
  `@libsql/client/web` before bundling, or bridge to native SQLite. Drizzle itself is pure JS.

## Static assets

The client bundle (`dist/assets/*.js`/`.css`) and `favicon.svg` are normal WebView requests.
Serve them from the bundled files (check the `/assets/` path prefix in the interceptor and
return the file directly) rather than routing them through the engine.

---

**Status:** the JS runtime is proven (pages + API render under QuickJS). These three files are
the remaining device-side integration — build them in an RN app, run on the AOSP emulator /
Xcode Simulator, and load the WebView. No unknowns remain in the runtime; this is wiring.
