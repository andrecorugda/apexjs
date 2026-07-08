---
'@apex-stack/core': minor
---

`apex make model <name> <field:type>…` — scaffold a full data model in one command.

Generates three files: `models/<name>.ts` (a `defineModel`), `server/api/<name>.ts`
(wires `model.resource(db)` — auto-served by the API loader as REST `/api/<name>`
+ MCP tools `<name>_list/_get/_create/_update/_delete`), and a starter
`db/migrations/<ts>_create_<name>.sql`. Field syntax: `title:string`, `views:int`,
`email:string!` (trailing `!` = NOT NULL). Types: string/text/int/float/boolean/
timestamp/json. So: `apex make model todos title:string! done:boolean` → `apex migrate`
→ `apex dev` and a typed, AI-callable CRUD API is live with no hand-wiring.
