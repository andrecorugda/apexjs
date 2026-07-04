# @apex-stack/kit

## 0.3.0

### Minor Changes

- 005de5d: Apex components now work inside `x-for` and `x-if`.

  Previously a component used in a loop or conditional (`<Card>` inside
  `<template x-for>`) rendered correctly on the server but hydrated **unstyled** —
  Alpine re-creates a template's children on the client and doesn't know the
  component tag. The SSR walker now expands components _inside_ template contents
  into their resolved markup (slot children spliced in; props + the component's own
  x-data reconstructed at runtime so they resolve per clone), so Alpine clones real
  markup. This is the "Alpine Extreme" bit: component-driven lists that raw Alpine
  can't express now just work.

## 0.2.0

### Minor Changes

- 2f71124: Form-action sugar — `createAction(url, opts)` (from `@apex-stack/core/client`).

  Spread it into an `x-data` to bind a form to an Apex route with `pending` / `error` / `data` state and no boilerplate:

  ```html
  <script client>
    import { createAction } from "@apex-stack/core/client";
  </script>
  <template
    x-data="{ ...createAction('/api/messages', { onSuccess: () => location.reload() }) }"
  >
    <form @submit="submit($event)">
      <input name="body" />
      <button
        :disabled="pending"
        x-text="pending ? 'Saving…' : 'Post'"
      ></button>
      <p x-show="error" x-text="error"></p>
    </form>
  </template>
  ```

  Posts the form as JSON to the same typed route your REST clients + MCP tools hit — one server surface. Methods/fields survive object-spread (stays reactive).
