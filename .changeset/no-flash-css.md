---
'@apex-stack/core': patch
---

No more style flash — and production builds are actually styled.

The global `app.css` (Tailwind + shared styles) was loaded via a deferred JS
import at the end of `<body>`, so pages painted unstyled (white) for a moment
before styling applied — a flash on every navigation. It's now a render-blocking
`<link>` in `<head>`. Critically, the **production** client build never ran the
Tailwind plugin nor linked the extracted CSS, so built sites shipped with **no
Tailwind at all**; `apex build`/`--server` now process `app.css` through Tailwind,
extract it to a hashed asset, and link it in every page's `<head>`. VS Code
extension icon updated (0.1.4).
