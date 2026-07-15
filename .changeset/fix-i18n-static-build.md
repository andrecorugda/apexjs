---
"@apex-stack/core": patch
---

Fix `apex build` / `--islands` for i18n apps (#54). The static prerender loop never built the
i18n runtime, so any loader using `locals.t` crashed the build (`t is not a function`). The
prerender now seeds `locals.t`/`locals.locale` exactly like the dev and prod servers — and bakes
**one HTML per locale**: the default locale at the plain path and every other locale under its
`/<locale>` prefix (`/hello` + `/fr/hello`), each with the correct `<html lang>` and translated
markup. Islands shells now honor the active locale in `<html lang>` too.
