# Apex iOS shell

> ⚠️ **UNVERIFIED — needs a Mac + Xcode to compile and run.** These files were written on Linux,
> mirroring the already-shipped, device-verified **Android** shell (`../android/`). No part of the
> iOS build has been compiled or run — treat it as a well-formed starting point, not a proven app.
> See **"For the Mac tester"** at the bottom for exactly what to check first.

A native iOS app that runs your Apex backend **on the device** (offline, no server, no port) and
renders it in a `WKWebView`. It is the 1:1 counterpart of the Android shell, using the two iOS
platform capabilities that make it *simpler* than Android:

| Concern | Android | iOS (here) |
|---|---|---|
| JS engine | `androidx.javascriptengine` (out-of-process, async boot, **no host callbacks**) | **JavaScriptCore `JSContext`** (in-process, sync boot, **host callbacks + exception handler**) |
| Request interception | `WebViewClient.shouldInterceptRequest` (**cannot read POST body**) | **`WKURLSchemeHandler`** for `apex://` (**reads `httpBody` directly**) |
| Body-bearing `fetch()`/POST | needs a **2nd path**: `@JavascriptInterface` bridge + document-start `fetch` patch | **not needed** — one scheme handler covers navigations *and* POST |
| Cookies (HttpOnly session) | `CookieManager` | small `ApexCookieJar` inside the scheme handler (custom schemes bypass `WKHTTPCookieStore`) |
| DB persistence | `apex-db.b64` in `filesDir`, atomic rename | `apex-db.b64` in Application Support, `FileManager.replaceItemAt` |

## What's here

```
ios/
├─ ApexApp.swift            # @main SwiftUI App: boots engine, builds WKWebView, loads apex://localhost/splash
├─ ApexEngine.swift         # JSContext wrapper — loads server.mjs + apex-bridge.js, runs __apexHandle
├─ ApexSchemeHandler.swift  # WKURLSchemeHandler for apex:// → engine (assets from bundle) + cookie jar
├─ ApexDbStore.swift        # DB snapshot persistence (Application Support, atomic)
├─ Info.plist               # launch screen + app config (no network entitlement needed — offline)
└─ Assets.xcassets/
   ├─ AppIcon.appiconset/   # app icon (already present)
   └─ LaunchBackground.colorset/  # #0b1120 launch-screen colour
```

## Architecture (identical contract to Android)

```
 WKWebView  ── every request ──►  ApexSchemeHandler (apex:// scheme)
                                     │  /assets/*, /favicon.svg → bundle files
                                     │  everything else → engine, WITH body + injected Cookie
                                     ▼
                              ApexEngine.handle(requestJSON)
                                     │  globalThis.__apexHandle(json)  (apex-bridge.js)
                                     │    └─ APEX.run(request) → { status, headers, body }
                                     ▼
                              {status,headers,body}  ── served back ──►  WKWebView hydrates
```

Because interception is a **function call**, there's no listener and no port — nothing for iOS to
suspend when the app backgrounds. That's the whole point.

## Create the Xcode project & drop these files in

There is no `.xcodeproj` in this folder (it's binary/machine-specific). Create one on the Mac:

1. **Xcode → New → App.** Interface: **SwiftUI**, Language: **Swift**. Product name e.g. `ApexShell`.
   Set the **Bundle Identifier** and a signing team in *Signing & Capabilities*.
2. **Delete** the auto-generated `ContentView.swift` and the generated `…App.swift` (this repo's
   `ApexApp.swift` provides the `@main` App).
3. **Add these files** to the target (drag into the project navigator, *Copy items if needed* off if
   you reference them in place): `ApexApp.swift`, `ApexEngine.swift`, `ApexSchemeHandler.swift`,
   `ApexDbStore.swift`.
4. **Info.plist / Assets:** either use this folder's `Info.plist` (set *Build Settings → Info.plist
   File* to point at it) or copy its `UILaunchScreen` + keys into the generated one. Add the
   `LaunchBackground` colour set (and your `AppIcon`) to the target's asset catalog.
5. **Framework:** `import JavaScriptCore` — it's a **system framework**, no dependency to add
   (link it in *Frameworks, Libraries, and Embedded Content* if the linker complains).

## Copy the built bundle + client assets into the app

From your **Apex app root**, build the mobile bundle:

```bash
apex build --mobile      # → dist/mobile/server.mjs
apex build               # (or your normal build) → dist/assets/*, dist/favicon.svg
```

Then add these to the Xcode target so they land in the app bundle **Resources**:

| Source | Add to bundle as | Read by |
|---|---|---|
| `dist/mobile/server.mjs` | `server.mjs` (bundle root) | `ApexEngine` → `Bundle.main.url(forResource:"server", withExtension:"mjs")` |
| `native-shell/apex-bridge.js` | `apex-bridge.js` (bundle root) | `ApexEngine` → `…forResource:"apex-bridge", withExtension:"js"` |
| `dist/assets/*` | an **`assets/` folder reference** (blue folder) | `ApexSchemeHandler` → `…forResource:base, withExtension:ext, subdirectory:"assets"` |
| `dist/favicon.svg` | `favicon.svg` (bundle root) | `ApexSchemeHandler` |

> **Important — use a *folder reference* (blue), not a *group* (yellow), for `assets/`.** A folder
> reference preserves the `assets/` subdirectory so `subdirectory: "assets"` lookups resolve. A
> group flattens filenames into the bundle root and the `/assets/...` path lookups will 404.

Also copy `native-shell/splash.alpine` into your app's `pages/splash.alpine` (the animated intro the
shell loads first) and rebuild — see `../NATIVE_SHELL.md`.

## Run

Select an iOS Simulator (or a provisioned device) and **⌘R**. You should see: the native launch
screen (#0b1120), then the animated `splash.alpine`, then your app — all served by the Apex server
running inside the app on JavaScriptCore. Turn the network off: it still works.

## On-device drivers

`apex build --mobile` reports routes needing `crypto.subtle` (sessions) or `@libsql/client/web`
(DB) — same as Android. JavaScriptCore provides a real `crypto`? **Not by default** — JSCore has no
WebCrypto. The bundle ships a stub so non-session routes boot; for real sessions, expose a native
WebCrypto shim as a host object on the `JSContext` (the JSContext host-callback capability makes
this straightforward — add it in `ApexEngine` before evaluating `server.mjs`). For DB, alias
`@libsql/client` → `@libsql/client/web` (sql.js asm.js) before bundling, as on Android.

## For the Mac tester (check these first — likeliest failure points)

1. **Bundle resources present.** If you see *"Apex engine failed to start"*, `server.mjs` /
   `apex-bridge.js` aren't in the bundle. Confirm they're in *Build Phases → Copy Bundle Resources*.
2. **`/assets/*` 404 → white page after splash.** Almost certainly the `assets/` folder was added as
   a *group* (yellow) not a *folder reference* (blue). Re-add as a blue folder. Verify by loading
   `apex://localhost/assets/<one-file>.js` and watching the Xcode console.
3. **⭐ POST body reaches the engine.** This is the one genuinely unproven iOS assumption. The task's
   premise is that `WKURLSchemeHandler` exposes `httpBody` for custom schemes — but some iOS
   versions have historically **dropped** the body from custom-scheme requests. **Test a POST**
   (log in, or add a guestbook entry) and confirm the engine receives a non-empty `body`. If it's
   empty: fall back to the Android approach — add a `WKScriptMessageHandler` (`configuration.
   userContentController.add(...)`) plus a document-start `fetch` patch (port `FETCH_PATCH` from
   `../android/.../MainActivity.kt`) that forwards `fetch()` bodies to the handler. The engine and
   cookie/DB plumbing here are unchanged either way.
4. **Promise resolution.** `ApexEngine.handle` resolves the JS promise via `.then(onFulfilled,
   onRejected)` and assumes JavaScriptCore drains its microtask queue within the same JS turn (true
   for our fully-synchronous in-memory pipeline). If a request ever hangs, that assumption broke —
   pump with `JSVirtualMachine`/a run-loop tick, or wrap the handler to resolve on a `Promise`
   settled callback.
5. **HttpOnly session cookie** survives a full page navigation and a cold start (login, force-quit,
   relaunch → still logged in). The jar persists to `UserDefaults`.
6. **DB snapshot** survives a cold start (create data, force-quit, relaunch → data still there). File
   is `apex-db.b64` in Application Support.
