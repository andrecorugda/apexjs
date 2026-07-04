---
'@apex-stack/core': patch
---

Dev server no longer crashes with a cryptic `postcss ENOENT: … 'tailwindcss'`
when `app.css` imports Tailwind but it isn't installed. It now skips the
stylesheet and prints a clear warning telling you to run
`npm i -D tailwindcss @tailwindcss/vite`, so the app still boots (unstyled).
