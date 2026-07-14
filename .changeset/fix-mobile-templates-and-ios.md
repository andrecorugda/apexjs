---
"@apex-stack/core": patch
---

Fix `apex mobile android` in the published package: the `templates/mobile` shell (accidentally
dropped from the `0.38.0` release) is restored, so the command has a native project to scaffold
again. Also adds **`apex mobile ios`** — scaffolds the WKWebView + JavaScriptCore iOS shell into
`mobile/ios`, applies `--app-id`/`--name`, and syncs the bundle assets; generate the Xcode project
with `xcodegen` and build on a Mac.
