---
'@apex-stack/core': patch
---

Dev error page fixes: the project file tree no longer disappears when toggling
Frames/Raw (the tabs wrongly hid it), the tree is fully expanded by default, and
the error's origin file is marked red even for compile/transform errors (e.g. a
malformed `.alpine`) — the offending file is taken from Vite's error `loc`/`id`
and surfaced as a top "compile error" frame with code context.
