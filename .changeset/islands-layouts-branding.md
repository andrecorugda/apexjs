---
'@apex-stack/core': minor
'create-apexjs': minor
---

Islands mode now applies layouts + `head()`, and the demo scaffold is branded.

- **Islands fix:** `apex dev --islands` (and the islands build) previously rendered
  the bare page — no layout, no `head()`/SEO — so nav/branding/footer vanished and
  pages looked broken. The page is now wrapped in its layout chain and the whole
  tree (layout + page) runs through the islands walker, so `client:*` directives in
  the layout or page hydrate. Root x-data defaults are available as SSR scope too.
- **Branded scaffold:** the starter ships the Apex mark (`public/favicon.svg`),
  shows it in the nav + a hero ("Built with Apex JS"), and the shell emits a
  `<link rel="icon">` by default. The demo's interactivity now uses `client:*`
  islands, so it works in BOTH default and islands mode (dark toggle, counter,
  and the reveal all hydrate). Theme also respects `prefers-color-scheme` on first
  visit.
- **Smarter editor extension prompt:** `apex new` / `apex upgrade` now detect VS
  Code **and its forks** (Cursor, Windsurf, VSCodium) and check the installed
  extension version — they only prompt to *install* (not present) or *update*
  (older), and stay quiet with an "up to date" note when it's already current.
  Extension icon is the Apex mark.
