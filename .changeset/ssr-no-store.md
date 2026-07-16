---
"@apex-stack/core": patch
---

SSR page responses now send `Cache-Control: no-store`. Server-rendered HTML embeds per-request /
session data (loader output, `locals`), so a warm browser must not serve a previously-loaded
document from cache — otherwise a saved change looks un-applied until a hard refresh (the values are
baked into the stale HTML). Applies to the dev server, `apex start`, and the on-device mobile bundle
(all share the render path); static/islands builds are served as files with their own caching and
are unaffected. Fixes stale state on any dynamic page (settings, profile, dashboards).
