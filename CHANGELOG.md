# Changelog

Apex JS is a **pnpm monorepo released with [Changesets](https://github.com/changesets/changesets)**,
so each package keeps its own authoritative, auto-generated changelog. There is no single
hand-maintained version line to fall out of date — look up the package you care about:

| Package | npm | Changelog |
|---|---|---|
| `@apex-stack/core` (the `apex` CLI + runtime) | [npm](https://www.npmjs.com/package/@apex-stack/core) | [packages/apexjs/CHANGELOG.md](./packages/apexjs/CHANGELOG.md) |
| `@apex-stack/kit` (the `.alpine` engine) | [npm](https://www.npmjs.com/package/@apex-stack/kit) | [packages/kit/CHANGELOG.md](./packages/kit/CHANGELOG.md) |
| `@apex-stack/vite` (the Vite plugin) | [npm](https://www.npmjs.com/package/@apex-stack/vite) | [packages/vite/CHANGELOG.md](./packages/vite/CHANGELOG.md) |
| `@apex-stack/data` (the data layer) | [npm](https://www.npmjs.com/package/@apex-stack/data) | [packages/data/CHANGELOG.md](./packages/data/CHANGELOG.md) |
| `create-apexjs` (the scaffolder) | [npm](https://www.npmjs.com/package/create-apexjs) | [packages/create-apexjs/CHANGELOG.md](./packages/create-apexjs/CHANGELOG.md) |

Tagged releases and rolled-up notes also live in
**[GitHub Releases](https://github.com/andrecorugda/apexjs/releases)**. How versions are cut
(changeset → version → publish → tag) is documented in
[BRANCHING_STRATEGY.md](./BRANCHING_STRATEGY.md#versioning--releases).

> **Why no unified list here?** Each package version-bumps independently — `@apex-stack/core`
> can ship a patch while `@apex-stack/kit` stays put — so a single top-level version would be
> meaningless. The per-package files are generated on every release and never drift.

---

## Pre-Changesets history (0.1.0 – 0.1.5, 2026-07-03)

Before the monorepo adopted Changesets, releases were tracked here as one line. Preserved for
the record; everything after `0.1.5` is in the per-package changelogs above.

### 0.1.5
- **fix(scoped CSS):** `<style scoped>` no longer scopes global selectors (`body`, `html`, `:root`).
  (`@apex-stack/kit` 0.1.2, `@apex-stack/vite` 0.1.2, core 0.1.5.)

### 0.1.4
- **Dev hot-reload for API routes** — `server/api/*.ts` routes/resources reload per request in dev.

### 0.1.3
- **Server target** — `apex build --server` + `apex start`: a production Node server (no Vite).
- **`@apex-stack/data` 0.1.2** — driver abstraction: `createDb({ driver, url })`.

### 0.1.2 / 0.1.1
- Libraries rescoped from unscoped `apexjs-*` to `@apex-stack/*`; the unscoped `0.1.0` packages
  were deprecated with a pointer to the scoped names.

### 0.1.0 — first public release
The `apex` CLI + runtime (`@apex-stack/core`), the `.alpine` engine (`@apex-stack/kit`), the Vite
plugin (`@apex-stack/vite`), the data layer (`@apex-stack/data`), and the scaffolder
(`create-apexjs`) — SSR + hydration with no flash, islands, file routing, component embedding, and
REST-**and**-MCP APIs from one definition.
