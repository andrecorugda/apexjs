# Upcoming

Planned and in-flight work, grounded in the open GitHub issues. Split into **the road to
1.0**, **next**, **later**, and **deferred**. Each item links its tracking issue.

Open issues (as of this writing): [#17](https://github.com/andrecorugda/apexjs/issues/17),
[#18](https://github.com/andrecorugda/apexjs/issues/18), [#19](https://github.com/andrecorugda/apexjs/issues/19),
[#20](https://github.com/andrecorugda/apexjs/issues/20), [#21](https://github.com/andrecorugda/apexjs/issues/21),
[#26](https://github.com/andrecorugda/apexjs/issues/26), [#27](https://github.com/andrecorugda/apexjs/issues/27).

---

## The road to 1.0 — the top priority

### [#27](https://github.com/andrecorugda/apexjs/issues/27) — API stability → tag 1.0  `production-readiness`

The single biggest production risk is **per-minor breaking churn, not a missing feature**.
Recent minors shipped breaking changes (handler ctx shape, model insert typing, MCP
internals, `apex extend` new in 0.18). The DoD: a documented stable surface + deprecation
policy + a green upgrade path, then tag **1.0.0**.

**Status: prep is done, the tag is pending a bake.** The stable/experimental inventory
([`API.md`](../../API.md)) and the deprecation policy are written; [`UPGRADING.md`](../../UPGRADING.md)
exists. What remains is *time*: the graduation rule is ≥2 minors unchanged **and** a real
app on each 🟡 surface before it becomes 🟢 — a framework earns 1.0 by not breaking people
for months, not by declaring it. The bulk of the platform pillars, the ORM query API, and
mobile all landed recently as 🟡, so they need to soak before the freeze.

### [#26](https://github.com/andrecorugda/apexjs/issues/26) — Scale & load validation  `production-readiness`

Apex has **no real performance data** — every test to date is single-user, localhost,
seconds-long. "Scalable" is currently unproven. DoD: a published perf report (p50/p95/p99
under sustained concurrency for a static SSR page, a DB-backed page, and a JSON API POST;
RSS over 100k+ requests; Postgres pool-sizing guidance; evaluate streaming SSR). This is a
1.0-blocking credibility gap, not a feature.

## Next — high-value gaps, well-specified

### [#17](https://github.com/andrecorugda/apexjs/issues/17) — Plugin / module system

`definePlugin({ name, setup(hooks) })` so third parties can extend Apex — register routes,
middleware, components, config, and an **MCP hook** — loaded at boot across dev/prod/build.
Mirrors the existing middleware/auth discovery-and-run shape. This is the keystone for an
ecosystem (and dovetails with deploy presets exposing a `DeployPreset` contract). Without
it, all extension goes through core.

> **Merged on `develop` (pending release):** #18, #19, and #20 below are **code-complete and
> merged** — they ship in the next release and move to [done](done.md) then. Kept here (with their
> original scope) until that release closes the issues.

### [#19](https://github.com/andrecorugda/apexjs/issues/19) — Deploy preset: Cloudflare (edge)

Vercel / Netlify / Docker **already ship** (see [done](done.md)). Cloudflare Workers is the
remaining target — a Workers entry (`_worker.js`) + asset manifest, Nitro-style, minding
edge constraints (no `node:*` in the edge path). A `DeployPreset` interface (`name`,
`build(ctx)`) lets third parties add their own presets.

### [#18](https://github.com/andrecorugda/apexjs/issues/18) — Image & font optimization

An `<Image>`-style helper backed by an image transform (`vite-imagetools` or `sharp`) that
emits responsive `srcset`/`sizes` + explicit dimensions (avoid CLS), plus self-hosted fonts
with `<link rel="preload">`. Closes the last raw parity gap with Next/Nuxt on asset
optimization. **Merged on `develop`** — ships next release.

## Later — larger builds

### [#20](https://github.com/andrecorugda/apexjs/issues/20) — Fine-grained (DOM-morphing) HMR

Previously template/script edits **full-reload**ed (only style edits hot-swapped in place).
This upgrades the template-edit path to morph the DOM in place
(`@alpinejs/morph`), preserving Alpine state (open dropdowns, form input), with a
full-reload fallback when the root `x-data` shape changes. Quality-of-life; not
1.0-blocking.

### [#21](https://github.com/andrecorugda/apexjs/issues/21) — Template type-checking (Apex LSP / Volar)

The largest effort in the gap set. A new `@apex-stack/lsp` package + a real VS Code language
client (the extension is grammar-only today): unknown-component diagnostics (red squiggle on
`<Typo/>`), go-to-definition, prop/`x-data` completion, and Volar-style template
type-checking. **Phase 1 already shipped** as `apex check --alpine` (type-checks `<script>`
blocks, core 0.27.0); this issue is the editor-integrated, template-expression continuation.

## Deferred — on the roadmap, not in the public surface

Per [`API.md`](../../API.md), **do not document these as available**:

- **OAuth / SSO** — not shipped. Today it's adapter territory: wire an external provider via
  `sessionAuth`'s `toUser` or a custom `defineAuth`.
- **2FA** — not shipped (same adapter note).
- **belongsToMany / pivot relations** in the ORM — `belongsTo`/`hasOne`/`hasMany` ship; pivot deferred.
- **`x-for`/`x-if` inside islands** — works in the standard SSR/hydration path; the islands-mode (lazy-Alpine) case is deferred.
- **Client-side nav in islands mode** and **persistent layout regions** (`data-apex-persist`) — SPA nav ships for the standard path; these two cases are deferred.
- **Streaming SSR** — flagged for evaluation under the scale work (#26).
- **`outputSchema` → MCP structured content** — deferred.
- **Apex Compass** (dev-time framework-awareness MCP + rules-file generation, `@apex-stack/compass`) — planned; partially realized already via `apex mcp-server` + the scaffolded `AGENTS.md`.

## How to read status here vs the strategy doc

[`roadmap.md`](roadmap.md) frames the *vision and phases*; this file tracks the *concrete
open work*. When they disagree on whether something shipped, trust [`done.md`](done.md) +
the `CHANGELOG.md`s + [`API.md`](../../API.md) — the roadmap narrative can lag the releases.
