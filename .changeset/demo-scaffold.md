---
'create-apexjs': minor
'@apex-stack/core': minor
---

New default scaffold: a real, themed multi-page demo app.

`create-apexjs` / `apex new` now scaffold a proper starter instead of a bare
placeholder — a themed layout with a navbar, branding, and a dark-mode toggle; a
landing page; a blog (list + dynamic `[slug]` detail) served from a sample-data
`PostService` (no database); an About page with SEO via `head()`; bundled themed
components (Button, Card, Badge, Counter); and an API route that's also an MCP
tool. The default `build` script targets the server (SSR + dynamic routes + API/
MCP work in production); `build:static` prerenders the static pages. Verified via
a fresh install: dev, server build + start, typecheck, and tests all green.
