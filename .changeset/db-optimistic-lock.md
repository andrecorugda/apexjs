---
"@apex-stack/data": minor
---

Optimistic locking. Set `optimisticLock: 'version'` on a model (declare an int `version` column)
and `instance.save()` guards the UPDATE on the loaded version and bumps it — a concurrent write
that changed the row makes the save lose, throwing `StaleModelException` (HTTP 409) instead of
silently clobbering. Exported alongside the other typed errors.
