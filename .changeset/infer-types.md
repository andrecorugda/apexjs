---
"@apex-stack/core": minor
---

Shared FE/BE types — `defineApexRoute` now carries its input/output types, and `InferInput`/`InferOutput` derive them.

```ts
// server/api/posts.ts
export default defineApexRoute({ input: { id: z.coerce.number() }, handler: ({ input }) => getPost(input.id) })

// on the frontend — one contract, no duplicated types, no drift
import type { InferOutput } from '@apex-stack/core'
import type posts from '../server/api/posts'
type Post = InferOutput<typeof posts>
```
Phantom type fields (erased at runtime); use a `import type` on the frontend so no server code is bundled.
