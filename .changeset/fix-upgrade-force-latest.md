---
"@apex-stack/core": patch
---

Fix `apex upgrade` not actually updating `@apex-stack/*` on existing apps. It ran a plain
`<pm> install`, which with a lockfile keeps `latest`/range specs pinned to the locked version
(npm prints "up to date" and nothing moves) — so an existing app never received newer patches
(e.g. the morph HMR dev-server fix in kit 0.10.1). `apex upgrade` now force-reinstalls every
`@apex-stack/*` dependency at `@latest` (`npm install pkg@latest` / `pnpm|yarn|bun add pkg@latest`,
preserving devDependencies), which re-resolves and bumps the lockfile. Local `file:`/`link:`/
`workspace:` specs are still left untouched.
