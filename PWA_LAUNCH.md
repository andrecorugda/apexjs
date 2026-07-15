# Apex JS — Launch: your web app now installs like an app. And works offline.

> Ready-to-use launch announcement for the PWA release (`@apex-stack/core@0.41.x`, feature 🟡).
> Same voice as the mobile launch — keynote energy, zero overclaiming. Swap `[…]` for your links.

---

## ✦ And one more thing for the web.

Last release, your Apex app learned to run on the phone. This release, the **web app itself**
learned two new tricks:

**It installs. And it works offline.**

```ts
// apex.config.ts
export default defineConfig({
  pwa: { name: 'My Apex App' },
})
```

That's the whole feature. One config block — or just `apex extend pwa` — and `apex build` makes
your app **installable** and **offline-capable** — and not just on phones: it installs on the
**desktop** too (Chrome/Edge on Windows, macOS, Linux → its own window, a taskbar/dock icon) and on
**Android** (home screen). iOS installs via Safari's "Add to Home Screen" (no automatic prompt —
Apple's rule, not ours). Open any of them in airplane mode; they render.

No plugin. No workbox config. No new dependencies. Zero.

---

## How it works

A PWA needs exactly two artifacts, and Apex's build already knows everything required to make them:

```
        apex build
            │
            ├──►  manifest.webmanifest     name · icons · colors · standalone display
            │                              → the browser's "install this" contract
            │
            └──►  sw.js                    a ~60-line generated service worker
                                           → precaches every page + asset your build produced
```

1. **The manifest** comes straight from your `pwa` config block — name, icons (defaults scaffolded
   from your brand mark by `apex extend pwa`), theme colors, standalone display.
2. **The service worker is generated, not configured.** Here's the trick: because Apex *is* the
   build, it knows the complete list of files in your `dist/` the moment they're written. So
   instead of shipping a runtime caching framework, the build writes a tiny worker with that exact
   precache list baked in. Pages are served network-first (fresh when online, cached when not);
   hashed assets cache-first. The cache name is a content hash — every deploy activates a clean
   cache and deletes the old one.
3. **The HTML shells wire it up automatically** — manifest link, theme color, and the worker
   registration are injected into every page. You write nothing.

Static and islands builds precache the **entire site** — full offline. The server target precaches
assets and falls back to cache on navigations, and `apex start` serves the right MIME types and
`no-cache` on the worker so deploys propagate instantly.

**Why not vite-plugin-pwa?** Apex has no `index.html` for a Vite plugin to transform — its HTML
shells are built by the framework itself. And since the precache list is fully known at build time,
a generated worker is smaller, simpler, and dependency-free. The whole feature is ~200 lines of
framework code.

---

## The bigger picture: one codebase, three ways to ship

This completes the reach story:

| Target | Command | What you get |
| --- | --- | --- |
| **Web** | `apex build` / `--server` | SSR / static / islands on any host |
| **PWA** | `pwa: { name }` + `apex build` | installable + offline, no store needed |
| **Native mobile** | `apex mobile android` / `ios` | your server running ON the device |

Same pages. Same loaders. Same `/api` routes. One TypeScript codebase.

---

## How to ship it

```bash
apex extend pwa      # adds the config block + scaffolds icons (192/512/maskable)
apex build           # → dist/ now contains manifest.webmanifest + sw.js
```

Deploy `dist/` anywhere HTTPS (or test on localhost). Open it in Chrome — the install icon appears
in the address bar. Install it. Turn on airplane mode. Reload. It just works.

Verify like a pro: DevTools → Application → Manifest / Service Workers, or run a Lighthouse audit.

---

## Honestly, what it is (and isn't)

- ✅ **Installable + offline from one config block**, with zero new dependencies.
- ✅ Works across all three build modes; static/islands get *full* offline.
- ⚠️ 🟡 **Experimental** — the config surface may evolve.
- ⚠️ **Build-only**: no service worker in `apex dev` (by design — dev caching is a footgun).
- ⚠️ No runtime-caching strategies/config yet (network-first pages + cache-first assets is the
  built-in behavior); scoped to the site root.
- ℹ️ A PWA is still the **web** — for on-device SSR, a local database, and app stores, that's the
  mobile target.

---

## Try it

```bash
npm create apexjs@latest my-app -- --pwa
cd my-app && apex build
```

**One codebase. Web, PWA, and the phone.**

📖 [apexjs.site/docs/pwa.html] · ⭐ [github.com/andrecorugda/apexjs]
