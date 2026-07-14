# Apex JS — Launch: your full-stack app, on the phone. Offline.

> A ready-to-use launch announcement for the new Apex version. Apple-keynote voice, but honest —
> use it as a blog post, a release note, or a prompt for your social/marketing copy. Swap the
> `[…]` bits for your links.

---

## ✦ One more thing.

You already build full-stack apps with Apex — file-based pages, server rendering, typed API
routes, a real database, auth. All of it running on a server.

**Now all of it runs on the phone.**

```bash
apex build --mobile      # → a self-contained app that runs on-device
apex mobile android      # → an installable Android app
```

Not a static export. Not a rewrite. **The same server code you already wrote** — your
`<script server>` loaders, your `/api` routes, your SQLite, your auth — packaged into a native app
that runs the whole thing **on the device, with no server and no network.**

Open it in airplane mode. It just works.

---

## How it works

Every other "web app in a native shell" (Capacitor, Ionic) ships your **front-end** to the phone
and leaves the **back-end** somewhere else — a server you still have to run, or native plugins you
have to rewrite. Apex does the thing none of them do: **it runs your server on the device.**

```
        ┌─────────────────────── 📱  the phone (offline) ───────────────────────┐
        │                                                                        │
        │   WebView                                                              │
        │   ┌──────────────────────────────────────────────────────────────┐    │
        │   │  your app's real HTML — server-rendered, then hydrated         │    │
        │   └──────────────────────────────────────────────────────────────┘    │
        │        ▲   every request  │  { html / json }                           │
        │        │                  ▼                                            │
        │   ┌──────────────────────────────────────────────────────────────┐    │
        │   │  Apex engine  —  server.mjs  (a bare JS engine, already in     │    │
        │   │                              the OS: V8 / JavaScriptCore)      │    │
        │   │    • pages        server-rendered on-device                    │    │
        │   │    • /api routes  the same typed handlers                      │    │
        │   │    • SQLite       a real database, on the device               │    │
        │   │    • auth         sealed-cookie sessions                       │    │
        │   └──────────────────────────────────────────────────────────────┘    │
        │                                                                        │
        │        no server   ·   no port   ·   no network                        │
        └────────────────────────────────────────────────────────────────────────┘
```

Three moving parts, and that's it:

1. **`apex build --mobile`** compiles your whole app — SSR + API pipeline — into one
   self-contained `server.mjs` (~3 MB). No Node, no dependencies bundled at runtime.
2. The **native shell** embeds a JS engine that's *already in the OS* — V8 on Android
   (`androidx.javascriptengine`), JavaScriptCore on iOS — and loads that bundle. A tiny shim
   supplies the few web globals a bare engine lacks (`fetch`, `Buffer`, `URL`, …).
3. For **every request the WebView makes**, the shell calls the engine, which runs your loaders and
   API handlers *in-process* and hands back `{ status, headers, body }`. The WebView shows the
   server-rendered HTML, then hydrates. It's a **function call, not a server** — so there's no
   port to open and nothing for the OS to suspend in the background.

The database is the neat part: a **real SQLite** runs *inside* the engine (compiled to plain
JavaScript, so it works even where WebAssembly can't), seeded at first launch and **saved back to
disk after every change** — so your data survives a cold start. Auth is a sealed, signed cookie,
computed on-device with no cloud round-trip.

**Same `loader()`. Same `/api`. Runs on your server for the web build, and on the phone for the app
build — byte-for-byte identical.**

---

## How to ship it

```bash
# 1. Build the on-device bundle
apex build --mobile

# 2. Package it as an Android app (scaffolds the shell + syncs your assets)
apex mobile android --appId com.you.app --name "My App"

# 3. Build the APK (needs the Android SDK) and install
apex mobile android --assemble
adb install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

Prefer iPhone? The same bundle drives an iOS shell:

```bash
# 1. Build the on-device bundle (same one)
apex build --mobile

# 2. Scaffold the iOS shell (WKWebView + JavaScriptCore) + sync your assets
apex mobile ios --appId com.you.app --name "My App"

# 3. Generate the Xcode project and open it — on a Mac
apex mobile ios --generate     # runs `xcodegen generate` (no committed .xcodeproj)
open mobile/ios/ApexShell.xcodeproj   # add a free Apple ID team, run on a device or the Simulator
```

That's the whole workflow. Your guestbook writes to a local database offline; your login works
offline; your pages render offline — because your server is *right there* on the device.

---

## Honestly, what it is (and isn't)

We're not going to oversell it:

- ✅ **It runs your actual full-stack app on-device, offline** — SSR + API + DB + auth, one
  TypeScript codebase, no backend rewrite. **That's the part nobody else does.**
- ✅ **Web ⇄ mobile with zero divergence** — deploy the same app to a server *and* to a phone.
- ⚠️ It's a **WebView app** (like Capacitor), not React-Native native widgets.
- ⚠️ The on-device database is **in-memory + snapshot-persisted** — great for app-sized data, not a
  heavy native SQLite engine.
- ⚠️ **Native device APIs** (camera, etc.) need shell wiring today; talk to external services
  (Supabase / Turso over HTTP) from client code, which has real network when you're online.
- 🍎 **iOS**: `apex mobile ios` now scaffolds the WKWebView + JavaScriptCore shell on any OS and
  syncs your bundle; its engine is verified on the iOS Simulator in CI. Building and signing (the
  `xcodegen generate` → Xcode step) still needs a Mac.

The sweet spot: **offline-first, data-driven apps** — field data capture, an offline CRM, a
local-first notes or CMS app — where "run my server on the device" is exactly the shape you want.

---

## Try it

```bash
npm i -g @apex-stack/core
apex new my-app && cd my-app
apex build --mobile && apex mobile android
```

**One codebase. Three ways to ship it — web, and now the phone.**

📖 [apexjs.site/docs/mobile.html] · 💬 [your channel] · ⭐ [github.com/andrecorugda/apexjs]
