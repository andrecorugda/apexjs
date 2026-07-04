---
"@apex-stack/core": minor
---

Nested layouts + per-route error boundaries.

- **Nested layouts** — a layout can declare its own parent via `export const layout = '<name>'`; Apex wraps outward (page → layout → parent layout …), merging each layer's scoped CSS. Cycle-guarded.
- **Error boundary** — add `pages/error.alpine`; when a page `loader()` throws, Apex renders the error page (wrapped in your layouts) with `{ error: { message, statusCode } }` instead of crashing. Wired in dev + prod. Throw a `{ statusCode }`-bearing error to set the code. (Loading boundaries pair with client-side navigation — tracked.)
