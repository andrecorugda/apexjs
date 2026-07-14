---
"@apex-stack/data": patch
---

On-device DB persistence seam (survive app cold starts). The mobile SQLite backend can now restore
from a saved snapshot and export its current bytes:

- at open, if the host set `globalThis.__APEX_DB_SNAPSHOT__` (base64 of a prior `db.export()`), the
  database restores from it instead of starting empty (idempotent with `lazyDb`'s migrate + seed);
- `globalThis.__APEX_DB_EXPORT__()` returns the current DB bytes (base64) for the host to persist.

Storage-agnostic: the native shell wires it to a private app file (recommended) or WebView OPFS —
see the native-shell guide. Both are no-ops off-device.
