---
'@apex-stack/core': patch
---

Clear "not an Apex app" page when `apex dev` runs outside a project.

Running `apex dev` in a folder with no `pages/` (e.g. a parent folder containing
several apps) previously showed a cryptic Vite error ("Failed to load url
…/pages/index.alpine. Does the file exist?"). It now renders a helpful page that
explains no `pages/*.alpine` were found and suggests the subfolders that ARE Apex
apps (`cd my-app && apex dev`).
