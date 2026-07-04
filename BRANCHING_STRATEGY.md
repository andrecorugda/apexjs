# Branching Strategy

How we branch, review, and release **Apex JS** (`andrecorugda/apexjs`) — a pnpm/TypeScript
monorepo publishing several packages to npm (`@apex-stack/core`, `@apex-stack/kit`,
`@apex-stack/vite`, `@apex-stack/data`, and the unscoped `create-apexjs`). Now that more than
one person contributes, this is the shared contract.

**TL;DR** — branch off `develop`, open a PR back into `develop`, keep CI green, get one
review. Releases flow `develop → main → tag`. Never push straight to `main` or `develop`.

---

## Long-lived branches

| Branch | Role | Direct commits? | Releases tagged here? |
|---|---|---|---|
| **`develop`** | Integration branch for the **next** release. The **default** branch — all feature/fix branches target it. Must always be green. | No — PRs only | No |
| **`main`** | The **stable** branch. Every commit is release-quality; this is what the latest npm versions are published from. | No — PRs/back-merges only | **Yes** (`vX.Y.Z`) |
| **`N.x`** (e.g. `1.x`) | A **maintenance line** for an older major, created only once a newer major lands. Receives backported fixes + patch releases for that line. | No — PRs/back-merges only | Yes (for that line) |

> `develop` is the default branch; `main` holds the stable, published releases. Both should be
> protected (PR + 1 review + green CI; no direct pushes / force-pushes) — see **Repository
> protection** below.

## Short-lived branches

Cut from `develop` (except `hotfix/*`, which is cut from `main`), and **deleted after merge**.

| Prefix | For | Branch from | PR into |
|---|---|---|---|
| `feature/` | a new capability | `develop` | `develop` |
| `fix/` | a non-urgent bug fix | `develop` | `develop` |
| `docs/` | documentation only | `develop` | `develop` |
| `refactor/` `test/` `chore/` `perf/` `ci/` | internal changes | `develop` | `develop` |
| `hotfix/` | an **urgent** fix to a shipped release | `main` | `main` (then back-merged to `develop`) |

**Naming:** lowercase kebab-case, optionally prefixed with the issue id.
`feature/client-nav`, `fix/142-windows-path`, `docs/composables`.

---

## Everyday workflow (contributors)

```bash
# 1. Start from an up-to-date develop
git switch develop
git pull --ff-only

# 2. Branch
git switch -c feature/server-actions

# 3. Install + commit in small, conventional steps (see "Commit messages")
pnpm install
git commit -m "feat(api): typed server actions over defineApexRoute"

# 4. Push and open a PR targeting `develop`
git push -u origin feature/server-actions
```

5. CI must go green and **one maintainer** must approve.
6. **Squash-merge** into `develop`. Delete the branch.
7. Add a **changeset** for any user-facing change (see *Versioning & releases*).

Keep your branch current by rebasing on `develop` (preferred over merge commits):
`git fetch origin && git rebase origin/develop`.

---

## Pull requests

- **Target `develop`** (only `hotfix/*` targets `main`).
- **One logical change per PR.** Smaller PRs review faster and revert cleanly.
- **Description:** what changed and *why*; link the issue (`Closes #123`); include a demo /
  before-after for anything user-visible.
- **All quality gates pass** (see below) — PRs that are red don't get reviewed.
- **One approving review** from a maintainer; authors don't merge their own PR without it.
  Resolve all review threads before merging.
- **Add a changeset** (`pnpm changeset`) whenever a published package's behaviour changes.

## Commit messages — [Conventional Commits](https://www.conventionalcommits.org)

```
type(scope): imperative summary, <=72 chars

Optional body explaining the WHY (not the what — the diff shows that).
Footer: Closes #123 / BREAKING CHANGE: ...
```

**Types:** `feat` `fix` `docs` `refactor` `test` `chore` `perf` `security` `build` `ci`.
**Scopes** in use: `core`, `kit`, `vite`, `data`, `cli`, `dev`, `routing`, `store`, `head`,
`layouts`, `components`, `site`, `editor` (the subsystem you touched). Examples from history:

```
feat(store): SSR-safe defineStore shared across components + islands
fix(cli): lazy-load dev/build so `apex new` never loads Vite + rollup
feat(routing): catch-all routes [...name]
docs: gap analysis vs Next/Nuxt + roadmap
```

A `feat` implies a minor release; a `fix` a patch; a `BREAKING CHANGE:` footer (or `!`, e.g.
`feat(core)!:`) implies a major. Match the changeset bump to this.

---

## Quality gates (must pass before merge)

Run the full set locally before pushing — all are enforced in CI:

| Gate | Command | Notes |
|---|---|---|
| **Lint / format** | `pnpm lint` | Biome. Auto-fix with `pnpm format`. |
| **Types** | `pnpm typecheck` | `tsc --noEmit` across every package (strict). |
| **Build** | `pnpm build` | tsup build of all packages must succeed. |
| **Tests** | `pnpm test` | Vitest unit suite (run on Node 20 & 22 in CI). |

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm build && pnpm test
```

Requires **Node ≥ 20.19** and **pnpm 9** (via `corepack enable`). E2E playground tests:
`pnpm test:e2e`.

---

## Versioning & releases (maintainers)

Apex follows [SemVer](https://semver.org) per package, managed with
[Changesets](https://github.com/changesets/changesets).

| Bump | When |
|---|---|
| **PATCH** (`x.y.Z`) | Backwards-compatible bug fixes only. |
| **MINOR** (`x.Y.0`) | Backwards-compatible new features. |
| **MAJOR** (`X.0.0`) | Breaking changes: public API, `.alpine` contract, CLI flags, or raising the minimum Node version. |

### Adding a changeset (every contributor, per user-facing change)

```bash
pnpm changeset          # pick the affected packages + bump level, write a summary
git add .changeset && git commit -m "chore: changeset for server actions"
```

### Cutting a release (maintainers)

```bash
# 1. develop is green and has pending changesets.
# 2. Apply version bumps + regenerate CHANGELOGs:
pnpm changeset version
git commit -am "chore(release): version packages"
# 3. Open a release PR: develop -> main. Review, merge.
# 4. Publish from main:
git switch main && git pull --ff-only
pnpm release            # = changeset publish (resolves workspace:* → real versions)
# 5. Push the tags changesets created, and cut GitHub Releases from the CHANGELOGs.
git push --follow-tags
# 6. Back-merge main -> develop so the version/CHANGELOG commits return to develop.
git switch develop && git merge --no-ff main && git push
```

> ⚠️ **Never `npm publish` a workspace package by hand** — plain npm does **not** resolve
> pnpm's `workspace:*` specifiers, so the tarball ships uninstallable deps
> (`EUNSUPPORTEDPROTOCOL`). Always publish via **`pnpm release`** (changesets) or
> `pnpm -r publish` — both rewrite `workspace:*` to the real version.

### Hotfixes (urgent fix to a shipped release)

```bash
git switch main && git pull --ff-only
git switch -c hotfix/broken-thing
# fix + test + changeset, PR into main, merge, then publish + tag as above.
# Back-merge into develop (and any active N.x lines) so the fix isn't lost:
git switch develop && git merge --no-ff main && git push
```

### Maintenance lines (`N.x`)

When work on the next **major** begins on `develop`/`main`, cut a line from the last release
of the old major to keep shipping patches for it:

```bash
git switch -c 1.x v1.4.0 && git push -u origin 1.x
```

---

## Repository protection (recommended)

Protect `main`, `develop`, and `[0-9]*.x` lines with a GitHub ruleset:

- **Pull request required** — 1 approval, stale approvals dismissed on new pushes, all review
  threads resolved before merge, squash-merge only.
- **Required status checks** — the `tests` CI jobs (Node 20 & 22) must pass and the branch be
  up to date before merging.
- **Linear history**; **no force-pushes**; **no branch deletion**.
- Admins keep a bypass for release tagging + hotfix back-merges.

Repo-level security: secret scanning + push protection, Dependabot alerts, and private
vulnerability reporting.

---

*Questions about the workflow? Open a `docs/` PR against this file — the strategy is allowed
to evolve, in the open, like everything else here.*
