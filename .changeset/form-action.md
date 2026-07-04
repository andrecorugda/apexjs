---
"@apex-stack/core": minor
"@apex-stack/kit": minor
---

Form-action sugar — `createAction(url, opts)` (from `@apex-stack/core/client`).

Spread it into an `x-data` to bind a form to an Apex route with `pending` / `error` / `data` state and no boilerplate:

```html
<script client> import { createAction } from '@apex-stack/core/client' </script>
<template x-data="{ ...createAction('/api/messages', { onSuccess: () => location.reload() }) }">
  <form @submit="submit($event)">
    <input name="body" />
    <button :disabled="pending" x-text="pending ? 'Saving…' : 'Post'"></button>
    <p x-show="error" x-text="error"></p>
  </form>
</template>
```
Posts the form as JSON to the same typed route your REST clients + MCP tools hit — one server surface. Methods/fields survive object-spread (stays reactive).
