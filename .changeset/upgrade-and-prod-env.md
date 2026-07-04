---
"@apex-stack/core": minor
---

`apex upgrade` + deploy-time env fixes (surfaced by fresh-install testing).

- **`apex upgrade`** — adopt new scaffold defaults in an existing app, non-destructively: adds any template files the project is missing (e.g. a newly-introduced `apex.config.ts`), never overwrites existing files, and always preserves `package.json`. `--force` re-syncs changed files (still preserving `package.json`). Idempotent. The upgrade path stays non-breaking; only a deliberate overhaul (`--force`) can overwrite.
- **fix(config): deploy-time env now works in prod.** The prod server loaded `.env` from the build dir instead of the working directory, so deploy-time overrides were ignored. It now reads `.env` (and always-respected real `process.env`) from `process.cwd()`.
- **fix(config): no build-time env baked into `dist`.** `resolveApexConfig` shared the config's `public` object by reference and mutated it, leaking build-time env into the server manifest. It now deep-clones, so the manifest carries pristine defaults and the deploy env is applied at start (build once, deploy anywhere).
