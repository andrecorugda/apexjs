# @apex-stack/core

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
