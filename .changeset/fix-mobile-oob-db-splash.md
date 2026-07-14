---
"@apex-stack/core": patch
"create-apexjs": patch
---

Close the last two "mobile out of the box" gaps a fresh app hit:

- **On-device SQLite wasn't installed.** The data feature now adds `sql.js` — so `apex build
  --mobile` bundles the on-device database and the guestbook works offline without a manual
  `npm i sql.js`.
- **`/splash` 404'd on launch.** `apex mobile android` / `ios` now scaffold a branded default
  `pages/splash.alpine` when the app has none (delete it to opt out), so the shell's splash route
  exists.

Also: `apex mobile android` / `ios` now **rebuild the bundle by default** so it's never stale after
an app change (pass `--no-build` to reuse the existing `dist/mobile`).
