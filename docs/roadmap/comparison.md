# Apex JS vs the great frameworks

An honest, current comparison — no dishonest wins. Apex is **pre-1.0**; the incumbents are
mature, battle-tested, and backed by large ecosystems and communities. That maturity gap is
real and is stated up front. Apex's case rests on **two things nothing else on this list has
built-in** — AI-native MCP from every route, and one codebase running offline on-device —
plus being **batteries-included like Laravel but in TypeScript and HTML-first**.

Compared here: **Laravel** (PHP), **Rails** (Ruby), **Next.js** (React/TS), **Nuxt**
(Vue/TS), **SvelteKit** (Svelte/TS), with **Astro** noted where its islands/HTML-first model
is the closest analogue.

## Legend

| Mark | Meaning |
|---|---|
| ✅ | Built-in and mature |
| 🟡 | Built-in but young / partial (Apex: 🟡 Experimental per `API.md`) |
| ➕ | Not core — supplied by a first-party module or the ecosystem (an add-on) |
| ❌ | Not available |

## Feature matrix

| Dimension | Laravel | Rails | Next.js | Nuxt | SvelteKit | **Apex** |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| SSR / server rendering | ✅¹ | ✅¹ | ✅ | ✅ | ✅ | ✅ |
| Islands / partial hydration | ➕ | ➕ | ❌² | 🟡 | ❌² | ✅ |
| File-based routing | ➕ | ❌ | ✅ | ✅ | ✅ | ✅ |
| ORM / data layer | ✅ Eloquent | ✅ ActiveRecord | ➕ | ➕ | ➕ | ✅ (Eloquent-parity) |
| Migrations | ✅ | ✅ | ➕ | ➕ | ➕ | ✅ |
| Auth | ✅ | ➕³ | ➕ | ➕ | ➕ | 🟡⁴ |
| Background jobs / queue | ✅ | ✅ | ➕ | ➕ | ➕ | 🟡 |
| Cache | ✅ | ✅ | 🟡⁵ | ➕ | ➕ | 🟡 |
| Object / file storage | ✅ | ✅ | ➕ | ➕ | ➕ | 🟡 |
| Mail | ✅ | ✅ | ➕ | ➕ | ➕ | 🟡 |
| Real-time | ✅⁶ | ✅⁶ | ➕ | ➕ | ➕ | 🟡 (SSE) |
| Deploy targets | ➕ | ➕ | ✅ | ✅ (Nitro) | ✅ (adapters) | 🟡⁷ |
| **AI-native — every route/model is an MCP tool** | ❌⁸ | ❌ | ❌ | ❌ | ❌ | ✅ **unique** |
| **Auth governs the AI/MCP surface** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **unique** |
| **On-device mobile, offline** (SSR+DB on the phone) | ❌ | ❌ | ❌ | ❌ | ❌ | 🟡 **unique** |
| PWA / installable | ➕ | ➕ | ➕ | ✅ | ➕ | 🟡 |
| Primary language | PHP | Ruby | TS/JS | TS/JS | TS/JS | **TS** |
| Maturity / 1.0 | ✅ 10+ yrs | ✅ 15+ yrs | ✅ | ✅ | ✅ | ❌ **pre-1.0** |
| Ecosystem / plugins | ✅ huge | ✅ huge | ✅ huge | ✅ large | ✅ growing | ❌ (plugin system is [#17](https://github.com/andrecorugda/apexjs/issues/17)) |
| Community / hiring pool | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ solo/early |

**Footnotes**
1. Laravel (Blade) and Rails render HTML server-side by default; "SSR" in the JS sense (hydrated client app) is via Livewire/Hotwire or Inertia.
2. Next.js/SvelteKit are component-hydration frameworks, not islands frameworks; **Astro** is the islands champion in this space — the closest analogue to Apex's model, though Astro leans content-first and leaves most backend concerns to add-ons.
3. Rails auth is typically Devise (gem) or `has_secure_password` (built-in primitive); full auth is a gem.
4. Apex auth is built-in and enforced across pages/REST/MCP (adversarially verified) — but **OAuth/SSO and 2FA are deferred** (adapter territory today); hence 🟡, not ✅.
5. Next.js has framework-level data/route caching, not a general-purpose app cache API.
6. Laravel Broadcasting (Reverb/Pusher), Rails ActionCable — mature WebSocket stacks. Apex ships **SSE** broadcasting (simpler, one-way + reconnect), not WebSockets.
7. Vercel/Netlify/Docker ship; **Cloudflare/edge is pending** ([#19](https://github.com/andrecorugda/apexjs/issues/19)). Nuxt/SvelteKit have broader, more mature adapter sets.
8. Laravel Boost is a *dev-time* AI helper, not runtime MCP exposure of your app's routes/data. Apex's MCP is the running app itself, under the caller's auth.

## Where Apex is genuinely differentiated

These are real, verifiable, and (today) unique on this list:

- **AI-native by construction.** `defineApexRoute` and `defineModel` produce a REST endpoint
  **and** an MCP tool from one definition — no separate tool layer, no schema duplication.
  Point an agent at `/mcp` and it can call the same surface your UI does.
- **Auth governs the AI surface.** The *same* policy that gates a page gates the MCP tool:
  unauthorized routes are omitted from a user's `tools/list` and refused on `tools/call`;
  model `scope()` means an agent sees only the caller's rows. The AI can never do more than
  the logged-in user. No other framework here has an MCP surface to govern in the first place.
- **One codebase → web + native-mobile-offline + PWA.** `apex build --mobile` runs the *full*
  SSR + API pipeline **on the device** in a bare JS engine, with on-device SQLite (pure-JS
  asm.js, persisted across cold starts) and offline sealed-cookie sessions — proven by a
  canvas game shipped to web, an Android APK, an iOS shell, and a PWA off one source tree.
  This goes past a Capacitor/Tauri static wrap: your server runs on the phone.
- **HTML-first, ~zero-JS by default.** Alpine + islands means real HTML ships first and JS
  loads only where an island needs it — the Astro philosophy, extended to a full-stack,
  data-backed, AI-callable app.
- **Batteries included, in TypeScript.** The Laravel/Rails "the framework provides it" feel —
  ORM, migrations, auth, jobs, cache, storage, mail, real-time, notifications — but on Node/TS
  and with every data surface AI-callable. Next.js/SvelteKit leave most of that to the ecosystem.

## Where the incumbents are clearly ahead

No spin here — these are the honest reasons to *not* pick Apex today:

- **Maturity & stability.** Laravel and Rails have a decade-plus of production hardening; Next,
  Nuxt, and SvelteKit are all past 1.0 with semver guarantees. Apex is **pre-1.0** and still
  ships breaking changes in minors ([#27](https://github.com/andrecorugda/apexjs/issues/27)).
- **Proven scale.** Apex has **no load/perf data yet** ([#26](https://github.com/andrecorugda/apexjs/issues/26)) —
  every test to date is single-user and local. The incumbents run at massive scale in production.
- **Ecosystem & plugins.** Thousands of packages, adapters, and integrations for the others;
  Apex's plugin system isn't built yet ([#17](https://github.com/andrecorugda/apexjs/issues/17)).
- **Community, docs depth, hiring.** Huge communities, StackOverflow coverage, courses, and a
  hiring pool. Apex is early and effectively solo-maintained.
- **Auth breadth.** Laravel (Sanctum/Passport/Socialite) and the JS auth libraries ship OAuth,
  SSO, and 2FA. Apex defers those.
- **Deploy & real-time breadth.** Nuxt/SvelteKit have wider, more mature deploy adapters; Laravel/Rails
  have mature WebSocket broadcasting. Apex has three deploy presets and SSE.
- **Editor tooling.** First-class LSP/type-checking for templates elsewhere; Apex's is grammar-only
  today (`apex check --alpine` covers script blocks; the full LSP is [#21](https://github.com/andrecorugda/apexjs/issues/21)).

## When to pick Apex vs each

- **vs Laravel / Rails** — pick Apex when you want that batteries-included, model-centric
  productivity **in TypeScript**, want HTML-first ~zero-JS pages instead of Blade/Hotwire, and
  specifically want your app to be **AI-agent-callable** and/or shippable as an **offline mobile
  app** from the same code. Stay on Laravel/Rails when you need proven scale, the deep ecosystem,
  OAuth/2FA out of the box, or a hiring pool — today, most production teams.
- **vs Next.js** — pick Apex when you'd otherwise assemble Next + Prisma + NextAuth + a queue +
  a cache + a mailer yourself and want them **integrated and AI-native** instead, with far less
  client JS. Stay on Next for the ecosystem, React talent, edge maturity, and 1.0 stability.
- **vs Nuxt** — closest philosophical cousin (file routing, SSR, conventions, an MCP-analogous
  "everything wired" feel). Pick Apex for the AI-native MCP surface, the built-in ORM, and
  on-device mobile; stay on Nuxt for the mature module ecosystem, Nitro's deploy breadth, and Vue.
- **vs SvelteKit** — pick Apex for batteries-included backend + AI-native; SvelteKit if you want
  Svelte's DX and compiled reactivity and are happy assembling the backend from the ecosystem.
- **vs Astro** — the nearest islands/HTML-first analogue. Pick Apex when you need a **full-stack,
  data-backed, AI-callable** app (ORM, auth, jobs, MCP), not primarily a content site; Astro when
  content/marketing with light interactivity is the job and you want its mature integrations.

## One-line summary

> **Apex today:** the only framework here where your whole app is an MCP tool under the user's
> own auth, and runs offline on a phone — batteries-included in TypeScript, HTML-first. **But
> pre-1.0, unproven at scale, and without an ecosystem.** Differentiated, not yet mature — pick
> it for the moat, not for the safety.
