import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import type { RouteDef } from '../routing/router.js'

// Beautiful dev-time error + 404 pages, in the Apex palette. Self-contained
// (inline CSS/JS), theme-aware. The error page is Sentry-style: expandable stack
// frames with code context, a raw-stack toggle, a project file tree with the
// error's origin marked, and "open in editor" links (dev server /__apex_open).

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;',
  )
}
const escAttr = esc

interface Frame {
  func: string
  file: string
  line: number
  col: number
  app: boolean
}

/** Parse every real-file frame out of an error stack. */
function parseFrames(stack: string, root: string): Frame[] {
  const frames: Frame[] = []
  const re =
    /^\s*at\s+(?:(.*?)\s+\()?(?:file:\/\/\/?)?((?:[A-Za-z]:[\\/]|\/)[^\s():]+):(\d+):(\d+)\)?\s*$/
  for (const line of stack.split('\n')) {
    const m = line.match(re)
    if (!m || !m[2]) continue
    const file = m[2].replace(/[\\/]/g, sep)
    if (!existsSync(file)) continue
    frames.push({
      func: m[1]?.trim() || '<anonymous>',
      file,
      line: Number(m[3] ?? 0),
      col: Number(m[4] ?? 0),
      app: file.startsWith(root) && !file.includes(`${sep}node_modules${sep}`),
    })
  }
  return frames
}

/** A ±4-line code frame around `line`, highlighting the failing line. */
function codeContext(file: string, line: number): string {
  let lines: string[]
  try {
    lines = readFileSync(file, 'utf8').split('\n')
  } catch {
    return ''
  }
  const start = Math.max(0, line - 5)
  const end = Math.min(lines.length, line + 4)
  const rows: string[] = []
  for (let i = start; i < end; i++) {
    const n = i + 1
    const active = n === line
    rows.push(
      `<div class="cf-row${active ? ' active' : ''}"><span class="cf-num">${String(n).padStart(4, ' ')}</span><span class="cf-code">${esc(lines[i] || '')}</span></div>`,
    )
  }
  return `<pre class="cf">${rows.join('')}</pre>`
}

const OPEN_ICON =
  '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6.5 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-3M9 2h5v5M13.5 2.5 7 9"/></svg>'

function openAttrs(f: Frame): string {
  return `data-file="${escAttr(f.file)}" data-line="${f.line}" data-col="${f.col}"`
}

/** Render one stack frame as an expandable card. App frames get code context. */
function frameCard(f: Frame, root: string): string {
  const loc = f.app ? relative(root, f.file).replace(/\\/g, '/') : f.file.replace(/\\/g, '/')
  const ctx = f.app ? codeContext(f.file, f.line) : ''
  const openBtn = `<button class="fr-open" ${openAttrs(f)} title="Open in editor">${OPEN_ICON}</button>`
  return `<details class="fr${f.app ? ' app' : ''}"${f.app ? ' open' : ''}>
    <summary><span class="fr-fn">${esc(f.func)}</span><span class="fr-loc" ${openAttrs(f)}>${esc(loc)}<span class="fr-pos">:${f.line}:${f.col}</span></span>${f.app ? openBtn : ''}</summary>
    ${ctx}
  </details>`
}

const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  '.git',
  '.vite',
  '.cache',
  '.turbo',
  '.next',
])
const FOLDER_ICON =
  '<svg class="ti" viewBox="0 0 16 16" fill="#f59e0b" aria-hidden="true"><path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h3l1.3 1.5H13A1.5 1.5 0 0 1 14.5 5v7A1.5 1.5 0 0 1 13 13.5H3A1.5 1.5 0 0 1 1.5 12z"/></svg>'
const EXT_COLOR: Record<string, string> = {
  alpine: '#818cf8',
  ts: '#3b82f6',
  tsx: '#3b82f6',
  js: '#eab308',
  mjs: '#eab308',
  json: '#eab308',
  css: '#22d3ee',
  html: '#f97316',
  svg: '#22d3ee',
  md: '#94a3b8',
}
function fileIcon(name: string): string {
  const ext = name.includes('.') ? (name.split('.').pop() ?? '') : ''
  const c = EXT_COLOR[ext] ?? '#8892b0'
  return `<svg class="ti" viewBox="0 0 16 16" fill="${c}" aria-hidden="true"><path d="M4 1.5h5L12.5 5v9a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V2a.5.5 0 0 1 .5-.5z" opacity=".92"/></svg>`
}

/** A collapsible project file tree; the error's origin file is marked red. */
function fileTree(root: string, errorFile: string | undefined): string {
  const errRel = errorFile ? relative(root, errorFile).replace(/\\/g, '/') : ''
  let count = 0
  const walk = (dir: string, rel: string, depth: number): string => {
    if (count > 600 || depth > 7) return ''
    let entries: import('node:fs').Dirent[]
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return ''
    }
    entries = entries
      .filter((e) => !IGNORE_DIRS.has(e.name) && !e.name.startsWith('.'))
      .sort((a, b) =>
        a.isDirectory() === b.isDirectory()
          ? a.name.localeCompare(b.name)
          : a.isDirectory()
            ? -1
            : 1,
      )
    const items: string[] = []
    for (const e of entries) {
      if (++count > 600) break
      const childRel = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) {
        // Expanded by default so the whole structure is visible at a glance.
        items.push(
          `<details class="tdir" open><summary>${FOLDER_ICON}<span>${esc(e.name)}</span></summary>${walk(join(dir, e.name), childRel, depth + 1)}</details>`,
        )
      } else {
        const isErr = childRel === errRel
        const label = isErr
          ? `<button class="tfile-open" ${errorFile ? `data-file="${escAttr(errorFile)}" data-line="1" data-col="1"` : ''}>${esc(e.name)}</button>`
          : `<span>${esc(e.name)}</span>`
        items.push(`<div class="tfile${isErr ? ' err' : ''}">${fileIcon(e.name)}${label}</div>`)
      }
    }
    return `<div class="tchildren">${items.join('')}</div>`
  }
  return walk(root, '', 0)
}

const SHELL_CSS = `
:root{color-scheme:dark light}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:#0a0e1a;color:#f4f7ff;
  font:15px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:clamp(1.25rem,5vh,3rem) 1.25rem}
@media(prefers-color-scheme:light){body{background:#f4f7ff;color:#0a0e1a}}
.wrap{width:100%;max-width:1120px;margin:0 auto}
.brand{display:flex;align-items:center;gap:.55rem;font-weight:600;margin-bottom:1.4rem}
.mark{width:20px;height:20px}
.pill{font-size:.8rem;font-weight:600;padding:.15rem .6rem;border-radius:999px;margin-left:.4rem}
.pill.err{color:#fb7185;background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.35)}
.pill.nf{color:#818cf8;background:rgba(129,140,248,.12);border:1px solid rgba(129,140,248,.35)}
.kind{font:600 .95rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#fb7185;margin:0 0 .5rem}
.kind.nf{color:#818cf8}
h1{font-size:clamp(1.3rem,3vw,1.9rem);line-height:1.25;letter-spacing:-.02em;margin:0 0 .6rem;word-break:break-word}
.sub{color:#9aa6c4;margin:0 0 1.6rem}
.sub code{background:rgba(130,140,200,.14);border-radius:.35rem;padding:.05rem .35rem;font-size:.9em}
.cols{display:grid;grid-template-columns:minmax(0,1fr);gap:1.4rem}
@media(min-width:900px){.cols{grid-template-columns:minmax(0,1fr) 19rem}}
.col-main{min-width:0}
.tabs{display:flex;gap:.4rem;margin:0 0 .9rem}
.tabs button{font:inherit;font-size:.82rem;font-weight:600;padding:.35rem .8rem;border-radius:.5rem;cursor:pointer;
  color:#9aa6c4;background:transparent;border:1px solid rgba(130,140,200,.22)}
.tabs button.active{color:#0a0e1a;background:#818cf8;border-color:#818cf8}
.fr{border:1px solid rgba(130,140,200,.18);border-radius:10px;overflow:hidden;margin:0 0 .6rem;background:#11172b}
@media(prefers-color-scheme:light){.fr{background:#fff}}
.fr:not(.app){opacity:.62}
.fr summary{cursor:pointer;display:flex;align-items:center;gap:.6rem;padding:.55rem .8rem;font-size:.83rem;list-style:none}
.fr summary::-webkit-details-marker{display:none}
.fr-fn{font:600 .82rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#f4f7ff;flex-shrink:0}
@media(prefers-color-scheme:light){.fr-fn{color:#0a0e1a}}
.fr-loc{font:.78rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#9aa6c4;margin-left:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
.fr.app .fr-loc:hover{color:#818cf8;text-decoration:underline}
.fr-pos{color:#fb7185}
.fr-open{flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;
  border:1px solid rgba(130,140,200,.25);background:transparent;color:#9aa6c4;cursor:pointer}
.fr-open:hover{color:#818cf8;border-color:#818cf8}
.fr-open.ok{color:#22c55e;border-color:#22c55e}
.cf{margin:0;padding:.5rem 0 .6rem;overflow-x:auto;font:.8rem/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;border-top:1px solid rgba(130,140,200,.14)}
.cf-row{display:flex;padding:0 .8rem;white-space:pre}
.cf-row.active{background:rgba(244,63,94,.12);box-shadow:inset 3px 0 0 #f43f5e}
.cf-num{color:#5b6890;user-select:none;padding-right:1rem;text-align:right}
.cf-row.active .cf-num{color:#fb7185}
.cf-code{color:#f4f7ff}
@media(prefers-color-scheme:light){.cf-code{color:#0a0e1a}}
.raw{margin:0;padding:.9rem;border:1px solid rgba(130,140,200,.18);border-radius:10px;background:#11172b;
  font:.78rem/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;color:#9aa6c4;overflow-x:auto;white-space:pre-wrap;word-break:break-word}
@media(prefers-color-scheme:light){.raw{background:#fff}}
.tree{border:1px solid rgba(130,140,200,.18);border-radius:10px;background:#11172b;padding:.5rem;max-height:70vh;overflow:auto;
  font:.8rem/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}
@media(prefers-color-scheme:light){.tree{background:#fff}}
.tree-head{font:600 .72rem/1 system-ui;letter-spacing:.06em;text-transform:uppercase;color:#5b6890;padding:.2rem .3rem .5rem}
.ti{width:14px;height:14px;flex-shrink:0;vertical-align:-2px;margin-right:.35rem}
.tdir>summary{cursor:pointer;display:flex;align-items:center;padding:.12rem .3rem;border-radius:5px;list-style:none;color:#c7d0ea}
.tdir>summary::-webkit-details-marker{display:none}
.tdir>summary:hover{background:rgba(130,140,200,.1)}
@media(prefers-color-scheme:light){.tdir>summary{color:#334}}
.tchildren{padding-left:.85rem;border-left:1px solid rgba(130,140,200,.14);margin-left:.55rem}
.tfile{display:flex;align-items:center;padding:.12rem .3rem;border-radius:5px;color:#9aa6c4}
.tfile.err{color:#fb7185;font-weight:700;background:rgba(244,63,94,.1)}
.tfile-open{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-decoration:underline}
details{border:1px solid rgba(130,140,200,.18);border-radius:12px;background:#11172b}
@media(prefers-color-scheme:light){details{background:#fff}}
.routes{list-style:none;padding:0;margin:0 0 1.4rem;display:flex;flex-wrap:wrap;gap:.5rem}
.routes li{font:.85rem/1 ui-monospace,monospace;color:#818cf8;background:rgba(129,140,248,.1);border:1px solid rgba(129,140,248,.25);border-radius:.45rem;padding:.35rem .6rem}
.foot{margin-top:1.8rem;color:#5b6890;font-size:.82rem}
`

const OPEN_JS = `
document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-file]');
  if (!el) return;
  e.preventDefault(); e.stopPropagation();
  fetch('/__apex_open?file=' + encodeURIComponent(el.dataset.file) + '&line=' + el.dataset.line + '&col=' + el.dataset.col)
    .then(function (r) { if (r.ok && el.classList.contains('fr-open')) { el.classList.add('ok'); setTimeout(function(){el.classList.remove('ok')},1200); } })
    .catch(function(){});
});
var tabs = document.querySelectorAll('.tabs button');
tabs.forEach(function (b) {
  b.addEventListener('click', function () {
    tabs.forEach(function (x) { x.classList.toggle('active', x === b); });
    ['frames','raw'].forEach(function (v) {
      var el = document.getElementById('view-' + v);
      if (el) el.hidden = v !== b.dataset.view;
    });
  });
});
`

const MARK = `<svg class="mark" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs><path d="M32 7 L32 35 L20 56 L4 56 Z" fill="url(#g)"/><path d="M32 7 L60 56 L44 56 L32 35 Z" fill="#6366f1"/></svg>`

function page(title: string, bodyInner: string, script = ''): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(title)}</title><style>${SHELL_CSS}</style></head><body><div class="wrap">${bodyInner}</div>${script ? `<script>${script}</script>` : ''}</body></html>`
}

/** Sentry-style dev error page: frames + code context, raw stack, file tree. */
export function renderErrorPage(error: Error, opts: { url: string; root: string }): string {
  const kind = error.name || 'Error'
  const message = error.message || String(error)
  const stack = error.stack || ''
  const frames = parseFrames(stack, opts.root)

  // Compile / transform errors (e.g. a malformed .alpine) carry the offending
  // file in Vite's `loc`/`id`/`file` even when the stack only points at compiler
  // internals. Surface it as a synthetic top frame so it shows code context and
  // gets marked in the tree.
  const v = error as unknown as {
    loc?: { file?: string; line?: number; column?: number }
    id?: string
    file?: string
  }
  const rawFile = v.loc?.file ?? v.id ?? v.file
  const locFile =
    typeof rawFile === 'string' ? rawFile.replace(/\?.*$/, '').replace(/[\\/]/g, sep) : ''
  let synthetic: Frame | undefined
  if (
    locFile &&
    existsSync(locFile) &&
    locFile.startsWith(opts.root) &&
    !frames.some((f) => f.file === locFile)
  ) {
    synthetic = {
      func: 'compile error',
      file: locFile,
      line: v.loc?.line ?? 1,
      col: v.loc?.column ?? 1,
      app: true,
    }
  }
  const allFrames = synthetic ? [synthetic, ...frames] : frames
  const origin = synthetic ?? frames.find((f) => f.app) ?? frames[0]

  const framesHtml = allFrames.length
    ? allFrames.map((f) => frameCard(f, opts.root)).join('')
    : '<p class="sub">No stack frames available.</p>'

  const body = `
    <div class="brand">${MARK} Apex JS <span class="pill err">Dev error</span></div>
    <p class="kind">${esc(kind)}</p>
    <h1>${esc(message)}</h1>
    <p class="sub">While rendering <code>${esc(opts.url)}</code></p>
    <div class="cols">
      <div class="col-main">
        <div class="tabs">
          <button class="active" data-view="frames">Frames</button>
          <button data-view="raw">Raw</button>
        </div>
        <div id="view-frames">${framesHtml}</div>
        <div id="view-raw" hidden><pre class="raw">${esc(stack)}</pre></div>
      </div>
      <aside class="col-tree" id="view-tree">
        <div class="tree"><div class="tree-head">Project · error origin in red</div>${fileTree(opts.root, origin?.file)}</div>
      </aside>
    </div>
    <p class="foot">Click a frame's ↗ to open it in your editor · fix &amp; save to auto-reload.</p>`
  return page(`${kind} — Apex JS`, body, OPEN_JS)
}

/**
 * Shown when `apex dev` runs in a folder with no `pages/` — usually because the
 * command was run outside an app (e.g. in a parent folder of several apps).
 * Suggests subfolders that ARE Apex apps so the fix is obvious.
 */
export function renderNoProjectPage(root: string): string {
  let apps: string[] = []
  try {
    apps = readdirSync(root, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !IGNORE_DIRS.has(e.name) && !e.name.startsWith('.'))
      .filter((e) => existsSync(join(root, e.name, 'pages', 'index.alpine')))
      .map((e) => e.name)
      .slice(0, 16)
  } catch {
    // best-effort suggestions only
  }
  const suggest = apps.length
    ? `<p class="sub">Did you mean to run it inside one of these apps?</p><ul class="routes">${apps
        .map((a) => `<li>cd ${esc(a)} &amp;&amp; apex dev</li>`)
        .join('')}</ul>`
    : `<p class="sub">Scaffold a new app:</p><ul class="routes"><li>npm create apexjs@latest my-app</li></ul>`
  const body = `
    <div class="brand">${MARK} Apex JS <span class="pill nf">No app here</span></div>
    <p class="kind nf">No pages found</p>
    <h1>This folder isn't an Apex app</h1>
    <p class="sub"><code>apex dev</code> looks for <code>pages/*.alpine</code> in <code>${esc(root)}</code>, but found none — run it from inside your app's folder.</p>
    ${suggest}
    <p class="foot">Every Apex app has a <code>pages/</code> directory with at least <code>pages/index.alpine</code>.</p>`
  return page('No Apex app — Apex JS', body)
}

/** Beautiful 404 page listing the available routes. */
export function renderNotFoundPage(url: string, routes: RouteDef[]): string {
  const list = routes.length
    ? routes.map((r) => `<li>${esc(r.pattern)}</li>`).join('')
    : '<li>no pages yet — add pages/index.alpine</li>'
  const body = `
    <div class="brand">${MARK} Apex JS <span class="pill nf">404</span></div>
    <p class="kind nf">404 — Not found</p>
    <h1>No route matches <code>${esc(url)}</code></h1>
    <p class="sub">These routes are available:</p>
    <ul class="routes">${list}</ul>
    <p class="foot">Add a file under <code>pages/</code> to create a new route.</p>`
  return page('404 — Apex JS', body)
}
