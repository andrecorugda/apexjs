# Apex JS — PWA launch marketing kit

Channel-ready copy for the PWA release. Grounded in what ships (🟡 Experimental, zero deps).
Canonical links: docs → https://apexjs.site/docs/pwa.html · repo → https://github.com/andrecorugda/apexjs

---

## 1. Positioning (say it the same way everywhere)

**One line:** *One config block makes your Apex app installable and offline-capable — no plugin, no
workbox, no new dependencies.*

**The angle:** most frameworks make PWA a plugin with a config surface. Apex makes it a build
output: the framework already knows every file it produced, so it just writes the manifest and a
tiny service worker with the precache list baked in. And it completes the reach story — **one
codebase → web, PWA, native mobile.**

**Taglines:**
- Installs like an app. Works offline. One config block.
- Desktop, Android, iOS — one build installs everywhere.
- `pwa: { name: 'My App' }` — that's the whole setup.
- Zero-dependency PWA.
- One codebase. Web, PWA, and the phone.

---

## 2. X / Twitter

**Hero tweet:**
> Your Apex app now installs like an app — and works offline.
>
> ```
> pwa: { name: 'My App' }
> ```
>
> That's the entire setup. `apex build` emits the manifest + a tiny generated service worker that
> precaches your whole site. No plugin. No workbox. Zero new dependencies.
>
> 📖 [apexjs.site/docs/pwa.html]

**Launch thread:**
> 1/ New in Apex JS: PWA support. One config block and your app is **installable** (real app
> window, home screen, dock) and **works offline**. 🧵
>
> 2/ The setup is genuinely one block — or one command:
> `apex extend pwa` scaffolds the icons and the config. `apex build` does the rest.
>
> 3/ Here's the part we like: there's no service-worker framework in there. Apex IS the build — it
> knows every file it just wrote. So it generates a ~60-line worker with that exact precache list
> baked in. Pages network-first, assets cache-first, content-hashed cache name so every deploy
> rolls over cleanly.
>
> 4/ Static and islands builds precache the entire site — open it in airplane mode, it renders.
> The server target precaches assets and falls back to cache on navigations.
>
> 5/ Honest scope: 🟡 experimental, build-only (no SW in dev, on purpose), no custom caching
> strategies yet. And a PWA is still the web — for on-device SSR + a local DB, Apex has the
> native mobile target.
>
> 6/ Which completes the picture: **one TypeScript codebase → web, installable PWA, native mobile
> app.** Same pages, same loaders, same API routes.
>
> 7/ `npm create apexjs@latest my-app -- --pwa` → `apex build`. Docs:
> [apexjs.site/docs/pwa.html] · ⭐ [github.com/andrecorugda/apexjs]

---

## 3. LinkedIn

> **Apex JS apps are now installable and offline-capable — with one config block.**
>
> Most frameworks treat PWA as a plugin with its own configuration surface. Apex treats it as a
> build output: because the framework owns the build, it already knows every page and asset it
> produced — so `apex build` simply emits the web manifest and a small generated service worker
> with the precache list baked in. No plugin, no workbox, zero new dependencies.
>
> `apex extend pwa` scaffolds the icons and config; `apex build` makes the app installable (a real
> app window on desktop or mobile) and offline-capable — static builds render fully in airplane
> mode.
>
> This completes Apex's reach story: **one TypeScript codebase ships to the web, as an installable
> PWA, and as a native mobile app** (where the server itself runs on the device).
>
> Docs: [apexjs.site/docs/pwa.html]
>
> #webdev #javascript #typescript #pwa #opensource

---

## 4. GitHub Release notes (`v0.41.x — PWA`)

> ## PWA — installable + offline 📲 (🟡 Experimental)
>
> ```ts
> export default defineConfig({
>   pwa: { name: 'My Apex App' },
> })
> ```
>
> `apex build` now emits `manifest.webmanifest` + a small **generated** service worker — the app
> installs (standalone window, home screen) and works offline. Setup is `apex extend pwa` (icons +
> config scaffolded) or `npm create apexjs -- --pwa`.
>
> - Static / islands: the **entire dist is precached** → full offline.
> - Server target: assets precached, pages network-first with cache fallback; `apex start` serves
>   `application/manifest+json` + `no-cache` on `/sw.js`.
> - Shells auto-inject the manifest link, theme color, and registration — in both render modes.
> - Zero new dependencies: no vite-plugin-pwa/workbox (Apex's shells are string-built — nothing for
>   a plugin to transform — and the precache list is known at build time; the worker is ~60
>   generated lines with a content-hashed cache name for clean deploy rollover).
>
> Scope: build-only (no SW in dev), no runtime-caching config yet, root-scoped.
> 📖 https://apexjs.site/docs/pwa.html

---

## 5. Show HN / Reddit

**Title:** Show HN: Zero-dependency PWA support — the framework generates the service worker

**Body:**
> Apex is a full-stack meta-framework for Alpine.js. Its new PWA support takes a different route
> from the usual vite-plugin-pwa/workbox setup: since the framework owns the build, it knows the
> complete file list of `dist/` at write time — so it just generates a ~60-line service worker with
> that precache list baked in, plus the manifest from a one-line config block. Content-hashed cache
> name → each deploy activates a fresh cache and deletes the old one. No plugin, no config surface,
> no new dependencies.
>
> Static/islands builds precache everything (full offline); the SSR server target precaches assets
> and serves navigations network-first with cache fallback. Honest scope: experimental, build-only
> (no SW in dev), no custom caching strategies yet.
>
> Context: the same codebase also ships as a native mobile app where the SSR server runs on-device
> — PWA completes the "one codebase → web / PWA / native" story.
>
> Docs: https://apexjs.site/docs/pwa.html · Repo: https://github.com/andrecorugda/apexjs

---

## 6. FAQ / talking points

- **"Phone only?"** No — desktop is PWA's sweet spot: Chrome/Edge on Windows/macOS/Linux install it
  as a real windowed app (taskbar/dock/Start menu). Android gets a home-screen install prompt; iOS
  installs via Safari's Share → "Add to Home Screen" (no automatic prompt on iOS — platform rule).
  One build covers all of them.
- **"Why not vite-plugin-pwa?"** Apex has no `index.html` for a Vite plugin to transform (shells
  are framework-built), and the precache list is fully known at build time — a generated worker is
  smaller and dependency-free. Deliberate, documented choice.
- **"Custom caching strategies?"** Not yet — network-first pages + cache-first assets is built in.
  The seam exists for a future `pwa.caching` config.
- **"Does dev serve the SW?"** No, by design — a service worker in dev is a caching footgun.
- **"PWA vs the mobile target?"** PWA = the web, installable + offline precache. Mobile = your
  actual server (SSR + API + SQLite + auth) running on the device. Same codebase either way.
- **"Lighthouse?"** Lighthouse 12 removed the standalone PWA category — verify via DevTools →
  Application (manifest/SW) + the install prompt + airplane-mode reload. Best-practices audits
  score 100 on the scaffold.

---

## 7. Assets

- **Landing section:** the PWA keynote on apexjs.site (install-prompt → standalone window →
  airplane-mode demo).
- **Long-form post:** `PWA_LAUNCH.md`. **Video VO script:** `PWA_VIDEO_SCRIPT.md`.
- **Best single asset to record:** 10s screen capture — Chrome install icon → app opens in its own
  window → DevTools Network set to Offline → reload, still renders.
