# Apex JS — Mobile launch marketing kit

Channel-ready copy for launching **on-device mobile** (`@apex-stack/core@0.38.3`). Everything here
is written from the *verified* reality — a fresh app goes mobile in zero manual steps, offline.
Keep the honest caveats in; the differentiator is strong enough without hype. Swap `[…]` for links.

**Canonical links:** docs → https://apexjs.site/docs/mobile.html · repo →
https://github.com/andrecorugda/apexjs · npm → `@apex-stack/core`

---

## 1. The positioning (say this the same way everywhere)

**One line:** *Your full-stack Apex app now runs on the phone — server rendering, API routes, a real
database, and auth — fully offline. One codebase.*

**The differentiator (why it's not "just another WebView wrapper"):** Capacitor ships your
**frontend** to the phone and leaves the backend elsewhere; Tauri gives you a **Rust** backend. Apex
runs your **actual server** — the same `<script server>` loaders, `/api` routes, SQLite, and auth —
**on the device**, in one TypeScript codebase. No server, no port, no network.

**Taglines (pick per channel):**
- Your full-stack app. On the phone. Offline.
- The backend runs on the phone now.
- One codebase → web *and* a real offline app.
- `apex build --mobile`. That's it.

---

## 2. X / Twitter

**Hero tweet (standalone):**
> Apex JS apps now run on the phone. Offline.
>
> Not the frontend in a wrapper — your *actual server*: SSR, API routes, a real SQLite DB, and auth,
> all running on-device with no network.
>
> One codebase for web and mobile.
>
> `apex build --mobile` → `apex mobile android`
>
> 📱 [apexjs.site/docs/mobile.html]

**Launch thread:**
> 1/ New in Apex JS (the full-stack meta-framework for Alpine.js): your whole app now runs **on the
> phone**, offline. Server rendering, API routes, database, auth — on-device. 🧵
>
> 2/ Every "web app in a native shell" (Capacitor, Ionic) ships your *frontend* and leaves the
> backend on a server somewhere. Apex runs your **backend on the device** too. Open it in airplane
> mode — it just works.
>
> 3/ How? `apex build --mobile` compiles your app into one self-contained bundle. A tiny native
> shell runs it in the JS engine already in the OS (V8 / JavaScriptCore). Every request is a
> function call into that engine → SSR HTML back to the WebView. No server. No port.
>
> 4/ The database is the fun part: a real SQLite runs *inside* the engine (pure JS, so it works even
> where WebAssembly can't), seeded at launch and saved to disk — your data survives cold starts.
> Auth is a signed cookie computed on-device.
>
> 5/ The same `loader()` runs on your web server *and* on the phone — byte-for-byte. Deploy the same
> app to the web and to an app store, from one TypeScript codebase.
>
> 6/ Honest scope: it's a WebView app (not React-Native widgets), the on-device DB is in-memory +
> snapshot-persisted, and iOS build/sign needs a Mac. The differentiator is running your *server*
> on-device — nothing else does that.
>
> 7/ `npm create apexjs@latest` → `apex extend data` → `apex build --mobile` → `apex mobile android`.
> Docs: [apexjs.site/docs/mobile.html] · ⭐ [github.com/andrecorugda/apexjs]

---

## 3. LinkedIn

> **Apex JS now runs your full-stack app on the phone — offline.**
>
> Most "native web app" tooling (Capacitor, Ionic) puts your *frontend* on the device and leaves the
> backend on a server. Tauri gives you a native Rust backend. Apex does something different: it runs
> your **actual server** — server-side rendering, API routes, a real SQLite database, and auth — on
> the device itself, with no server and no network.
>
> One command turns your app into an offline native app:
> `apex build --mobile` → `apex mobile android`
>
> The same server code you wrote for the web runs unchanged on the phone. Deploy one TypeScript
> codebase to the web *and* to an app store.
>
> It's a pragmatic, honest tool — a WebView app (not native widgets), with an in-memory,
> snapshot-persisted database — but it's the only one that runs your backend on-device. Great fit for
> offline-first, data-driven apps: field data capture, an offline CRM, a local-first CMS.
>
> Docs & how-it-works: [apexjs.site/docs/mobile.html]
>
> #webdev #javascript #typescript #mobiledev #opensource

---

## 4. GitHub Release notes (`v0.38.x — On-device mobile`)

> ## On-device mobile 📱
>
> Apex apps now run their **full SSR + API pipeline on the device** — offline, no server. One
> command packages your app as a native Android app (iOS shell included); the same server code you
> wrote for the web runs unchanged on the phone.
>
> ```bash
> apex build --mobile                 # self-contained on-device bundle
> apex mobile android --appId com.you.app --name "My App"
> apex mobile ios     --appId com.you.app --name "My App"   # WKWebView shell (build on a Mac)
> ```
>
> **What runs on-device, offline:** server-rendered pages · typed API routes · a real SQLite database
> (persists across cold starts) · sealed-cookie auth — all from your existing `<script server>`
> loaders and `/api` routes.
>
> **How:** the native shell runs your bundle in the OS's JS engine (V8 on Android, JavaScriptCore on
> iOS) and serves every WebView request from it — a function call, not a server.
>
> **Out of the box:** `apex extend data` includes the on-device SQLite driver; `apex mobile`
> scaffolds a splash and rebuilds by default. Verified end-to-end on a fresh app.
>
> **Scope:** a WebView app (not native-widget UI); the on-device DB is in-memory + snapshot-persisted;
> iOS build/sign needs a Mac. Web builds are unaffected.
>
> 📖 https://apexjs.site/docs/mobile.html

---

## 5. Show HN / Reddit (r/javascript, r/webdev)

**Title:** Show HN: Apex JS runs your full-stack app (SSR + API + DB + auth) on the phone, offline

**Body:**
> Apex is a full-stack meta-framework for Alpine.js. The new release packages an app so its **entire
> server** — server rendering, API routes, a SQLite database, and auth — runs **on the device**,
> offline, in the JS engine already in the OS. Not the frontend in a shell with a remote backend:
> the same `loader()` and `/api` handlers you wrote for the web run unchanged on the phone.
>
> `apex build --mobile` produces one self-contained bundle; a WebView shell serves every request from
> it as a function call (no localhost server, no port — which also dodges iOS background suspension).
> SQLite runs inside the engine as pure JS and persists to disk; auth is a signed cookie computed
> on-device.
>
> Honest about what it is: a WebView app (not React-Native native widgets), in-memory +
> snapshot-persisted DB, and iOS build/sign needs a Mac. The point isn't native widgets — it's that
> your backend runs on the device, from one TypeScript codebase you also deploy to the web.
>
> Sweet spot: offline-first data apps (field capture, offline CRM, local-first CMS).
> Docs: https://apexjs.site/docs/mobile.html · Repo: https://github.com/andrecorugda/apexjs
>
> Happy to answer questions about how the on-device engine + SQLite work.

---

## 6. Talking points & FAQ (keep answers consistent + honest)

- **"Is this like Capacitor/Tauri?"** Same *shell* idea (a WebView), but neither runs your server
  on-device — Capacitor leaves the backend remote, Tauri's backend is Rust. Apex runs your JS server
  on the device. (For camera-heavy native features, Capacitor's plugin ecosystem is still the better
  fit — you can even run the Apex engine inside a Capacitor shell.)
- **"Native UI?"** No — it's HTML/Alpine in a WebView, not native widgets. That's a deliberate scope.
- **"Does the data persist?"** Yes, across cold starts (snapshot to disk). It's in-memory +
  snapshot, not a heavy native SQLite engine — great for app-sized data.
- **"Supabase / remote APIs?"** Yes, from client code (`<script client>`) — the WebView has real
  network online. Offline-first = local DB + sync when online.
- **"iOS?"** `apex mobile ios` scaffolds the shell and the engine is CI-verified on the Simulator;
  building/signing to a device needs a Mac + Xcode.
- **"Does it bloat / change my web app?"** No — web builds are unaffected; the on-device code never
  ships to the web output.

---

## 7. Assets

- **Interactive demo (landing):** the swipeable phone at https://apexjs.site (below the code-editor
  showcase) — splash → app → how-it-works. Good for embedding/screenshots.
- **Architecture diagram + full announcement:** `MOBILE_LAUNCH.md` (Apple-keynote long-form).
- **Suggested to make:** a 10–15s screen recording of `apex mobile android` → app running in airplane
  mode (guestbook post + login offline). This is the single most convincing asset — the "airplane
  mode, it just works" moment. (Say the word and I'll script the exact capture steps.)
