---
"@apex-stack/core": patch
"create-apexjs": patch
---

Fix three blockers that stopped a freshly-scaffolded app from going mobile:

- **Scaffold DB used top-level await.** `apex new` (data feature) shipped a `db/index.ts` with
  `await createDb(…)`, which fails `apex build --mobile` (`Top-level await … not supported with the
  "iife" output format`). It now uses `lazyDb()` — no top-level await — matching the showcase.
- **Unused DB drivers were bundled for mobile.** `apex build --mobile` followed `createDb`'s
  `drizzle-orm/pglite` / `postgres-js` / `libsql` imports and tried to bundle them, failing with
  `Could not resolve "@electric-sql/pglite"` on a libsql/sqlite app that never installed it. Those
  drivers are now externalized in the mobile bundle (the on-device path uses sql.js); the bundle is
  also smaller.
- **A custom `--appId` produced a non-launching APK.** `apex mobile android --appId <id>` set the
  gradle `namespace` to the custom id while the Kotlin sources stay `site.apexjs.shell`, so
  `.MainActivity` resolved to `<id>.MainActivity` → `ClassNotFoundException` at launch. Now only
  `applicationId` (the install identity) changes; `namespace` stays matched to the sources. The
  `--appId` flag also accepts `--app-id`.
