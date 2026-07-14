---
"@apex-stack/core": patch
---

Mobile: pluggable SSR `fetch` seam for external HTTP (Supabase/Turso/any REST). The mobile
runtime's server-side `fetch` now uses `globalThis.__APEX_FETCH__` when a network-capable host
(iOS `JSContext`, RN/Hermes) provides one, and otherwise rejects with guidance instead of an
opaque error. Client-side `fetch` (from `<script client>`, in the WebView) already reaches the
network directly — the WebView fetch-patch passes cross-origin requests straight through — so
`@supabase/supabase-js` and Turso-over-HTTP work today from client code. See the native-shell
guide's "External APIs & Supabase" section.
