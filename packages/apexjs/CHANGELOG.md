# @apex-stack/core

## 0.7.7

### Patch Changes

- 38b0fc3: Simplify `.alpine` highlighting to the parts that matter, robustly (VS Code 0.1.9).

  Drops the fragile `@`/`:`/slot/magic name-matching (left to the base HTML grammar,
  which handles them cleanly) and the embedded-JS attribute values. What's colored now,
  and reliably: **components** (`<Button>`), all **`x-` directives** (name + value
  swallowed as one token so HTML never flags the value invalid), and the three
  structural tags — **`<template>`**, **`<script>`**, **`<style>`** — plus the
  `server`/`client`/`scoped` modifiers. Verified with the TextMate engine: zero invalid
  tokens on real `.alpine` pages incl. nested `<template>`.

## 0.7.6

### Patch Changes

- 62b1885: Fix `.alpine` highlighting breaking attribute values (VS Code extension 0.1.8).

  The injection matched only the directive/bind/event **name** (`x-text`, `:href`,
  `@click`), which left the base HTML tag parser staring at a dangling `="…"` and
  flagging every value as `invalid.illegal.character-not-allowed-here` — so all the
  markup below the first directive rendered as errors. The value-bearing patterns now
  consume the whole `name="value"` and embed the expression as JS, so Alpine
  expressions are highlighted (strings, operators, identifiers) and nothing is flagged
  invalid. Verified against real `.alpine` pages (incl. nested `<template x-for>` /
  `<template x-if>`) with the TextMate engine: zero invalid tokens.

## 0.7.5

### Patch Changes

- 29b4f85: Fix `.alpine` syntax highlighting (VS Code extension 0.1.7) — it now actually works.

  The grammar's injection targeted the `text.html.basic` scope, which isn't on the
  scope stack when HTML is `include`d under `source.alpine` — so **none** of the
  Alpine/Apex highlighting fired (components, directives, events, binds all rendered
  as plain HTML). Injecting against `source.alpine` fixes it, verified with the
  TextMate engine. Also ships on-brand color defaults (`configurationDefaults`) so
  components, directives, `<template x-for/x-if>`, `<slot>`, events, binds, islands,
  and magics are visibly colored in any theme.

## 0.7.4

### Patch Changes

- 0451068: `.alpine` highlighting marks Alpine's structural tags (VS Code extension 0.1.6).

  Beyond components, `<template x-for>` / `<template x-if>` are now colored as
  control-flow (Alpine's loops & conditionals stand out), and `<slot>` (the
  component content outlet) gets its own color. Also documents the Apex Language
  Server (does-component-exist checks, go-to-definition, autocomplete) as a roadmap
  item — today's extension is grammar-only.

## 0.7.3

### Patch Changes

- 2a16365: Richer `.alpine` syntax highlighting (VS Code extension 0.1.5).

  Component tags (`<Button>`, `<Card/>`) are now colored as component types (they
  previously rendered like plain HTML tags), plus better coverage for Alpine
  directives (`x-*` with `:arg` split), event modifiers (`@click.prevent.window`),
  binds (`:class`), islands directives (`client:load|idle|visible|none`), Alpine
  magics (`$refs`, `$store`, …), and `<script server|client lang>` / `<style scoped>`.

## 0.7.2

### Patch Changes

- 18800ea: Dev error page fixes: the project file tree no longer disappears when toggling
  Frames/Raw (the tabs wrongly hid it), the tree is fully expanded by default, and
  the error's origin file is marked red even for compile/transform errors (e.g. a
  malformed `.alpine`) — the offending file is taken from Vite's error `loc`/`id`
  and surfaced as a top "compile error" frame with code context.
- 1e48f34: No more style flash — and production builds are actually styled.

  The global `app.css` (Tailwind + shared styles) was loaded via a deferred JS
  import at the end of `<body>`, so pages painted unstyled (white) for a moment
  before styling applied — a flash on every navigation. It's now a render-blocking
  `<link>` in `<head>`. Critically, the **production** client build never ran the
  Tailwind plugin nor linked the extracted CSS, so built sites shipped with **no
  Tailwind at all**; `apex build`/`--server` now process `app.css` through Tailwind,
  extract it to a hashed asset, and link it in every page's `<head>`. VS Code
  extension icon updated (0.1.4).

## 0.7.1

### Patch Changes

- 3739636: Clear "not an Apex app" page when `apex dev` runs outside a project.

  Running `apex dev` in a folder with no `pages/` (e.g. a parent folder containing
  several apps) previously showed a cryptic Vite error ("Failed to load url
  …/pages/index.alpine. Does the file exist?"). It now renders a helpful page that
  explains no `pages/*.alpine` were found and suggests the subfolders that ARE Apex
  apps (`cd my-app && apex dev`).

## 0.7.0

### Minor Changes

- 7d5caca: Sentry-style dev error page.

  When a page loader throws in dev (and there's no `pages/error.alpine`), the
  overlay is now a proper debugger: expandable stack-frame cards with inline code
  context (failing line highlighted), a Frames/Raw toggle, a project file tree
  with folder/file icons where the error's origin file is marked red, and
  "open in editor" links. A dev-only `/__apex_open` endpoint launches the file at
  its line/column in your editor (honors `$APEX_EDITOR`/`$EDITOR`, else the
  detected VS Code / Cursor / Windsurf / VSCodium CLI); it only opens files inside
  the project root.

- 9600a30: Islands mode now applies layouts + `head()`, and the demo scaffold is branded.

  - **Islands fix:** `apex dev --islands` (and the islands build) previously rendered
    the bare page — no layout, no `head()`/SEO — so nav/branding/footer vanished and
    pages looked broken. The page is now wrapped in its layout chain and the whole
    tree (layout + page) runs through the islands walker, so `client:*` directives in
    the layout or page hydrate. Root x-data defaults are available as SSR scope too.
  - **Branded scaffold:** the starter ships the Apex mark (`public/favicon.svg`),
    shows it in the nav + a hero ("Built with Apex JS"), and the shell emits a
    `<link rel="icon">` by default. The demo's interactivity now uses `client:*`
    islands, so it works in BOTH default and islands mode (dark toggle, counter,
    and the reveal all hydrate). Theme also respects `prefers-color-scheme` on first
    visit.
  - **Smarter editor extension prompt:** `apex new` / `apex upgrade` now detect VS
    Code **and its forks** (Cursor, Windsurf, VSCodium) and check the installed
    extension version — they only prompt to _install_ (not present) or _update_
    (older), and stay quiet with an "up to date" note when it's already current.
    Extension icon is the Apex mark.

## 0.6.0

### Minor Changes

- f39ad83: New default scaffold: a real, themed multi-page demo app.

  `create-apexjs` / `apex new` now scaffold a proper starter instead of a bare
  placeholder — a themed layout with a navbar, branding, and a dark-mode toggle; a
  landing page; a blog (list + dynamic `[slug]` detail) served from a sample-data
  `PostService` (no database); an About page with SEO via `head()`; bundled themed
  components (Button, Card, Badge, Counter); and an API route that's also an MCP
  tool. The default `build` script targets the server (SSR + dynamic routes + API/
  MCP work in production); `build:static` prerenders the static pages. Verified via
  a fresh install: dev, server build + start, typecheck, and tests all green.

### Patch Changes

- e39ef9a: Dev server no longer crashes with a cryptic `postcss ENOENT: … 'tailwindcss'`
  when `app.css` imports Tailwind but it isn't installed. It now skips the
  stylesheet and prints a clear warning telling you to run
  `npm i -D tailwindcss @tailwindcss/vite`, so the app still boots (unstyled).
- Updated dependencies [005de5d]
  - @apex-stack/kit@0.3.0
  - @apex-stack/vite@0.1.7

## 0.5.0

### Minor Changes

- 033bdaa: `apex add` now takes multiple components at once — `apex add button card modal` (or `apex add --all`). Pairs with the new UI Kit gallery on apexjs.site: tick the components you want and copy the single generated command.

## 0.4.1

### Patch Changes

- dd3997a: Component catalog → 36 (the full standard PenguinUI set, MIT-attributed).

  Added: Carousel, ChatBubble, Counter, Range, FileInput, Rating, Pagination, Steps, Navbar, Sidebar, Table, Combobox, Toast — converted to `.alpine` with token classes kept verbatim and Alpine wiring preserved on the interactive/structural ones (carousel, counter, rating, navbar/sidebar mobile menus, combobox search, toast stack). `apex add` now serves all 36.

## 0.4.0

### Minor Changes

- 26d83ca: Turnkey styling + `apex theme`.

  - **Scaffold is now styled out of the box** — `apex new` apps ship an `app.css` wired for Tailwind v4 (`@import 'tailwindcss'; @source './**/*.alpine';`) with the theme's `@theme` token block, plus `tailwindcss` + `@tailwindcss/vite` dev deps. Components added with `apex add` render themed immediately.
  - **`apex theme`** — write/update your theme tokens in `app.css` (or `--out`): `apex theme --primary '#e11d48' --radius 0.75rem --font-title '"Inter"'`. It edits a managed `/* apex-theme:start … end */` block, so every component restyles at once. No flags re-applies the default theme. (`@apex-stack/theme` is bundled into the CLI, so it works from a global install.)
  - `apex add` now nudges you to run `apex theme` if the project isn't Tailwind-wired yet.

## 0.3.1

### Patch Changes

- 557c35d: Adopt the PenguinUI token contract (adapted, MIT — see NOTICE).

  - **`@apex-stack/theme`** now uses the PenguinUI token vocabulary (`surface / surface-alt / on-surface(-strong) / primary / secondary / on-* / outline(-strong) / info-success-warning-danger / radius / fonts` + `-dark` variants) as a Tailwind v4 `@theme` contract. Ships `theme.css` (import after `@import 'tailwindcss'`), `defineTheme()`, `renderThemeCss()`. **BREAKING**: replaces the old `--ax-*` vocabulary + drops the `/preset` export.
  - **`@apex-stack/components`** — Button/Card/Badge re-authored against the tokens (`bg-primary`, `rounded-radius`, `dark:*`), so they inherit `apex theme`. Attribution `NOTICE` added.
  - More components (the full PenguinUI catalog) land next.

## 0.3.0

### Minor Changes

- 6bd3191: Themeable components + `apex add` (the components epic, first slice).

  - **`@apex-stack/theme`** — semantic design tokens as `--ax-*` CSS variables (light + dark), `defineTheme()` / `renderThemeCss()`, and a Tailwind preset (`bg-primary`, `rounded`, …). One theme, inherited by every component.
  - **`@apex-stack/components`** — a registry of `.alpine` components (Button, Card, Badge) styled against the theme tokens (with sane fallbacks, so they look right with or without a custom theme).
  - **`apex add <name>`** — copies a component's `.alpine` source into your `components/` (shadcn-style; non-destructive, `--force` to overwrite). `apex add` with no name lists what's available. The registry is bundled into the CLI, so it works right after `apex new`.

  Verified: changing a theme token (`primary`) restyles the component through the CSS cascade — proven end-to-end.

## 0.2.2

### Patch Changes

- 3586f27: VS Code extension: proper app-icon tile. The `.alpine` extension icon is now a branded gradient tile (indigo→cyan) with a white faceted "A" — no theme-dependent corner artifacts (the previous versions showed white triangles around the diagonal mark on light backgrounds). Extension → 0.1.2, re-bundled.

## 0.2.1

### Patch Changes

- d15b536: VS Code extension: transparent (backgroundless) icon. The bundled `.alpine` extension icon is now a proper transparent-background glyph (the faceted Apex "A" mark) instead of a solid-background image. Extension bumped to 0.1.1 and re-bundled into the package.

## 0.2.0

### Minor Changes

- 2f71124: Form-action sugar — `createAction(url, opts)` (from `@apex-stack/core/client`).

  Spread it into an `x-data` to bind a form to an Apex route with `pending` / `error` / `data` state and no boilerplate:

  ```html
  <script client>
    import { createAction } from "@apex-stack/core/client";
  </script>
  <template
    x-data="{ ...createAction('/api/messages', { onSuccess: () => location.reload() }) }"
  >
    <form @submit="submit($event)">
      <input name="body" />
      <button
        :disabled="pending"
        x-text="pending ? 'Saving…' : 'Post'"
      ></button>
      <p x-show="error" x-text="error"></p>
    </form>
  </template>
  ```

  Posts the form as JSON to the same typed route your REST clients + MCP tools hit — one server surface. Methods/fields survive object-spread (stays reactive).

- 6dd4d89: Shared FE/BE types — `defineApexRoute` now carries its input/output types, and `InferInput`/`InferOutput` derive them.

  ```ts
  // server/api/posts.ts
  export default defineApexRoute({
    input: { id: z.coerce.number() },
    handler: ({ input }) => getPost(input.id),
  });

  // on the frontend — one contract, no duplicated types, no drift
  import type { InferOutput } from "@apex-stack/core";
  import type posts from "../server/api/posts";
  type Post = InferOutput<typeof posts>;
  ```

  Phantom type fields (erased at runtime); use a `import type` on the frontend so no server code is bundled.

- ad58fe5: Nested layouts + per-route error boundaries.

  - **Nested layouts** — a layout can declare its own parent via `export const layout = '<name>'`; Apex wraps outward (page → layout → parent layout …), merging each layer's scoped CSS. Cycle-guarded.
  - **Error boundary** — add `pages/error.alpine`; when a page `loader()` throws, Apex renders the error page (wrapped in your layouts) with `{ error: { message, statusCode } }` instead of crashing. Wired in dev + prod. Throw a `{ statusCode }`-bearing error to set the code. (Loading boundaries pair with client-side navigation — tracked.)

- cc6ff69: Route middleware — `middleware/*.ts`, each `export default defineMiddleware(ctx => …)`.

  - Runs on every request (filename order; prefix `01.`/`02.` to sequence) before the page/API handler.
  - `ctx` = `{ url, method, config, headers, locals, redirect(to, status?) }`. Set `ctx.locals.*` to attach request-scoped state (an authenticated user, request id, flags); return `ctx.redirect('/login')` to short-circuit.
  - `locals` is threaded into the page `loader({ locals })` / `head`, and every `defineApexRoute`/resource handler (`{ locals }`) — REST and MCP.
  - Wired through dev, prod (`apex start`, baked into the build manifest), and the static/server build. `apex make middleware <name>` scaffolds one. Foundation for the planned auth/permissions layer.

- f1a7eca: Runtime configuration from `apex.config.ts` + `.env` (Nuxt/Laravel-style).

  - **`apex.config.ts`** with `defineConfig({ runtimeConfig })` — declare defaults; `public` values reach the browser, everything else is server-only.
  - **`.env` loading** — `.env`, `.env.<mode>`, `.env.local`, `.env.<mode>.local` (later wins), real env vars are never clobbered. Any declared leaf is overridden from the environment: `APEX_<KEY>` (private) / `APEX_PUBLIC_<KEY>` (public), camelCase ↔ SCREAMING_SNAKE, with type coercion.
  - **`useRuntimeConfig()`** — full config on the server, the `public` subset in the browser (seeded into the page, `</script>`-escaped). **`env('KEY', fallback)`** is the raw escape hatch.
  - **`config` in context** — page `loader({ config })`, `head({ config })`, and every `defineApexRoute` / resource handler (`{ input, config }`) — REST **and** MCP tool calls. Private values never ship to the client.
  - Wired through dev, prod (`apex start` applies deploy-time env over baked defaults), and the static/server build. The scaffold ships `apex.config.ts` + `.env.example` and gitignores real `.env` files.

- 6626d2d: `apex upgrade` + deploy-time env fixes (surfaced by fresh-install testing).

  - **`apex upgrade`** — adopt new scaffold defaults in an existing app, non-destructively: adds any template files the project is missing (e.g. a newly-introduced `apex.config.ts`), never overwrites existing files, and always preserves `package.json`. `--force` re-syncs changed files (still preserving `package.json`). Idempotent. The upgrade path stays non-breaking; only a deliberate overhaul (`--force`) can overwrite.
  - **fix(config): deploy-time env now works in prod.** The prod server loaded `.env` from the build dir instead of the working directory, so deploy-time overrides were ignored. It now reads `.env` (and always-respected real `process.env`) from `process.cwd()`.
  - **fix(config): no build-time env baked into `dist`.** `resolveApexConfig` shared the config's `public` object by reference and mutated it, leaking build-time env into the server manifest. It now deep-clones, so the manifest carries pristine defaults and the deploy env is applied at start (build once, deploy anywhere).

- 19756a6: `apex upgrade` now updates the project + bundled VS Code extension install.

  - **`apex upgrade` bumps the framework** — it now updates every `@apex-stack/*` dependency in `package.json` to the CLI's version and runs your package manager (`--no-install` to skip), in addition to adding any missing scaffold files. So upgrading actually updates the installed runtime, not just files. Still non-destructive (never overwrites your code; `package.json` entries are only version-bumped).
  - **VS Code extension, bundled + one prompt.** The `.alpine` extension `.vsix` now ships inside `@apex-stack/core`. `apex new` and `apex upgrade` offer to install it — an interactive **“Install the Apex VS Code extension? (Y/n)”** prompt (when a `code` CLI is on PATH), or pass `--vscode` / `--no-vscode`. No more hunting for a `.vsix` path.

### Patch Changes

- ef8082a: Fix client hydration in `apex build` output and add subpath deploy support.

  - **Hydration fix**: `buildClient` matched the Vite manifest entry by exact virtual-id equality, but Vite normalizes the virtual src (prefixing `../../`), so no entry matched. The prerendered HTML then fell back to an inline `import Alpine from 'alpinejs'`, which the browser cannot resolve — pages shipped dead. Entries are now matched by suffix, so the HTML references the hashed, bundled client and hydrates.
  - **Store registration**: the built client bundle never registered global `stores/*`, so `$store.*` was `undefined` after hydration (the dev shell registered them but the build did not). The built entry now imports and registers each store before `Alpine.start()`, matching the server-rendered state.
  - **`apex build --base <path>`**: assets and the client href are now prefixed with a configurable base, enabling subpath deploys (e.g. `/demo/`).

- Updated dependencies [2f71124]
  - @apex-stack/kit@0.2.0
  - @apex-stack/vite@0.1.6
