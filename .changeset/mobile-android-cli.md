---
"@apex-stack/core": minor
---

New `apex mobile android` command — package an app as an offline native Android app in one step.
It builds the mobile bundle (`apex build --mobile` if needed), scaffolds the native WebView shell
(the on-device Apex engine, fetch/cookie bridge, and DB persistence) into `mobile/android`, applies
`--app-id` / `--name`, and syncs the server bundle + client assets into the APK. Pass `--assemble`
to run `gradle assembleDebug`, or `--icon <file>` to generate launcher icons. The Android shell now
ships as a template with the package.
