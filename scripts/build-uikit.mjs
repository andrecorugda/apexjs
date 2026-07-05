// Populate the UI Kit page (docs/ui.html) master-detail layout: a component
// list on the left (each with a checkbox) and a live preview + info on the right.
// The page chrome/CSS/JS is hand-authored in docs/ui.html; this script fills the
// two marker regions from the component registry + the .alpine sources.
//
// Regenerate after component changes:
//   node scripts/build-uikit.mjs
//   pnpm dlx @tailwindcss/cli@4 -i docs/uikit.input.css -o docs/uikit.css --minify
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REG = join(ROOT, 'packages/components/registry')
const UI = join(ROOT, 'docs/ui.html')

// Ordered categories → component keys. The single source of truth for how the
// UI Kit list is grouped; names/descriptions come from the registry.
const CATALOG = [
  { cat: 'Actions', keys: ['button'] },
  {
    cat: 'Forms',
    keys: [
      'text-input',
      'textarea',
      'select',
      'checkbox',
      'radio',
      'toggle',
      'range',
      'file-input',
      'rating',
      'combobox',
      'counter',
    ],
  },
  { cat: 'Overlays', keys: ['modal', 'dropdown', 'accordion', 'tooltip'] },
  {
    cat: 'Navigation',
    keys: ['navbar', 'sidebar', 'breadcrumbs', 'pagination', 'steps', 'tabs', 'link'],
  },
  { cat: 'Feedback', keys: ['alert', 'banner', 'toast', 'badge'] },
  { cat: 'Loading', keys: ['spinner', 'progress', 'skeleton'] },
  { cat: 'Data & media', keys: ['table', 'card', 'avatar', 'kbd', 'chat-bubble', 'carousel'] },
]

const registry = JSON.parse(readFileSync(join(REG, 'registry.json'), 'utf8'))
const comps = registry.components || registry

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

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
  return html.trim()
}

const listParts = []
const detailParts = []
let first = true
const missing = []
for (const { cat, keys } of CATALOG) {
  listParts.push(`      <div class="uikit-catlabel">${esc(cat)}</div>`)
  for (const key of keys) {
    const meta = comps[key]
    if (!meta) {
      missing.push(key)
      continue
    }
    const tag = `&lt;${meta.name}/&gt;`
    listParts.push(
      `      <div class="uikit-row${first ? ' active' : ''}" data-key="${key}">` +
        `<input type="checkbox" class="uikit-cb" value="${key}" aria-label="Select ${esc(meta.name)}" />` +
        `<button type="button" class="uikit-rowname" data-key="${key}">${esc(meta.name)}</button></div>`,
    )
    detailParts.push(
      `      <div class="uikit-item" data-key="${key}"${first ? '' : ' hidden'}>\n` +
        `        <div class="uikit-stage" data-pv="${key}">${extract(key, meta)}</div>\n` +
        `        <div class="uikit-info">\n` +
        `          <h2>${esc(meta.name)} <code>${tag}</code></h2>\n` +
        `          <p>${esc(meta.description ?? '')}</p>\n` +
        `          <p class="uikit-add"><code>apex add ${key}</code></p>\n` +
        `        </div>\n      </div>`,
    )
    first = false
  }
}
if (missing.length) {
  console.error('Registry missing keys from CATALOG:', missing.join(', '))
  process.exit(1)
}

function fill(html, name, body) {
  const re = new RegExp(`(<!-- uikit:${name}:start -->)[\\s\\S]*?(<!-- uikit:${name}:end -->)`)
  if (!re.test(html)) throw new Error(`marker uikit:${name} not found in ui.html`)
  return html.replace(re, `$1\n${body}\n      $2`)
}

let ui = readFileSync(UI, 'utf8')
ui = fill(ui, 'list', listParts.join('\n'))
ui = fill(ui, 'detail', detailParts.join('\n'))
writeFileSync(UI, ui)

// Vendor Alpine locally (best-effort — it's rarely updated).
try {
  const require = createRequire(import.meta.url)
  copyFileSync(require.resolve('alpinejs/dist/cdn.min.js'), join(ROOT, 'docs/assets/alpine.min.js'))
} catch {
  if (!existsSync(join(ROOT, 'docs/assets/alpine.min.js')))
    console.warn('  ! alpine.min.js missing and alpinejs not resolvable — vendor it manually')
}

const total = CATALOG.reduce((n, c) => n + c.keys.length, 0)
console.log(`UI Kit: ${total} components → list + detail.`)
console.log(
  '  next: pnpm dlx @tailwindcss/cli@4 -i docs/uikit.input.css -o docs/uikit.css --minify',
)
