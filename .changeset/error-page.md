---
'@apex-stack/core': minor
---

Sentry-style dev error page.

When a page loader throws in dev (and there's no `pages/error.alpine`), the
overlay is now a proper debugger: expandable stack-frame cards with inline code
context (failing line highlighted), a Frames/Raw toggle, a project file tree
with folder/file icons where the error's origin file is marked red, and
"open in editor" links. A dev-only `/__apex_open` endpoint launches the file at
its line/column in your editor (honors `$APEX_EDITOR`/`$EDITOR`, else the
detected VS Code / Cursor / Windsurf / VSCodium CLI); it only opens files inside
the project root.
