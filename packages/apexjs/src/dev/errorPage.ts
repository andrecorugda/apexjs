import { existsSync, readFileSync } from 'node:fs'
import type { RouteDef } from '../routing/router.js'

// Beautiful dev-time error + 404 pages, in the Apex palette. Self-contained
// (inline CSS), theme-aware, with a code frame around the failing line.

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;'))
}

interface Frame {
  file: string
  line: number
  col: number
}

/** Pull the first stack frame that points at a real file on disk. */
function firstFileFrame(stack: string, root: string): Frame | undefined {
  const re = /(?:file:\/\/\/?)?((?:[A-Za-z]:[\\/]|\/)[^\s():]+):(\d+):(\d+)/g
  let m: RegExpExecArray | null
  const frames: Frame[] = []
  while ((m = re.exec(stack))) {
    const raw = m[1]
    if (!raw) continue
    if (/^[A-Za-z]:[\\/]/.test(raw) === false && !raw.startsWith('/')) continue
    const file = raw.replace(/\//g, process.platform === 'win32' ? '\\' : '/')
    if (existsSync(file) && !file.includes('node_modules')) {
      frames.push({ file, line: Number(m[2] ?? 0), col: Number(m[3] ?? 0) })
    }
  }
  // Prefer a frame inside the project root, else the first real file.
  return frames.find((f) => f.file.startsWith(root)) ?? frames[0]
}

/** Build a ±3-line code frame around `frame.line`, highlighting the failing line. */
function codeFrame(frame: Frame): string {
  let lines: string[]
  try {
    lines = readFileSync(frame.file, 'utf8').split('\n')
  } catch {
    return ''
  }
  const start = Math.max(0, frame.line - 4)
  const end = Math.min(lines.length, frame.line + 3)
  const rows: string[] = []
  for (let i = start; i < end; i++) {
    const n = i + 1
    const active = n === frame.line
    const num = String(n).padStart(4, ' ')
    rows.push(
      `<div class="cf-row${active ? ' active' : ''}"><span class="cf-num">${num}</span><span class="cf-code">${esc(lines[i] || '')}</span></div>`,
    )
  }
  return `<div class="frame"><div class="frame-file">${esc(frame.file)}<span class="frame-pos">:${frame.line}:${frame.col}</span></div><pre class="cf">${rows.join('')}</pre></div>`
}

const SHELL_CSS = `
:root{color-scheme:dark light}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:#0a0e1a;color:#f4f7ff;
  font:15px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  display:flex;align-items:flex-start;justify-content:center;padding:clamp(1.5rem,6vh,5rem) 1.25rem}
@media(prefers-color-scheme:light){body{background:#f4f7ff;color:#0a0e1a}}
.wrap{width:100%;max-width:860px}
.brand{display:flex;align-items:center;gap:.55rem;font-weight:600;letter-spacing:-.01em;margin-bottom:1.6rem}
.mark{width:20px;height:20px}
.pill{font-size:.8rem;font-weight:600;padding:.15rem .6rem;border-radius:999px;margin-left:.4rem}
.pill.err{color:#fb7185;background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.35)}
.pill.nf{color:#818cf8;background:rgba(129,140,248,.12);border:1px solid rgba(129,140,248,.35)}
.kind{font:600 .95rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#fb7185;margin:0 0 .5rem}
.kind.nf{color:#818cf8}
h1{font-size:clamp(1.4rem,3.2vw,2rem);line-height:1.2;letter-spacing:-.02em;margin:0 0 .7rem;word-break:break-word}
.sub{color:#9aa6c4;margin:0 0 1.8rem}
.sub code{background:rgba(130,140,200,.14);border-radius:.35rem;padding:.05rem .35rem;font-size:.9em}
.frame{border:1px solid rgba(130,140,200,.18);border-radius:12px;overflow:hidden;margin:0 0 1.4rem;background:#11172b}
@media(prefers-color-scheme:light){.frame{background:#fff}}
.frame-file{font:.8rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#9aa6c4;padding:.7rem .9rem;border-bottom:1px solid rgba(130,140,200,.18);overflow-x:auto;white-space:nowrap}
.frame-pos{color:#fb7185}
.cf{margin:0;padding:.6rem 0;overflow-x:auto;font:.82rem/1.7 ui-monospace,SFMono-Regular,Menlo,monospace}
.cf-row{display:flex;padding:0 .9rem;white-space:pre}
.cf-row.active{background:rgba(244,63,94,.12);box-shadow:inset 3px 0 0 #f43f5e}
.cf-num{color:#5b6890;-webkit-user-select:none;user-select:none;padding-right:1.1rem;text-align:right}
.cf-row.active .cf-num{color:#fb7185}
.cf-code{color:#f4f7ff}
@media(prefers-color-scheme:light){.cf-code{color:#0a0e1a}}
details{border:1px solid rgba(130,140,200,.18);border-radius:12px;background:#11172b;overflow:hidden}
@media(prefers-color-scheme:light){details{background:#fff}}
summary{cursor:pointer;padding:.7rem .9rem;font-size:.85rem;color:#9aa6c4;user-select:none}
summary:hover{color:#f4f7ff}
@media(prefers-color-scheme:light){summary:hover{color:#0a0e1a}}
.stack{margin:0;padding:0 .9rem 1rem;font:.78rem/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;color:#9aa6c4;overflow-x:auto;white-space:pre-wrap;word-break:break-word}
.routes{list-style:none;padding:0;margin:0 0 1.4rem;display:flex;flex-wrap:wrap;gap:.5rem}
.routes li{font:.85rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#818cf8;background:rgba(129,140,248,.1);border:1px solid rgba(129,140,248,.25);border-radius:.45rem;padding:.35rem .6rem}
.foot{margin-top:1.8rem;color:#5b6890;font-size:.82rem}
`

const MARK = `<svg class="mark" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs><path d="M32 7 L32 35 L20 56 L4 56 Z" fill="url(#g)"/><path d="M32 7 L60 56 L44 56 L32 35 Z" fill="#6366f1"/></svg>`

function page(title: string, bodyInner: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(title)}</title><style>${SHELL_CSS}</style></head><body><div class="wrap">${bodyInner}</div></body></html>`
}

/** Beautiful dev error page: error kind + message, a code frame, and the full stack. */
export function renderErrorPage(error: Error, opts: { url: string; root: string }): string {
  const kind = error.name || 'Error'
  const message = error.message || String(error)
  const stack = error.stack || ''
  const frame = stack ? firstFileFrame(stack, opts.root) : undefined
  const frameHtml = frame ? codeFrame(frame) : ''
  const body = `
    <div class="brand">${MARK} Apex JS <span class="pill err">Dev error</span></div>
    <p class="kind">${esc(kind)}</p>
    <h1>${esc(message)}</h1>
    <p class="sub">While rendering <code>${esc(opts.url)}</code></p>
    ${frameHtml}
    <details${frameHtml ? '' : ' open'}><summary>Stack trace</summary><pre class="stack">${esc(stack)}</pre></details>
    <p class="foot">Fix the error and save — this page reloads automatically.</p>`
  return page(`${kind} — Apex JS`, body)
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
