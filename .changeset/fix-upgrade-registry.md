---
'@apex-stack/core': patch
---

Fix `apex upgrade` not actually upgrading.

Two bugs: (1) it bumped `@apex-stack/*` deps to the CLI's own `VERSION` rather than
the npm registry latest — so a project-local upgrade was capped at the running
version and never consulted the registry; (2) it skipped `latest`/tag/range specs
(the scaffold ships `"@apex-stack/core": "latest"`) and only reinstalled when it had
rewritten a pinned spec, leaving `node_modules` stale.

Now it queries the registry per package and rewrites pinned specs to `^<latest>`,
and reinstalls whenever the project has any `@apex-stack/*` dep — so `latest`/range
specs re-resolve to the newest published too. (The global-CLI self-update from 0.7.8
still handles the binary itself; a CLI older than 0.7.8 still needs a one-time
`npm i -g @apex-stack/core@latest`.)
