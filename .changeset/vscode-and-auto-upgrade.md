---
"@apex-stack/core": minor
---

`apex upgrade` now updates the project + bundled VS Code extension install.

- **`apex upgrade` bumps the framework** — it now updates every `@apex-stack/*` dependency in `package.json` to the CLI's version and runs your package manager (`--no-install` to skip), in addition to adding any missing scaffold files. So upgrading actually updates the installed runtime, not just files. Still non-destructive (never overwrites your code; `package.json` entries are only version-bumped).
- **VS Code extension, bundled + one prompt.** The `.alpine` extension `.vsix` now ships inside `@apex-stack/core`. `apex new` and `apex upgrade` offer to install it — an interactive **“Install the Apex VS Code extension? (Y/n)”** prompt (when a `code` CLI is on PATH), or pass `--vscode` / `--no-vscode`. No more hunting for a `.vsix` path.
