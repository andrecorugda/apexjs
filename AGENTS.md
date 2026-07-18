# AGENTS.md — working on Apex JS itself

Orientation for AI agents and contributors working **on the Apex framework** (this monorepo).
Building an *app* with Apex? That guide ships in every scaffold at
`packages/create-apexjs/templates/default/AGENTS.md` — this file is about the framework's own
source, tests, and release flow.

Apex JS is a full-stack meta-framework for Alpine.js ("what Nuxt is to Vue"): `.alpine`
single-file components server-rendered to hydration-safe HTML, file routing, one `defineModel`
fanning out to table + REST + MCP + client, and one bundle that runs the whole SSR + API
pipeline in the browser, on a server, on serverless, or **on-device** (mobile).

## Repo layout (pnpm workspace)

| Path | Package | Owns |
|---|---|---|
| `packages/apexjs` | `@apex-stack/core` + the `apex` CLI | Runtime + CLI: routing, the API/MCP/SSR pipeline, dev & prod servers, islands, config, auth, security, the build, mobile packaging. Entry: `src/index.ts`, `src/cli.ts`. |
| `packages/kit` | `@apex-stack/kit` (*internal*) | The `.alpine` engine: parser (`src/parse`), SSR renderer + directive walker (`src/render`), scoped CSS (`src/style`), browser runtime (`src/client`). |
| `packages/vite` | `@apex-stack/vite` (*internal*) | The Vite plugin compiling `.alpine` → SSR/client modules; fine-grained HMR. |
| `packages/data` | `@apex-stack/data` | `defineModel`/`defineResource`/`createDb`/migrations; the shared `repository.ts` write pipeline; drivers (libSQL/Turso, Postgres, PGlite) + on-device sql.js. |
| `packages/create-apexjs` | `npm create apexjs` | The starter template (`templates/default`) + `apex new` generators. |

Also: `packages/theme` + `packages/components` (UI copied in via `apex add`), `examples/`,
`e2e/`, `mobile-poc/`, `docs/` (the published site — `apexjs.site`). Deep architecture: **[`docs/architecture/`](./docs/architecture/)**
(start with `core.md` — the request pipeline is the spine).

## Commands

```bash
pnpm install            # bootstrap the workspace
pnpm build              # build every package (tsup). Also runs copy-templates.
pnpm test               # vitest, whole workspace (unit + integration)
pnpm lint               # biome check .   (CI gate — must be clean)
pnpm format             # biome format --write
pnpm typecheck          # tsc --noEmit across packages
pnpm test:e2e           # Playwright: boots examples/showcase with the built CLI
bash scripts/e2e-targets.sh   # fresh-scaffold guard for ALL build targets (see below)
```

Run a single package's build/test by filtering: `pnpm --filter @apex-stack/core build`,
`pnpm vitest run <pattern>`.

## Conventions

- **TypeScript strict, ESM-only, everywhere.** No CommonJS, no `.js`-less relative imports
  (emit `./foo.js` specifiers — this is an ESM package graph).
- **Biome** is the formatter + linter (`biome.json`). `pnpm lint` must be clean before commit;
  imports are auto-sorted.
- **`kit` and `vite` are internal** — no Apex app logic leaks in. `kit` is pure SFC
  compile + render; `vite` is pure transform + HMR.
- **One pipeline, many surfaces.** REST, MCP, and `Model.*` writes share
  `packages/data/src/repository.ts`; pages/REST/MCP share the auth decision in
  `packages/apexjs/src/auth/check.ts`. Never fork a surface.
- **Server code never reaches the client.** `<script server>` is textually excluded by the
  compiler; only the loader *result* is serialized (devalue, XSS-safe).
- **Generated files.** `packages/apexjs/templates/` is regenerated from
  `packages/create-apexjs/templates/` by `scripts/copy-templates.mjs` on every build — edit the
  **create-apexjs** copy, never the apexjs one.

## Branching & releases

Full rules: **[`BRANCHING_STRATEGY.md`](./BRANCHING_STRATEGY.md)**. In short:

- Branch off **`develop`** (the default/integration branch); PR back into `develop`; keep CI green.
- **`main`** holds the stable, published releases and is tagged `vX.Y.Z`.
- Add a **changeset** (`.changeset/*.md`) for any user-facing change — `patch`/`minor`/`major`
  per affected package.
- Release: `changeset version` → `pnpm build` → `changeset publish` (pins `workspace:*` to exact
  versions) → sync `main` to `develop`. `changeset publish` tags npm `latest`.

### Environment-specific fixes → ship to `beta` first

A fix for a bug that only reproduces on a platform the dev/CI environment can't exercise
(Windows batch spawning, a specific npm/OS/browser quirk) **must not** go straight to `latest`.
Publish a prerelease to the **`beta`** dist-tag, have it verified on the real platform, *then*
promote the same version to `latest`. Example: the Windows `gradle.bat` `EINVAL` fix shipped as
`core@0.45.3-beta.0` (beta), was confirmed to build a real APK on Windows, and only then was
`0.45.3` promoted to `latest`. `latest` stays safe for users throughout.

## Testing philosophy

- **Unit + integration in vitest** live next to source (`*.test.ts`).
- **`e2e/`** boots `examples/showcase` (which exercises every feature) with the freshly built
  CLI and drives it in a real browser — the dev-mode guard.
- **`scripts/e2e-targets.sh`** is the **build-targets** guard: it packs every package to a
  tarball, scaffolds a fresh app that installs only those tarballs, and asserts every target —
  `apex build`, `--islands`, PWA assets, `--mobile`, android/ios scaffold + sync, and *clean
  failure* when a native toolchain is absent. Run it before claiming any build target works;
  the `e2e/` Playwright suite covers dev mode only, not builds.
- Prefer verifying a change by exercising the real surface, not only asserting in a test.
  Env-specific paths that can't run here get the beta→verify→promote treatment above.

## Mobile packaging (a common source of platform-specific gaps)

`apex mobile android` scaffolds the WebView shell + syncs the on-device bundle; `--assemble`
drives Gradle to a real APK. The toolchain is *resolved, not assumed*
(`src/mobile/androidToolchain.ts`): Gradle from `--gradle` → project `gradlew` → `$APEX_GRADLE`
→ `PATH`; SDK via `--sdk`/`$ANDROID_HOME` written into `local.properties`. Cross-platform
spawning is in `src/util/externalTool.ts` — `resolveBin()` honors Windows `PATHEXT`, and
`execTool()` routes `.bat`/`.cmd` through `cmd.exe` (Node throws `EINVAL` on a direct batch
spawn). Building an APK needs a JDK 17+, the Android SDK, and Gradle — **not** Android Studio.
iOS caps at scaffold + `xcodegen`; `xcodebuild`/`codesign` are macOS-only. `apex mobile doctor`
(`src/mobile/doctor.ts`) checks the whole toolchain and (with `--fix`) runs the safe installs;
required versions (JDK floor, `compileSdk`, build-tools) are **derived from the Gradle files**
via `src/mobile/requirements.ts` — never hardcoded, so bumping the template moves the check.
