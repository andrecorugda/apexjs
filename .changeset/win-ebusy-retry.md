---
"@apex-stack/core": patch
---

`apex build`: retry clearing `dist/` on Windows `EBUSY` (transient file locks right after a
serve/build no longer fail the first build attempt).
