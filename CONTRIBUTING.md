# Contributing to Apex JS

Thanks for helping build Apex JS! A few essentials to get you productive fast.

## Prerequisites

- **Node ≥ 20.19** and **pnpm 9** (`corepack enable`).
- Clone, then `pnpm install` at the repo root (pnpm workspace — all packages install together).

## Workflow & branches

We use a gitflow-lite model — branch off `develop`, PR back into `develop`, releases flow
`develop → main → tag`. The full rules (branch names, PRs, releases, hotfixes, versioning)
live in **[BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md)** — read it before your first PR.

## Before you open a PR

Run the quality gates locally (all enforced in CI):

```bash
pnpm lint         # Biome — auto-fix with `pnpm format`
pnpm typecheck    # tsc --noEmit across every package (strict)
pnpm build        # tsup build of all packages
pnpm test         # Vitest unit suite
```

One-liner: `pnpm lint && pnpm typecheck && pnpm build && pnpm test`.

- Keep PRs small and focused; one logical change each.
- Use [Conventional Commits](https://www.conventionalcommits.org) (`feat(store): …`, `fix(cli): …`).
- Add tests for new behaviour and bug fixes — prefer **server-less unit tests** (see
  `packages/apexjs/src/dev/renderPage.test.ts`) over live-server tests where possible.
- Add a **changeset** (`pnpm changeset`) for any change to a published package.

## Repo layout

```
packages/
  apexjs/         → @apex-stack/core   (CLI + dev server + render seam)
  kit/            → @apex-stack/kit     (.alpine parser, SSR renderer, client runtime)
  vite/           → @apex-stack/vite    (Vite plugin)
  data/           → @apex-stack/data    (Drizzle resources)
  create-apexjs/  → create-apexjs       (scaffolder)
editors/vscode-apex → .alpine VS Code extension
playground/       → example apps + e2e
docs/             → the apexjs.site docs site
```

## Reporting bugs / proposing features

Open an issue with steps to reproduce (bugs) or the use case and proposed API (features).
For anything security-sensitive, please **do not** open a public issue — use GitHub's private
vulnerability reporting (Security tab) or contact the maintainer directly first.
