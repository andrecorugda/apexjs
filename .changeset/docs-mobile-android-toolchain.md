---
'create-apexjs': patch
---

docs(scaffold): the app AGENTS.md now covers native packaging (`apex mobile android --assemble`)

The starter template's AGENTS.md gained a "Ship it as a native app" note so an app's AI agent
knows how to package the app as an offline APK — including the `--gradle`/`--sdk`/`--wrapper`
flags for building without Android Studio, and the iOS (Mac-only) caveat. Framework docs
(README, docs site mobile/CLI pages, architecture core.md) were updated to match, and a
repo-level AGENTS.md was added for contributors working on Apex itself.
