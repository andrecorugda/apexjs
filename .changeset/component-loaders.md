---
'@apex-stack/kit': minor
'@apex-stack/core': minor
---

Component-level server loaders (singleton).

A component (`components/*.alpine`) can now declare a `<script server>` with
`export function loader({ props })` — it runs on the server when the component is
embedded, its result merges into the component's scope (available to the template +
x-data) and is baked into the instance's `x-data` literal, so the client hydrates
without re-fetching and no extra state island is needed. Loaders may be async; the
SSR render pipeline is now async end-to-end.

Great for self-contained widgets (`<Sidebar/>`, `<LatestPosts/>`, `<Dashboard/>`)
that own their data instead of receiving everything via props. Loaders inside
`x-for`/`x-if` are not run yet (a dev warning points you to hoist to the parent
loader); per-item keyed-payload loop hydration is the next increment.
