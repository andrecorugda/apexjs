---
"@apex-stack/core": minor
"create-apexjs": patch
---

`apex make model` normalizes the resource to lowercase-plural.

`apex make model Post` now scaffolds a PascalCase file (`models/Post.ts`) whose
`defineModel` uses a lowercase-plural resource — `defineModel('posts', …)` → REST at
`/api/posts`, table `posts`, MCP tools `posts_*` — regardless of how the name is typed
(`Post` / `post` / `posts` all → `posts`, `Category` → `categories`). Matches the
Rails/Prisma convention and `apex make composable Post` → `usePosts()`, so the whole
model→REST→MCP→client chain reads consistently. Previously the name was used verbatim,
so `apex make model Post` produced a capitalized `/api/Post` route.
