---
'@apex-stack/kit': minor
'@apex-stack/core': minor
---

Component server loaders now run inside `x-for` / `x-if` (completes the feature).

Each instance's loader runs once at SSR; the results are baked into the loop
component's `x-data` as an inline object literal keyed by the loop `:key`, so the
client re-evaluates `x-data` per clone and reads its item's slice — **no payload
island, no extra client runtime** (it's native Alpine `x-data` evaluation). Identical
props are deduped per render (mitigates N+1). Verified: per-item SSR data, correct
per-clone client evaluation, and memoized loader calls. (Keyless loops over objects
should use `:key`; primitives work either way.)
