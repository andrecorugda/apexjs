---
"@apex-stack/data": minor
---

Test-data factories. `factory(model)` infers schema-valid fake rows from a model's
fields (no blueprint — the fields are the blueprint): `make(overrides?)`,
`makeMany(n)`, `create(db)`, `createMany(db, n)`. Overrides win and extra keys pass
through; timestamp columns are left unset by default (so a generated row isn't
accidentally soft-deleted). Zero-dep by default; plug in `@faker-js/faker` (or any
generator) via the `fake` hook for richer values.
