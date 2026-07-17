# Apex JS — Roadmap

*Audience: AI agents + human maintainers. Everything here is grounded in the package
`CHANGELOG.md` files, `API.md`, `AGENTS.md`, and the open GitHub issues — not marketing.*

## Where we are today

Apex JS is a **full-stack, AI-native meta-framework for Alpine.js**: HTML-first pages
(Alpine + islands, ~zero JS by default), file-based routing + SSR on Node, a full
Eloquent-parity ORM, batteries-included backend platform pillars, and the differentiator —
**every typed route and every model is an MCP tool by construction**, so the same app is
callable by an AI agent under the same auth as a logged-in user.

**Status: pre-1.0, approaching 1.0.** The public surface is inventoried and split into
🟢 Stable / 🟡 Experimental in [`API.md`](../../API.md), a deprecation policy is written,
and the road to a 1.0 tag is the top open issue ([#27](https://github.com/andrecorugda/apexjs/issues/27))
— prep is done, the tag is waiting on a stability bake. Until then, treat 🟢 as safe to
build on and 🟡 as "works, shape may still move."

### Published versions (npm)

| Package | Version | What it is |
|---|---|---|
| `@apex-stack/core` | **0.43.2** | The framework + `apex` CLI (public entry point) |
| `@apex-stack/data` | **0.11.3** | The ORM / data layer (`defineModel`, migrations) |
| `create-apexjs` | 0.7.1 | `npm create apexjs@latest` scaffolder |
| `@apex-stack/theme` | 0.3.0 | Tailwind v4 token contract (`apex theme`) |
| `@apex-stack/components` | 0.4.0 | 36-component UI Kit (`apex add`) |
| `@apex-stack/kit` · `@apex-stack/vite` | 0.9.1 · 0.4.1 | Internal — used via core / the CLI only |

Docs, UI Kit browser, and Theme Builder are live at **apexjs.site**.

## The three pillars (positioning)

- **Light** — Alpine + islands, near-zero JS by default.
- **Full-stack** — file routing, SSR, typed API routes on Node, a real ORM.
- **AI-native** — every typed route and model is also an MCP tool, no extra library.

## This roadmap set

| Doc | What it covers |
|---|---|
| [`roadmap.md`](roadmap.md) | **Strategy & vision** — the "curate + integrate, MCP-hook everything" thesis, phase narrative, and the moat. Start here for *why*. |
| [`done.md`](done.md) | **Shipped** — what actually exists today, grouped by area, tied to the versions that shipped it. |
| [`upcoming.md`](upcoming.md) | **Planned / in-flight** — the road to 1.0, next vs later, grounded in the open GitHub issues. |
| [`comparison.md`](comparison.md) | **Apex vs the great frameworks** (Laravel, Rails, Next.js, Nuxt, SvelteKit, Astro) — an honest feature matrix, where Apex is differentiated, and where the incumbents are ahead. |

> The single source of truth for what's stable is [`API.md`](../../API.md). If this
> roadmap and `API.md` ever disagree on a status, `API.md` wins.
