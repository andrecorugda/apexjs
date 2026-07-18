---
'@apex-stack/core': patch
---

fix(mobile): run gradle.bat / gradlew.bat on Windows (Node EINVAL on batch files)

`apex mobile android --assemble` failed on Windows with `spawnSync … EINVAL` when the
resolved Gradle was a `.bat`/`.cmd` (a standalone `gradle.bat` or a `gradlew.bat`
wrapper). Node refuses to `execFileSync` a batch file directly since the
CVE-2024-27980 fix. Batch files are now routed through `cmd.exe /d /s /c` with
verbatim, correctly-quoted arguments (paths with spaces included). Real binaries and
the POSIX `gradlew` shell script are unaffected on macOS/Linux.

Also: an explicit `--gradle <path>` that doesn't exist now reports "path does not
exist" instead of the generic "Gradle not found" (it's a typo, not a missing toolchain).
