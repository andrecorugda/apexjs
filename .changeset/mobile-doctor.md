---
'@apex-stack/core': minor
'create-apexjs': patch
---

feat(mobile): `apex mobile doctor` — check the native toolchain and help set it up

A new command that diagnoses the Android/iOS build toolchain and walks you through fixing it —
so a missing JDK/SDK/Gradle (or Xcode) is a clear, actionable checklist instead of a build error.

- Prints a ✓/✗ board for Android (JDK, Android SDK + platform-tools / build-tools / platform,
  Gradle) and, on a Mac, iOS (Xcode, XcodeGen). For each gap: the official download link **and**
  the exact copy-paste setup commands for the current OS.
- `--fix` runs the *safe* automatable steps with consent — accept SDK licenses, `sdkmanager`
  package installs, write `local.properties`, `brew install xcodegen`. It never downloads a JDK or
  Xcode (those need user action) — those get a link + one command.
- Required versions are **derived from the project's Gradle files** (`JavaVersion.VERSION_NN` →
  JDK floor, `compileSdk`, build-tools) — nothing hardcoded, so bumping the template moves the check.
- `apex mobile android --assemble` / `apex mobile ios --generate` now point at `apex mobile doctor`
  when a tool is missing.

Cross-platform: version probes and `sdkmanager.bat`/`gradlew.bat` are handled via `cmd.exe` on
Windows. The scaffold AGENTS.md documents the command for app agents.
