---
"create-apexjs": patch
---

Install feature dependencies during scaffolding. Features (`--data`, `--auth`, …) merge new
dependencies into `package.json` after the initial install — the scaffolder now runs the package
manager again so a fresh `--data` app starts without a manual `npm install`
(previously: `ERR_MODULE_NOT_FOUND: @apex-stack/data` on first run).
