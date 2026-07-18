---
'@apex-stack/core': patch
'create-apexjs': patch
---

feat(mobile): make `apex mobile android --assemble` build the APK with a standalone Gradle

`--assemble` no longer requires Gradle on `PATH` (or Android Studio). It resolves a
Gradle in precedence order — `--gradle <path>` → project `gradlew` → `$APEX_GRADLE`
→ PATH `gradle` — so a standalone `gradle-8.9/bin/gradle.bat` not on `PATH` works
directly. New flags:

- `--gradle <path>` — point at any Gradle binary (Windows `.bat`/`.cmd` shims resolve).
- `--sdk <dir>` — Android SDK location; auto-writes `mobile/android/local.properties`
  (`sdk.dir`, backslash-escaped for Windows) so you don't export `$ANDROID_HOME` each
  run. Falls back to `$ANDROID_HOME` / `$ANDROID_SDK_ROOT`.
- `--wrapper` — generate the Gradle wrapper (`gradlew`) once, so later builds are
  self-contained (JDK-only, no system Gradle).

The assemble now runs `assembleDebug --no-daemon`. When no Gradle resolves it still
prints a clean, actionable hint and exits 1 (no raw `spawnSync` crash).

The scaffold's `.gitignore` now excludes machine-specific mobile build artifacts
(`local.properties`, `mobile/**/build/`, `*.apk`/`*.aab`/`*.ipa`).

iOS is unchanged: `xcodebuild`/`xcodegen`/`codesign` are macOS-only, so an IPA needs a
Mac or a macOS CI runner — there is no Windows/Linux local build path.
