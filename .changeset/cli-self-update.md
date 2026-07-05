---
'@apex-stack/core': patch
---

`apex upgrade` now self-updates the global CLI.

The `.alpine` extension and scaffold templates are bundled inside a given
`@apex-stack/core` build, so `apex upgrade` could only ever apply the version it
was itself running — a stale global CLI silently upgraded projects to old assets.
`apex upgrade` now checks npm for a newer core; if the global binary is behind it
offers to run `npm i -g @apex-stack/core@latest` and re-execs on the new engine
(one command instead of two). Skips cleanly when offline, non-interactive, or run
from a project-local install (those update via the normal dependency bump).
Control with `--self` / `--no-self`.
