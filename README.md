# Apex JS

> The full-stack meta-framework for Alpine.js. File-based routing, server-side rendering, API routes, and one CLI — powered by Vite and Node.

**📖 Docs & demo: [apexjs.site](https://apexjs.site)**

**Apex is to Alpine what Next.js is to React.** You already know the syntax: if you can write `x-data`, you can build a full-stack, server-rendered app — shipping a fraction of the JavaScript of a React framework.

```bash
npm create apexjs@latest my-app   # scaffolds, installs deps, inits git
cd my-app
npm run dev                        # → http://localhost:3000
```

> `apex` is a project command (like `next` or `vite`) — run it via `npm run dev` or `npx apex`, not a bare `apex`.

## Why Apex

Every major reactive library has a meta-framework — React has Next, Vue has Nuxt, Svelte has SvelteKit. Alpine.js, despite its huge mindshare, has none. Apex fills that gap:

- **HTML-first, JS-light.** Server-render your pages to real HTML; Alpine hydrates only what needs interactivity.
- **Zero new component model.** An `.alpine` single-file component is just HTML, a server `loader()`, and scoped CSS.
- **Node-native.** No PHP required — bring Alpine's DX to the entire JavaScript ecosystem.
- **TypeScript by default.** Strict types end to end.

## Packages

| Package | Description |
| --- | --- |
| [`@apex-stack/core`](./packages/apexjs) | The CLI and runtime (`apex dev`, `apex build`, `apex start`, `apex mcp`) |
| [`create-apexjs`](./packages/create-apexjs) | Project scaffolder (`npm create apexjs@latest`) |
| [`@apex-stack/kit`](./packages/kit) | SFC parser, SSR renderer, and client runtime |
| [`@apex-stack/vite`](./packages/vite) | Vite plugin for `.alpine` files |
| [`@apex-stack/data`](./packages/data) | Drizzle-backed data layer — `defineResource` (REST + MCP) |

## Status

**v0.1.5 on npm.** SSR + hydration, islands (`client:load|idle|visible|none`), file routing,
components, AI-native APIs (REST + MCP from one typed route), a multi-database data layer
(SQLite/Turso/Supabase/Neon), and a full production build — static (`apex build`), zero-JS
(`apex build --islands`), or a Node server (`apex build --server` + `apex start`) for dynamic
routes + API/MCP. All covered by tests. Jobs/queues and Nitro deploy presets are next.
See [ROADMAP.md](./ROADMAP.md).

## License

MIT © Andre Corugda
