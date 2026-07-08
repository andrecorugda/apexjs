<div align="center">
  <img src="assets/apex-mark.png" alt="Apex JS" width="96" height="96" />
</div>

```text
 █████╗ ██████╗ ███████╗██╗  ██╗       ██╗███████╗
██╔══██╗██╔══██╗██╔════╝╚██╗██╔╝       ██║██╔════╝
███████║██████╔╝█████╗   ╚███╔╝        ██║███████╗
██╔══██║██╔═══╝ ██╔══╝   ██╔██╗   ██   ██║╚════██║
██║  ██║██║     ███████╗██╔╝ ██╗  ╚█████╔╝███████║
╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝   ╚════╝ ╚══════╝
```

<div align="center">

**The full-stack, AI-native meta-framework for Alpine.js**

[![npm](https://img.shields.io/npm/v/@apex-stack/core?color=6366f1&label=%40apex-stack%2Fcore)](https://www.npmjs.com/package/@apex-stack/core)
[![license](https://img.shields.io/npm/l/@apex-stack/core?color=22d3ee)](LICENSE)
[![node](https://img.shields.io/node/v/@apex-stack/core?color=6366f1)](https://nodejs.org)

**📖 Docs & live demo — [apexjs.site](https://apexjs.site)**

</div>

> The full-stack meta-framework for Alpine.js. File-based routing, server-side rendering, API routes, and one CLI — powered by Vite and Node.

**Apex is to Alpine what Next.js is to React.** You already know the syntax: if you can write `x-data`, you can build a full-stack, server-rendered app — shipping a fraction of the JavaScript of a React framework.

```bash
npm i -g @apex-stack/core   # install the Apex CLI (once)
apex new my-app             # scaffold, install deps, init git
cd my-app
apex dev                    # → http://localhost:3000
```

> No global install? `npm create apexjs@latest my-app`, then `npm run dev` — same result using the
> project-local CLI (`apex` then runs via `npm run dev` / `npx apex`, like `next` or `vite`).

## Why Apex

Every major reactive library has a meta-framework — React has Next, Vue has Nuxt, Svelte has SvelteKit. Alpine.js, despite its huge mindshare, has none. Apex fills that gap:

- **HTML-first, JS-light.** Server-render your pages to real HTML; Alpine hydrates only what needs interactivity.
- **Zero new component model.** An `.alpine` single-file component is just HTML, a server `loader()`, and scoped CSS.
- **Node-native.** No PHP required — bring Alpine's DX to the entire JavaScript ecosystem.
- **TypeScript by default.** Strict types end to end.
- **AI-native, safely.** Every typed route is also an MCP tool — and one auth policy (`defineAuth` + `auth`/`can` + resource `access`/`scope`) governs pages, REST, **and** the MCP surface, so an AI can never exceed the logged-in user. See [AUTH_DESIGN.md](./AUTH_DESIGN.md).

## Packages

| Package | Description |
| --- | --- |
| [`@apex-stack/core`](./packages/apexjs) | The CLI and runtime (`apex dev`, `apex build`, `apex start`, `apex mcp`) |
| [`create-apexjs`](./packages/create-apexjs) | Project scaffolder (`npm create apexjs@latest`) |
| [`@apex-stack/kit`](./packages/kit) | SFC parser, SSR renderer, and client runtime |
| [`@apex-stack/vite`](./packages/vite) | Vite plugin for `.alpine` files |
| [`@apex-stack/data`](./packages/data) | Drizzle-backed data layer — `defineResource` (REST + MCP) |

## Status

**On npm — start with `npm create apexjs@latest`** (packages are versioned independently via
Changesets; use `@latest`). SSR + hydration, islands (`client:load|idle|visible|none`), file routing,
components, AI-native APIs (REST + MCP from one typed route), a multi-database data layer
(SQLite/Turso/Supabase/Neon), a **security model** (`defineAuth` + route `auth`/`can` + resource
`access`/`scope` + sealed sessions/CSRF — one fail-closed policy across pages/REST/MCP, verified by
two independent adversarial passes), and a full production build — static (`apex build`), zero-JS
(`apex build --islands`), or a Node server (`apex build --server` + `apex start`) for dynamic
routes + API/MCP. All covered by tests. Jobs/queues and Nitro deploy presets are next.
See [ROADMAP.md](./ROADMAP.md).

## Support

Apex JS is free and MIT-licensed. If it's useful to you, you can support its
development:

<a href="https://ko-fi.com/G7S722N0L8" target="_blank"><img height="36" style="border:0px;height:36px;" src="https://storage.ko-fi.com/cdn/kofi6.png?v=6" border="0" alt="Buy Me a Coffee at ko-fi.com" /></a>

## License

MIT © Andre Corugda
