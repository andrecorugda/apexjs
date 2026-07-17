# Upgrading Apex JS

How to move between versions safely, and what the version numbers promise. The full,
per-export stability list is in [`API.md`](./API.md); this is the narrative guide.

## The promise in one line

Everything marked **🟢 Stable** in [`API.md`](./API.md) is a contract — it won't break without a
deprecation notice first (and, pre-1.0, at least two minor releases of overlap). Everything marked
**🟡 Experimental** works but may still change shape in a minor; the changeset will say so. A
CI-enforced contract test (`api-contract.test.ts` in `@apex-stack/core` and `@apex-stack/data`)
fails the build if a 🟢 export disappears or changes kind — so the promise is checked, not just
written down.

**The 🟢 Stable core** (the surface you build load-bearing code on today): `defineModel` /
`.resource()`, `defineApexRoute`, `defineConfig` / `useRuntimeConfig`, `defineMiddleware`,
`sessionAuth` / `login` / `logout` / `getSession`, `createDb` / `applyMigrations`, the behaviors
(`timestamps` / `owned` / `softDeletes`), `createTestApp`, the `.alpine` SFC contract, and the CLI
command names + documented flags.

**🟡 Experimental (new in 0.11 / 1.1)** — powerful but not yet frozen: the active-record ORM query
surface (`Model.where(...)`, relations + `.with()`, transactions, instances/collections, casts,
typed errors), and the platform pillars (cache, queue, mail, notifications, real-time, authz). Use
them — just pin your version and read the changeset before bumping.

## How to upgrade (any version → newer)

```bash
# 1. Bump. Same-minor and patch bumps are always safe for 🟢 APIs.
npm i @apex-stack/core@latest @apex-stack/data@latest    # or your package manager

# 2. Read the changesets/CHANGELOG for the versions you crossed — anything touching a 🟡
#    API you use is called out explicitly there.

# 3. Run the framework's own gates. `apex check` is .alpine-aware and catches most drift.
apex check
npm test
```

If `apex check` and your tests pass, you're done. If a 🟡 API you use changed, its CHANGELOG entry
tells you the new shape.

## Notable shifts (pre-1.0 history)

Earlier pre-1.0 minors did move some surfaces before they settled — if you're jumping across a wide
range, these are the ones worth knowing (all now 🟢 Stable and frozen):

- **Route handler context** settled to `{ input, url, config, locals, user, event }`.
- **Model definition** consolidated to `defineModel(...).resource(handle)` (the earlier hand-wired
  `defineResource({ db, table, insert })` is still exported but `defineModel` is the source of truth).
- **`apex extend <feature>`** is the scaffolding entry (`data` / `auth` / `i18n` / `pwa`).
- The per-dialect migration SQL now **quotes identifiers**, so camelCase columns work on Postgres.

For exact, per-version detail, see each package's `CHANGELOG.md`.

## Versioning

Apex uses [Changesets](https://github.com/changesets/changesets) + semver. Pre-1.0, breaking changes
to a 🟢 API follow the deprecation policy in [`API.md`](./API.md) (deprecate → overlap → remove);
🟡 APIs may change in a minor. Post-1.0, semver is strict: no breaking change to a 🟢 API outside a
major. See [`API.md`](./API.md) for the deprecation policy and the full stable/experimental list.
