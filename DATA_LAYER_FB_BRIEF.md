# Co-worker brief: Facebook post plan + 9:16 video — the Apex data layer

Self-contained prompt for a co-worker/AI session. Deliverables: a Facebook post plan and a 9:16
vertical Reel explaining Apex's data layer. **Every fact and snippet below is taken from the
shipped docs (apexjs.site/docs/data.html) and verified against the source — do not invent APIs.**

---

## THE PROMPT

You're producing launch content for **Apex JS** (apexjs.site) — the full-stack, AI-native
meta-framework for Alpine.js. Target audience: web developers on Facebook, especially
**Laravel/PHP developers** — the data layer is deliberately Eloquent-flavored, and the docs
themselves describe the feature set as rounding out *Eloquent parity*. That audience will feel at
home in seconds; lean into it.

### Deliverable 1 — Facebook post plan
Reel-first: primary post = the 9:16 video + caption.
- **Caption**: hook line first (visible before "…see more" — e.g. "Laravel devs: your ORM instincts
  work in TypeScript now."), 3–5 short lines, one CTA (`npm create apexjs@latest`); the docs link
  https://apexjs.site/docs/data.html in the caption AND repeated as the first comment.
- **Hashtags** (6–10): #webdev #javascript #typescript #laravel #eloquent #alpinejs #opensource
  #fullstack.
- **Text-only companion post** (for dev groups): the `defineModel` snippet as a code image + a
  6-line explainer ending on the MCP twist.
- **Cadence**: Reel day 1 → code-image post day 3 → a follow-up clip day 7 (suggest: "relations &
  eager loading in one query" as the sequel topic).

### Deliverable 2 — the 9:16 video (60–90s Reel; 75s target)
- 1080×1920. Code must be phone-readable (≤40-char lines, large type). **Burned-in captions on
  every VO line** (FB autoplays muted — the video must work with sound OFF).
- **Voiceover: female narrator** — warm, genuinely excited, a team showing off work they're proud
  of; never corporate. **Never speak a URL** (screen-only; subtitles must never read "dot site").
- All code EXACTLY as written below (from the shipped docs).

#### Scenes (keep order + beats; tune timing)

**S1 — Hook (0:00–0:06).** Text over the Apex mark: "Laravel developers… this will feel like
home." VO: *"Hey Laravel folks — this one's for you. This is Apex. And its data layer speaks your
language."*

**S2 — One model, everything derived (0:06–0:20).**
```ts
// models/Message.ts
export const Message = defineModel('messages', {
  fields: {
    author: { type: 'string', notNull: true },
    body:   { type: 'string', notNull: true },
  },
  use: [timestamps()],
})
```
Badges pop per beat: `Zod validation` · `Drizzle table` · `migration SQL` · `REST + MCP API` ·
`typed query API`. Then the one-liner:
```ts
// server/api/messages.ts
export default Message.resource(handle)
```
VO: *"One model — that's the single source of truth. From it, Apex derives the validation, the
table, the migration, AND a full REST API. One more line… and it's live. List, get, create,
update, delete — with pagination, filtering, and sorting for free."*

**S3 — Active record (0:20–0:34).** Type, in quick succession:
```ts
await Player.find(handle, id)
await Player.where({ team: 'A', plays: { gt: 5 } })
  .orderBy('plays', 'desc').limit(10).all(handle)

const p = await Player.find(handle, id)
p.plays = 5
p.isDirty()      // true
await p.save()   // persists only what changed
```
VO: *"And querying? Pure Eloquent instincts. Find. Where. Order, limit, all. Instances track their
own dirty state — save writes only what changed."*

**S4 — Relations (0:34–0:46).**
```ts
relations: {
  author:   belongsTo(() => User, 'authorId'),
  comments: hasMany(() => Comment, 'postId'),
}

const posts = await Post.with('author', 'comments').all(handle)
posts[0].author    // a User
posts[0].comments  // a Collection
```
VO: *"Relations — with eager loading. And here's the nice bit: loading a relation for a hundred
posts is ONE extra query. Not a hundred."*

**S5 — The rapid-fire parity list (0:46–0:58).** Fast cuts, one line each on screen:
`handle.transaction(async (tx) => { … })` → `scopes: { published: (q) => q.where({status:'published'}) }`
→ `casts: { at: 'date', prefs: 'json' }` → `optimisticLock: 'version'` → behaviors
`timestamps() · owned() · softDeletes() · auditable()`. VO: *"Transactions with auto-rollback.
Named scopes. Casts. Optimistic locking. And behaviors — like traits: timestamps, ownership with
row-level security, soft deletes, audit trails."*

**S6 — Migrations (0:58–1:06).** Terminal:
```
apex make model Post title:string published:boolean
apex migrate
apex migrate --rollback --steps 2
```
VO: *"Migrations are plain SQL, generated for you — reversible, tracked, rolled back on command.
You know this dance."*

**S7 — The model reaches the browser (1:06–1:14).** Terminal: `apex make composable Post` →
```ts
// generated: composables/usePosts.ts — typed from the model
const { items, loading, fetch, create } = usePosts()
```
→ `<template x-data="{ ...usePosts(), init() { this.fetch() } }">`. VO: *"And the model drives the
browser too: one command generates a typed composable — fetch, create, update, remove — straight
into your components."*

**S8 — The twist Eloquent doesn't have (1:14–1:24).** The REST table morphs into MCP tool chips
(`messages_list · messages_create · …`) + a chat bubble "AI: create a message…". End card: Apex
mark + `apexjs.site` + `npm create apexjs@latest` (screen only). VO: *"And the part Eloquent can't
do: every one of those model operations is also an AI tool — automatically, with your auth rules
enforced. One model. Schema, queries, relations, REST, the browser… and AI. This is Apex."*

#### Honesty guardrails
- "Eloquent-style" / "Eloquent parity across queries, relations, scopes, casts, transactions,
  locking" is FAIR (it's the docs' own framing). Do NOT claim "everything Eloquent has":
  relations are `hasOne`/`hasMany`/`belongsTo` — **no many-to-many or polymorphic yet**; don't
  show or mention them.
- Every command shown is real: `apex make model <Name> field:type…`, `apex migrate`,
  `apex migrate --rollback --steps N`, `apex make composable <Model>`.
- Under the hood it's **Drizzle** — if asked, say so proudly (curate, don't rebuild).
- Writes via `Model.create/update/delete` run the SAME pipeline as REST/MCP (hooks, scope,
  validation) — safe to say "your rules apply everywhere". Bulk ops (`insertMany`/`upsert`)
  bypass per-row hooks (like Eloquent's bulk ops) — don't claim hooks there.

#### Extra verified facts (usable)
- List endpoints paginate/filter/sort out of the box: `?page&perPage` → `{data,total,page,perPage,lastPage}`, `?sort=-createdAt`, `?<col>=value` — REST **and** MCP.
- Typed errors: `findOrFail` → 404 `ModelNotFoundException`; stale `save()` under
  `optimisticLock` → 409 `StaleModelException`.
- `hidden` columns are stripped from `toJSON` and every REST/MCP response.
- Drivers: libSQL/SQLite (file or memory), Turso (edge), Postgres (Supabase/Neon), PGlite (tests)
  — one model runs unchanged on all; one `DATABASE_URL` switch.
- The same model runs **on-device** in the native mobile build (offline SQLite) — same code.
- Escape hatch: `Model.tableFor(handle)` exposes the Drizzle table for joins/window functions;
  `raw('plays + 1')` for trusted SQL expressions.

### Return format
1. The FB post plan (caption, hashtags, companion post, cadence).
2. The video script as a scene table (time · visual · on-screen text · VO · caption).
3. A clean VO-only block (one line per subtitle, no URLs) for the narrator/TTS.
