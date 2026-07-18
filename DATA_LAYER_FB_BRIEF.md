# Co-worker brief: Facebook post plan + 9:16 video — the Apex data layer

The full prompt below is self-contained (hand it to any co-worker/AI session as-is). Deliverables:
a Facebook post plan and a 9:16 vertical video (Reel) explaining Apex's data layer — model,
migrations, composables, and the Eloquent-style ORM.

---

## THE PROMPT

You're producing launch content for **Apex JS** (apexjs.site) — the full-stack, AI-native
meta-framework for Alpine.js ("Apex is to Alpine what Nuxt is to Vue"). Target: web developers on
Facebook, especially **Laravel/PHP developers** — the data layer is deliberately Eloquent-flavored,
and that audience will feel at home instantly.

### Deliverable 1 — Facebook post plan
A Reel-first plan: primary post (the 9:16 video below + caption), plus copy variants.
- **Caption** for the Reel: hook line first (visible before "…see more"), 3–5 short lines, one CTA
  (`npm create apexjs@latest`), link to https://apexjs.site/docs/data.html in the caption AND
  repeated as the first comment (FB downranks link posts less in comments).
- **Hashtags** (6–10): #webdev #javascript #typescript #laravel #eloquent #alpinejs #opensource
  #fullstack — Laravel tags on purpose; this piece is aimed at them.
- **A text-only companion post** (for groups/pages that prefer text): the code snippet as an image
  + 4-6 line explainer.
- **Cadence suggestion**: Reel day 1, text+code-image day 3, a "behaviors deep-dive" follow-up
  clip day 7.

### Deliverable 2 — the 9:16 video (~60s Reel)
- **Format**: 1080×1920 vertical. Big type — code must be readable on a phone (max ~40 char lines,
  22pt+ equivalent). **Burned-in captions on every VO line** (FB autoplays muted — the video must
  work with sound OFF).
- **Voiceover**: female narrator, warm and genuinely excited — a team showing off something they're
  proud of, never corporate or hypey. **Never speak a URL** (screen-only — subtitles must never
  read "dot site"). Keep the VO lines short and clean for TTS (they're listed per scene below;
  don't rewrite them into run-ons).
- **All code shown must be EXACTLY the snippets given below** — they're real, from the shipped
  framework. Do not invent APIs.

#### Scene-by-scene (adapt timing, keep the order + beats)

**Scene 1 — Hook (0:00–0:06).** Full-screen text over the Apex mark: "Laravel developers… this
will feel like home." VO: *"Hey Laravel folks — this one's for you. This is Apex, and its data
layer will feel like home."*

**Scene 2 — The model (0:06–0:20).** Type this code on screen (it's the entire model):
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
Then four badges pop around it, one per beat: `SQL schema` · `zod validation` · `migration` ·
`REST + MCP API`. VO: *"One model. That's it. From this single definition, Apex derives the
database schema… the validation… the migration… and a full REST API."* Then the one-liner:
```ts
// server/api/messages.ts
export default Message.resource(handle)
```
VO: *"One line, and it's live — list, get, create, update, delete."*

**Scene 3 — Behaviors = traits (0:20–0:32).** The `use:` line expands:
```ts
use: [timestamps(), owned(), softDeletes(), auditable()]
```
VO: *"And these? They're like Laravel traits. Timestamps. Ownership with row-level security. Soft
deletes. A full audit trail. Composable — stack what you need."*

**Scene 4 — Migrations (0:32–0:42).** Terminal: `apex make model Post` then `apex migrate`. Show a
migration file with the `-- @down` marker visible; then `apex migrate --rollback` (if unsure of the
exact rollback flag, show only `apex migrate` — do NOT invent flags). VO: *"Migrations? Generated
for you — with up and down. Run them, roll them back. You know this dance."*

**Scene 5 — Composables (0:42–0:50).** Show:
```ts
// composables/useToggle.ts
export function useToggle(initial = false) {
  return { on: initial, toggle() { this.on = !this.on } }
}
```
and its use: `<template x-data="useToggle(true)">`. VO: *"Reusable logic? Composables — write a
function once, use it in any component. Server and client."*

**Scene 6 — The twist Eloquent doesn't have (0:50–1:00).** The REST endpoints morph into MCP tool
chips: `messages_list · messages_create · …` with a chat bubble "AI: create a message…" VO: *"And
here's the part Eloquent can't do: every model operation is also an AI tool — automatically. Your
assistant can query and write your data, with your auth rules enforced."* End card: Apex mark +
`apexjs.site` + `npm create apexjs@latest` (screen only). VO: *"One model. Everything derived.
This is Apex."*

#### Honesty guardrails (non-negotiable)
- Say "**Eloquent-style**" / "will feel like home" — NEVER "Eloquent parity" or "everything
  Eloquent has" (relations, for one, aren't there yet). The honest claim: one definition derives
  schema + validation + migration + REST + MCP, with trait-like behaviors.
- The AI/MCP claim is real and is the differentiator — auth-scoped MCP tools per model. Lean on it.
- Under the hood it's **Drizzle** — if asked, say so proudly (curate, don't rebuild).

#### Facts you may also use (all shipped, verifiable at apexjs.site/docs/data.html)
- Drivers: SQLite/libSQL (zero-config in-memory for dev), Turso, Postgres (Supabase/Neon), PGlite.
  One `DATABASE_URL` switch to production.
- `access` + row-level `scope` gate every operation identically over REST **and** MCP.
- Schema-inferred test factories (`factory(Message).createMany(db, 5)`).
- The same model runs on-device in the native mobile build (offline SQLite) — same code.

### Return format
1. The FB post plan (caption, hashtags, companion post, cadence).
2. The video script as a scene table (time · visual · on-screen text · VO line · caption text).
3. A clean VO-only block (one line per subtitle, no URLs) for the narrator/TTS.
