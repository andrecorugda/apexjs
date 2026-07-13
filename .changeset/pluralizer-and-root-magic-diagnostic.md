---
"@apex-stack/kit": minor
"@apex-stack/vite": minor
"@apex-stack/core": minor
---

Polish the two rough edges from the 0.33.0 verify.

- **Smarter pluralizer** (`apex make model`). The resource normalizer now knows the
  common English irregulars and uncountables in both directions: `Person` → `people`,
  `Child` → `children`, `Datum` → `data`, `Analysis` → `analyses`, `Status` →
  `statuses` (not `stati`); `Sheep` / `Series` stay put. Still idempotent
  (`people` → `people`). Fixes the naive `Person` → `persons` result.

- **Root x-data magic diagnostic** (#47 follow-up). A plugin magic used in a page's
  root `x-data` now routes through `resolveRootMagic(name, Alpine)` on the client:
  a magic with a global form (`$persist`) works as before; one *without* a global form
  no longer degrades to a *silent* no-op — it logs a one-time console warning naming the
  magic and the fix (use a nested `x-data`), then returns undefined so the page never
  crashes. The helper is imported only when a page actually uses such a magic.
