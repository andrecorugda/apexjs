---
"@apex-stack/data": minor
---

Model instances + Collections + serialization. Reads now return hydrated **instances**
(`Model.first/find`, `create/update/updateOrCreate`) and a **Collection** (`Model.all`,
`.where().all()`), matching Eloquent's feel:

- Instance methods: `save()` (persists only dirty attributes through the write pipeline —
  hooks/timestamps/scope), `delete()` (soft-delete aware), `refresh()`, `isDirty(col?)`,
  `changes()`, and `toJSON()`.
- `Collection<T>` extends Array (length/iteration/spread work) with `pluck`, `keyBy`,
  `groupBy`, `sum`, `isEmpty`, `toArray`, `toJSON`; `.map`/`.filter` return plain arrays.
- **Serialization**: model `hidden: ['password', …]` omits those columns from
  `instance.toJSON()`/`JSON.stringify` AND from every REST/MCP resource response
  (list/get/create/update) — so secrets never leak over the API.

Exported: `Collection`, `collect`, and the `ModelInstance` type.
