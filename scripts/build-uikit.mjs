// Build the UI Kit gallery: inject each component's real markup into its card
// as a live, interactive preview, and wire up the themed stylesheet + Alpine.
//
// Idempotent-ish: run against the committed docs/ui.html. To fully regenerate
// after component changes: `git checkout docs/ui.html && node scripts/build-uikit.mjs`,
// then rebuild the stylesheet:
//   pnpm dlx @tailwindcss/cli@4 -i docs/uikit.input.css -o docs/uikit.css --minify
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REG = join(ROOT, 'packages/components/registry')
const UI = join(ROOT, 'docs/ui.html')

const registry = JSON.parse(readFileSync(join(REG, 'registry.json'), 'utf8'))
const comps = registry.components || registry

/** Turn a component .alpine into standalone, page-safe preview HTML. */
function extract(key, meta) {
  let s = readFileSync(join(REG, meta.file || meta), 'utf8')
  s = s.replace(/<!--[\s\S]*?-->/g, '').trim() // drop attribution banners
  const open = s.match(/^<template([^>]*)>/)
  if (!open) throw new Error(`${key}: no root <template>`)
  s = s.slice(open[0].length)
  const lastClose = s.lastIndexOf('</template>')
  if (lastClose === -1) throw new Error(`${key}: no closing </template>`)
  const inner = s.slice(0, lastClose) + s.slice(lastClose + '</template>'.length)
  let html = `<div${open[1]}>${inner}</div>`
  html = html.replace(/<slot>([\s\S]*?)<\/slot>/g, (_, t) => t.trim() || meta.name)
  html = html.replace(/<slot\s*\/?>(<\/slot>)?/g, meta.name)
  // Namespace *literal* id/for/aria attributes so 36 components on one page
  // don't collide. Crucially, only match when preceded by whitespace/start —
  // never `x-for`, `:id`, `x-bind:id` (those are Alpine expressions).
  const ns = `pv-${key}-`
  html = html.replace(
    /(^|\s)(id|for|aria-controls|aria-labelledby|aria-describedby)="([^"]+)"/g,
    (_, pre, a, v) => `${pre}${a}="${ns}${v}"`,
  )
  html = html.replace(/(\s)href="#([^"]+)"/g, (_, pre, v) => `${pre}href="#${ns}${v}"`)
  return html.trim()
}

const previews = {}
for (const [key, meta] of Object.entries(comps)) previews[key] = extract(key, meta)

let ui = readFileSync(UI, 'utf8')

// 1. Head: themed stylesheet + local Alpine (once).
if (!ui.includes('./uikit.css')) {
  ui = ui.replace(
    '<link rel="stylesheet" href="./style.css" />',
    '<link rel="stylesheet" href="./style.css" />\n<link rel="stylesheet" href="./uikit.css" />\n<script defer src="./assets/alpine.min.js"></script>',
  )
}

// 2. Card layout CSS: preview stage + selection label (once).
const OLD_CARD_CSS =
  '  .uikit-card { display:flex; flex-direction:column; gap:.25rem; position:relative; padding:.85rem .9rem .85rem 2.1rem; border:1px solid var(--line); border-radius:var(--radius-card); background:var(--surface); cursor:pointer; transition:border-color .15s,background .15s; }\n' +
  '  .uikit-card:hover { border-color:var(--glacier); }\n' +
  '  .uikit-card:has(.uikit-cb:checked) { border-color:var(--glacier); background:var(--glacier-soft); }\n' +
  '  .uikit-cb { position:absolute; left:.8rem; top:.95rem; width:1rem; height:1rem; accent-color:var(--glacier); }'
const NEW_CARD_CSS =
  '  .uikit-card { display:flex; flex-direction:column; border:1px solid var(--line); border-radius:var(--radius-card); background:var(--surface); overflow:hidden; transition:border-color .15s; }\n' +
  '  .uikit-card:hover { border-color:var(--glacier); }\n' +
  '  .uikit-card:has(.uikit-cb:checked) { border-color:var(--glacier); }\n' +
  '  .uikit-card:has(.uikit-cb:checked) .uikit-pick { background:var(--glacier-soft); }\n' +
  '  /* Live preview stage — renders the real component on its own themed canvas. */\n' +
  '  .uikit-preview { display:flex; align-items:center; justify-content:center; min-height:11rem; max-height:11rem; padding:1.25rem; overflow:hidden; border-bottom:1px solid var(--line); background:var(--color-surface,#fff); color:var(--color-on-surface,#525252); font-size:.85rem; }\n' +
  '  html.dark .uikit-preview { background:var(--color-surface-dark,#0a0a0a); color:var(--color-on-surface-dark,#d4d4d4); }\n' +
  '  .uikit-preview > * { max-width:100%; }\n' +
  '  .uikit-preview[data-pv="sidebar"] { padding:0; }\n' +
  '  .uikit-preview[data-pv="sidebar"] .fixed { position:relative !important; }\n' +
  '  .uikit-preview[data-pv="sidebar"] [class*="h-svh"] { height:11rem !important; }\n' +
  '  .uikit-preview[data-pv="sidebar"] [aria-label="sidebar navigation"] { transform:none !important; }\n' +
  '  .uikit-preview[data-pv="carousel"] { padding:0; align-items:stretch; }\n' +
  '  .uikit-preview[data-pv="carousel"] > * { width:100%; }\n' +
  '  .uikit-preview[data-pv="carousel"] [class*="min-h-"] { min-height:11rem !important; }\n' +
  '  .uikit-pick { position:relative; display:flex; flex-direction:column; gap:.25rem; padding:.7rem .85rem .8rem 2.05rem; cursor:pointer; }\n' +
  '  .uikit-cb { position:absolute; left:.7rem; top:.85rem; width:1rem; height:1rem; accent-color:var(--glacier); }'
if (ui.includes(OLD_CARD_CSS)) ui = ui.replace(OLD_CARD_CSS, NEW_CARD_CSS)

// 3. Intro: PenguinUI credit + its styling (once).
if (!ui.includes('uikit-credit')) {
  ui = ui.replace(
    '  .uikit-hero p { color: var(--muted); margin:.7rem 0 0; max-width:60ch; }',
    '  .uikit-hero p { color: var(--muted); margin:.7rem 0 0; max-width:60ch; }\n' +
      '  .uikit-credit { font-size:.82rem; }\n' +
      '  .uikit-credit a { color:var(--glacier); text-decoration:none; border-bottom:1px solid color-mix(in srgb,var(--glacier) 40%,transparent); }\n' +
      '  .uikit-credit a:hover { border-bottom-color:var(--glacier); }',
  )
  ui = ui.replace(
    "They're themeable — restyle everything with <code>apex theme</code>. 36 components.</p>",
    "They're themeable — restyle everything with <code>apex theme</code>. 36 components, each previewed live below.</p>\n" +
      '    <p class="uikit-credit">Components are adapted from <a href="https://penguinui.com" target="_blank" rel="noopener">Penguin UI</a> (MIT) and re-tokenised for the Apex theme system. Thanks to the Penguin UI authors.</p>',
  )
}

// 4. Mirror the docs light/dark theme onto the previews (once).
const OLD_TOGGLE =
  '    document.getElementById("themeToggle").addEventListener("click", () => {\n' +
  '      var dark = getComputedStyle(root).getPropertyValue("--ground").trim().indexOf("#0a") === 0;\n' +
  '      root.setAttribute("data-theme", dark ? "light" : "dark");\n' +
  '    });'
const NEW_TOGGLE =
  '    function syncPreviewTheme() {\n' +
  '      var dark = getComputedStyle(root).getPropertyValue("--ground").trim().indexOf("#0a") === 0;\n' +
  '      root.classList.toggle("dark", dark);\n' +
  '    }\n' +
  '    syncPreviewTheme();\n' +
  '    document.getElementById("themeToggle").addEventListener("click", () => {\n' +
  '      var dark = getComputedStyle(root).getPropertyValue("--ground").trim().indexOf("#0a") === 0;\n' +
  '      root.setAttribute("data-theme", dark ? "light" : "dark");\n' +
  '      syncPreviewTheme();\n' +
  '    });'
if (ui.includes(OLD_TOGGLE)) ui = ui.replace(OLD_TOGGLE, NEW_TOGGLE)

// 5. Inject the live preview into each card (label -> div.card > preview + label.pick).
let injected = 0
const notFound = []
for (const [key, html] of Object.entries(previews)) {
  const re = new RegExp(
    `<label class="uikit-card">\\s*(<input type="checkbox" class="uikit-cb" value="${key}"[^>]*/>[\\s\\S]*?)</label>`,
  )
  if (!re.test(ui)) {
    notFound.push(key)
    continue
  }
  ui = ui.replace(
    re,
    (_m, innards) =>
      `<div class="uikit-card">\n          <div class="uikit-preview" data-pv="${key}">${html}</div>\n          <label class="uikit-pick">${innards}</label>\n        </div>`,
  )
  injected++
}
writeFileSync(UI, ui)

// 6. Vendor Alpine locally (best-effort — it's rarely updated).
try {
  const require = createRequire(import.meta.url)
  const src = require.resolve('alpinejs/dist/cdn.min.js')
  copyFileSync(src, join(ROOT, 'docs/assets/alpine.min.js'))
} catch {
  if (!existsSync(join(ROOT, 'docs/assets/alpine.min.js')))
    console.warn('  ! alpine.min.js missing and alpinejs not resolvable — vendor it manually')
}

console.log(`UI Kit: injected ${injected}/${Object.keys(previews).length} previews.`)
if (notFound.length) console.log('  no card matched:', notFound.join(', '))
console.log(
  '  next: pnpm dlx @tailwindcss/cli@4 -i docs/uikit.input.css -o docs/uikit.css --minify',
)
