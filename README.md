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
- **A real ORM, not just CRUD.** One `defineModel` derives schema + migration + a REST/MCP resource **and** an Eloquent-style active-record API — active-record queries (`where` with operators, `orderBy`/`paginate`, `first`/`find`/`findOrFail`), model instances (`save`/`isDirty`) + collections, **relationships with eager loading** (`hasMany`/`belongsTo`/`.with()`, no N+1), transactions, casts, named scopes, serialization (`hidden`), typed errors, and optimistic + pessimistic locking. No hand-written SQL, and writes fire the same hooks/scope/validation as the API.
- **Batteries included.** Platform pillars ship from `@apex-stack/core/server`: cache, file/object storage (local + S3), a background job queue, mail, multi-channel notifications, real-time SSE, and authorization (roles + permissions, opaque API tokens, password-reset/verify flows).
- **Hardened by default.** The server wires in security headers + CSP, rate-limiting, request-body caps, timeouts, CORS, request IDs, password hashing, and secure sealed cookies — you don't opt in.
- **Runs on the phone.** `apex build --mobile` packages your app into an installable native shell that runs the *same* SSR, API routes, on-device SQLite, and auth on the device — fully offline, no server, no port. Same code as the web.
- **Installable + offline on the web too (🟡).** A `pwa: { name }` config block makes `apex build` emit a web manifest + a precache service worker — `apex extend pwa` sets it up, icons included.

## Packages

| Package | Description |
| --- | --- |
| [`@apex-stack/core`](./packages/apexjs) | The CLI and runtime (`apex dev`, `apex build`, `apex start`, `apex mcp`, `apex mobile`) |
| [`create-apexjs`](./packages/create-apexjs) | Project scaffolder (`npm create apexjs@latest`) |
| [`@apex-stack/kit`](./packages/kit) | SFC parser, SSR renderer, and client runtime |
| [`@apex-stack/vite`](./packages/vite) | Vite plugin for `.alpine` files |
| [`@apex-stack/data`](./packages/data) | Drizzle-backed ORM — `defineModel` → schema + migration + REST/MCP resource + active record (relations, transactions, casts, scopes) |

## Data layer

One `defineModel` is the single source of truth for a table: it derives the Zod validation, a dialect-aware Drizzle table, the migration SQL, a REST + MCP resource, **and** an active-record query API — across SQLite/libSQL/Turso and Postgres/Supabase/Neon/PGlite.

```ts
import { defineModel, belongsTo, hasMany, timestamps, owned } from '@apex-stack/data'
import { db } from './db'

const Post = defineModel('posts', {
  fields: {
    title: 'string',
    body: 'string',
    authorId: { type: 'int', references: { table: 'users', column: 'id' } },
    published: { type: 'boolean', default: false },
  },
  use: [timestamps(), owned()],          // server-stamped timestamps + row-level ownership
  casts: { published: 'boolean' },
  hidden: ['body'],                      // omitted from REST/MCP responses + toJSON
  relations: {
    author: belongsTo(() => User, 'authorId'),
    comments: hasMany(() => Comment, 'postId'),
  },
})

Post.resource(db)                        // → /api/posts list/get/create/update/delete + MCP CRUD

// …and the model IS the query API — no hand-written SQL:
await Post.where({ published: true }).orderBy('createdAt', 'desc').limit(10).all(db)
const post = await Post.findOrFail(db, id)            // throws ModelNotFoundException (404)
const feed = await Post.with('author', 'comments').all(db)  // eager-load, one query per relation

await db.transaction(async (tx) => {                  // atomic — auto-commit / auto-rollback
  const p = await Post.create(tx, { title: 'Hi', authorId: user.id })
  await Comment.create(tx, { postId: p.id, body: 'first!' })
})
```

Reads return hydrated **instances** (`save`/`delete`/`refresh`/`isDirty`) and **Collections**; writes (`create`/`update`/`updateOrCreate`/`upsert`/`insertMany`) go through the **same pipeline as your REST/MCP resource**, so `Model.*` and `/api/*` can't diverge. See [`@apex-stack/data`](./packages/data) and [API.md](./API.md).

## Run on the device (mobile)

`apex build --mobile` packages an Apex app into a self-contained bundle that runs its **full SSR + API pipeline on a bare on-device JS engine** — Android's `androidx.javascriptengine`, iOS's JavaScriptCore. Offline, no server, no port: server-rendered pages, `/api` routes, an on-device SQLite (sql.js compiled to pure JS, seeded at boot and persisted across cold starts), and sealed-cookie auth — the same `<script server>` loaders, routes, and auth you wrote for the web, unchanged.

It's a WebView app (like Capacitor or Ionic), but unlike them it runs your **actual server** — SSR + API + DB + auth — on the device, from one TypeScript codebase. Not React-Native native widgets. External APIs (Supabase, Turso over HTTP) still work from client code.

```bash
apex build --mobile                          # self-contained on-device bundle
apex mobile android --appId com.you.app \
  --name "My App" --assemble                 # scaffold native shell, sync assets → APK

# Gradle not on PATH (and no Android Studio)? point Apex at it + your SDK:
apex mobile android --assemble \
  --gradle ~/tools/gradle-8.9/bin/gradle \
  --sdk    ~/Android/Sdk                      # (…/bin/gradle.bat on Windows)

apex mobile ios --appId com.you.app \
  --name "My App" --generate                 # scaffold WKWebView shell, sync assets (build on a Mac)
```

`apex mobile android` scaffolds the native shell and syncs your assets; `--assemble` runs Gradle to produce an installable APK. That needs a **JDK 17+, the Android SDK, and Gradle — but not the Android Studio IDE** (the IDE just bundles those three). Apex resolves Gradle from `--gradle` → the project `gradlew` → `$APEX_GRADLE` → `PATH`, writes `local.properties` from `--sdk`/`$ANDROID_HOME`, runs Windows `gradle.bat` correctly, and `--wrapper` generates a `gradlew` so later builds need only a JDK. `apex mobile ios` scaffolds a WKWebView + JavaScriptCore shell into `mobile/ios` and syncs the same bundle; `--generate` runs XcodeGen, but building and signing an IPA needs a Mac + Xcode (macOS-only — no Windows/Linux path). Android is turnkey; iOS scaffolds anywhere and compiles on a Mac. See the [mobile docs](https://apexjs.site/docs/mobile.html).

## Status

On npm — start with `npm create apexjs@latest`. See [ROADMAP.md](./ROADMAP.md) for
what's built and what's planned.

## Support

Apex JS is free and MIT-licensed. If it's useful to you, you can support its
development:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G7S722N0L8)

## License

MIT © Andre Corugda
