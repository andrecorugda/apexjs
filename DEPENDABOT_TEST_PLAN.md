# Dependabot bump — Windows verification plan

**Branch to test:** `deps/dependabot-study` (already pushed).
**Goal:** confirm the combined Dependabot bump + security fixes work on **real Windows**, where the Linux run can't fully vouch (path handling, file watching, the esbuild vuln that was *Windows-specific*).

Linux is already green (see "Already verified" at the bottom). **Your job is the Windows-specific column.**

---

## What changed on this branch

| Package | From → To | PR | Why |
|---|---|---|---|
| `vite` | 6.4.3 → **7.3.6** | #12 | Major. Requires Node ≥ 20.19 / 22.12 (we pin ≥20.19 ✓) |
| `citty` | 0.1.6 → **0.2.2** | #11 | CLI arg parser; adds arg type-coercion + subcommand fixes |
| `@biomejs/biome` | 2.5.2 → **2.5.3** | #13 | New/expanded lint rules |
| `vitest` | 3.2.6 → **4.1.10** | #13 | Major test-runner bump |
| `@types/node` | 22 → **26.1.1** | #13 | Types only |
| `esbuild` (override) | 0.27.7 → **≥0.28.1** | security | **Windows** dev-server arbitrary-file-read (GHSA, low) |
| `drizzle-orm` (override) | dedupe stray 0.38.4 → **≥0.45.2** | security | 3× **HIGH** SQL-injection via unescaped identifiers |

Fixes we had to add to land it cleanly: widened `@apex-stack/vite` vite peer to include `^7`; bumped `biome.json` `$schema` to 2.5.3; 3 tiny lint fixes; removed a stray tracked `tmp-i18n/` scratch dir; `pnpm.overrides` for the two security bumps.

---

## Setup (PowerShell)

```powershell
node -v                      # must be >= 20.19 (ideally 20.19+ or 22.12+)
git fetch origin
git checkout deps/dependabot-study
corepack enable
pnpm install                 # expect NO peer-dependency errors
pnpm -r --filter "./packages/*" build
```

**Pass:** install clean (no `EBADPEER` for vite), all packages build.

---

## A. Automated gates

```powershell
pnpm test                    # vitest 4
pnpm lint                    # biome 2.5.3
pnpm -r --filter "./packages/*" typecheck
```

| Gate | Expected |
|---|---|
| `pnpm test` | **28 files, 200 tests, all pass** |
| `pnpm lint` | 0 errors (23 warnings for unused `noConsole` suppressions are **known/expected**, non-blocking) |
| `typecheck` | **One** pre-existing error only: `src/mcp/server.ts:53 … not assignable to 'never'`. This is an MCP-SDK `registerTool` cast quirk present on `develop` too — **NOT caused by the bump**. Any *other* error is a real regression. |

---

## B. Windows-specific functional scenarios (the important part)

### B1. esbuild security fix actually resolved
```powershell
pnpm why esbuild -r | Select-String "esbuild "
```
**Pass:** every resolved `esbuild` is **≥ 0.28.1** (the vuln was Windows-only, so this matters most here).

### B2. Dev server + SSR + Windows path handling
Vite 7's module loading uses absolute paths; Windows drive letters / backslashes are the classic break point.
```powershell
cd playground\demo
pnpm exec apex dev --port 3199
```
Then in a browser / second terminal:
```powershell
curl.exe http://localhost:3199/
```
**Pass:** HTML contains real server-rendered content (an `<h1>`, a `<title>`, `x-data`, and a `data-apex-state` island) — not an empty shell or a 500. Navigate a couple of routes (`/`, a blog/detail page) in the browser; they render and hydrate (buttons/counters work, no hydration flash).

### B3. HMR / file watching on Windows
With `apex dev` still running, edit a visible string in `playground\demo\pages\index.alpine` and save.
**Pass:** the browser updates without a manual refresh (Windows file-watching + vite 7 HMR).

### B4. Prod build + start
```powershell
cd playground\demo
pnpm build          # apex build --server
pnpm start          # apex start
curl.exe http://localhost:3000/
```
**Pass:** build writes `dist/`; `apex start` serves the same SSR HTML.

### B5. CLI (citty 0.2.2) on a Windows shell
citty 0.2.2 changed arg type-coercion + subcommand resolution. Verify the scaffolders write files with correct Windows path separators.
```powershell
pnpm --filter @apex-stack/core build   # ensure the apex bin is fresh
# in a throwaway dir:
npx --yes create-apexjs@file:<repo>\packages\create-apexjs my-win-test   # or: apex new my-win-test
cd my-win-test
apex --help
apex --version
apex make model Post --fields "title:string,done:boolean"   # positional + --fields
apex add button --force                                     # positional + boolean flag
apex migrate --help                                         # boolean --rollback, string --steps
```
**Pass:** `--help`/`--version` work; scaffolders create files at correct nested Windows paths; boolean flags (`--force`, `--all`) and positionals parse correctly; no "unknown command"/arg-eaten regressions.

### B6. Data layer (drizzle-orm 0.45.2) — migrate + CRUD
```powershell
# in the scaffolded app or playground\data:
apex migrate                 # applies migrations against sqlite/libsql
```
Exercise a model's REST route (create + list) and confirm rows round-trip.
**Pass:** migration runs on Windows (sqlite/libsql native bits load); create/read works; no SQL errors. (This exercises the patched ORM.)

### B7. Playwright e2e (if browsers installable on Windows)
```powershell
pnpm --filter spike exec playwright install chromium
pnpm test:e2e
```
**Pass:** the SSR/no-flash/hydration e2e passes. If Playwright browsers can't install in your Windows env, **note it as skipped** — B2/B3 cover the same paths manually.

---

## C. Known non-issues (do NOT report these as failures)
- `mcp/server.ts:53` typecheck error — pre-existing, unrelated to the bump.
- 23 biome warnings about unused `// biome-ignore … noConsole` suppressions — cosmetic; the `noConsole` rule simply isn't firing on those lines under 2.5.3.
- A dev-server console warning `The above dynamic import cannot be analyzed by Vite … packages/data/dist/index.js` — pre-existing (the DB-driver `import(spec)` with a variable specifier); the page still renders 200. Benign in vite 6 and 7.

## D. Report back
For each of A + B1–B7: ✅ pass / ⚠️ pass-with-note / ❌ fail (paste output). Anything ❌ outside section C is a real regression to fix before merging.

---

## Already verified on Linux (Node 20.20, this branch)
build ✓ · 200/200 tests (vitest 4) ✓ · lint ✓ · typecheck (only the pre-existing mcp error) ✓ · `apex build` ✓ · `apex dev` SSR served 6.9 KB of real hydrated HTML ✓ · esbuild resolved to 0.28.1 ✓ · drizzle-orm deduped to 0.45.2 ✓.
