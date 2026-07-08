---
'@apex-stack/core': patch
---

Follow-ups from the second model-verify pass.

- Missing-table API error now actually surfaces the reason + hint: the driver's
  real message ("no such table: …") lives on the error's `.cause`, not the
  top-level "Failed query: …" — the handler now includes both, so the response
  carries the reason and the "run `apex migrate`" hint fires.
- `apex make model` writes `TEXT` for `timestamp` columns in the generated
  migration (matching defineModel's ISO-string storage) — was `INTEGER`, which
  only worked under SQLite's loose typing and would mismatch on Postgres.
