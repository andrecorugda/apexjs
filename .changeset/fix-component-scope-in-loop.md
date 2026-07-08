---
'@apex-stack/kit': patch
'@apex-stack/core': patch
---

Fix component `<style scoped>` not applying to components rendered inside `x-for` / `x-if`.

The in-loop (structural) component expansion stamped the component's scope id only
on the wrapper element, leaving its inner elements unstamped — then the loop-clone
re-walk blanketed them with the enclosing page scope. So a component's scoped CSS
(`button[data-apex-xxx]`) never matched inside a loop (Tailwind classes still worked,
since utilities need no scope attribute). The expansion now stamps the component's
own scope across its whole subtree (stopping at nested component boundaries), matching
the non-loop path. Verified with a nested-element component in `x-for`.
