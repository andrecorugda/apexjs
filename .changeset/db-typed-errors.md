---
"@apex-stack/data": minor
---

Eloquent-style error handling. Data operations no longer swallow errors or leak raw driver
failures: every query/write is wrapped so a driver error is rethrown as a `QueryException`
carrying the model + op and the original error as `.cause` (the server's `onError` hook logs
the full detail; the API masks it from clients). Missing rows throw `ModelNotFoundException`
via new `Model.findOrFail(handle, id)` / `Model.firstOrFail(handle)` / `builder.firstOrFail()`.
Both extend `ApexDataError` and carry an `httpStatus` (404 / 500) so the request layer can map
them. Exported: `ApexDataError`, `ModelNotFoundException`, `QueryException`.
