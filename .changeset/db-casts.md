---
"@apex-stack/data": minor
---

Attribute casts: `defineModel('events', { fields: {...}, casts: { publishedAt: 'date', prefs: 'json' } })`.
Built-ins `date` / `number` / `boolean` / `json`, or a custom `{ get, set }` pair — `get` runs when
hydrating an instance (e.g. stored ISO string → `Date`), `set` runs before a write (e.g. `Date` →
ISO string, object → JSON). Applies to `Model.*` reads/writes on top of the column's storage type.
