---
'@apex-stack/core': patch
---

fix(mobile): clean, cross-platform handling when the native toolchain is absent

`apex mobile android --assemble` and `apex mobile ios --generate` no longer crash
with a raw `spawnSync … ENOENT` stack trace when `gradle` / `xcodegen` isn't
installed. They now print an actionable message ("install Android Studio", "brew
install xcodegen") and exit `1` — everything up to the final native compile
(shell scaffold + bundle sync) already succeeded, so the user just needs the SDK.

Also resolves the tool cross-platform via a new `resolveBin` helper that honors
Windows `PATHEXT`, so a `gradle.bat` / `xcodegen.cmd` shim on `PATH` is actually
found (bare `execFileSync('gradle')` never resolved these on Windows). The Android
assemble step now prefers the project's Gradle wrapper (`gradlew`) when present.

Guarded by a new fresh-scaffold build-targets harness (`scripts/e2e-targets.sh`)
that asserts all targets on a tarball-installed app: normal build, `--islands`,
PWA assets (manifest + sw + generated icons), `--mobile` bundle, android/ios
scaffold + sync, and clean failure of both native-compile steps when the
toolchain is missing.
