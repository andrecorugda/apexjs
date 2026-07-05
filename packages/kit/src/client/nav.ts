/**
 * @apex-stack/kit/client — client-side navigation (SPA layer over SSR pages).
 *
 * Apex renders every page to full HTML on the server. This runtime turns
 * same-origin link clicks into in-place swaps instead of full document loads:
 * fetch the target page's HTML, adopt its `[data-apex-root]` region, merge the
 * `head()` tags, register the incoming page's Alpine factory, and re-init Alpine
 * on the new subtree — all without a reload, so shared runtime (Alpine, stores,
 * this nav layer) stays alive between pages.
 *
 * It degrades safely: anything it can't handle cleanly (cross-origin, downloads,
 * modified clicks, non-OK responses, missing swap region) falls back to a real
 * browser navigation.
 *
 * Extras (opt-in via installNav options): a top progress bar, a `loading.alpine`
 * boundary shown on slow navs, and hover/viewport prefetching.
 */
import { removeSsrClones } from './runtime.js'

export interface NavOptions {
  /** Prefetch pages on link hover / viewport entry (default true). */
  prefetch?: boolean
  /** Show the top progress bar during navigation (default true). */
  progress?: boolean
}

const ROOT = '[data-apex-root]'
const STATE = 'script[data-apex-state]'
const HEAD = '[data-apex-head]'
const MODULE_META = 'meta[name="apex:page-module"]'
const LOADING = 'template[data-apex-loading]'
const PREFETCH_MAX = 8

let controller: AbortController | null = null
const prefetchCache = new Map<string, Promise<string | null>>()

/** Is this an in-app navigation we should intercept? */
function interceptable(a: HTMLAnchorElement, e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
    return false
  if (a.target && a.target !== '_self') return false
  if (a.hasAttribute('download') || a.hasAttribute('data-apex-no-nav')) return false
  const rel = a.getAttribute('rel')
  if (rel && /\bexternal\b/.test(rel)) return false
  const href = a.getAttribute('href')
  if (!href || href.startsWith('#')) return false
  const url = new URL(a.href, location.href)
  if (url.origin !== location.origin) return false
  // Same path + search, only the hash differs → let the browser handle the jump.
  if (url.pathname === location.pathname && url.search === location.search && url.hash) return false
  return true
}

function currentRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>(ROOT)
}

/** Fetch a page's HTML. Returns null on any non-HTML / error response. */
async function fetchPage(url: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'X-Apex-Nav': '1' }, signal })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('text/html')) return null
    return await res.text()
  } catch {
    return null
  }
}

// ── Progress bar ────────────────────────────────────────────────────────────
let bar: HTMLElement | null = null

function ensureBar(): HTMLElement {
  if (bar) return bar
  bar = document.createElement('div')
  bar.setAttribute('data-apex-progress', '')
  Object.assign(bar.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    height: '3px',
    width: '0',
    zIndex: '2147483647',
    background: 'currentColor',
    color: 'var(--color-primary, #6366f1)',
    opacity: '0',
    transition: 'width 200ms ease, opacity 300ms ease',
    pointerEvents: 'none',
  })
  document.body.appendChild(bar)
  return bar
}

function startBar(): void {
  const b = ensureBar()
  b.style.transition = 'none'
  b.style.width = '0'
  b.style.opacity = '1'
  // Force reflow so the reset applies before we animate.
  void b.offsetWidth
  b.style.transition = 'width 200ms ease, opacity 300ms ease'
  b.style.width = '80%'
}

function finishBar(): void {
  if (!bar) return
  bar.style.width = '100%'
  setTimeout(() => {
    if (bar) {
      bar.style.opacity = '0'
      bar.style.width = '0'
    }
  }, 200)
}

// ── Loading boundary ──────────────────────────────────────────────────────────
let loadingTimer: ReturnType<typeof setTimeout> | null = null

/** Show `loading.alpine` content in the swap region if the nav is slow. */
function armLoadingBoundary(): void {
  const tpl = document.querySelector<HTMLTemplateElement>(LOADING)
  const root = currentRoot()
  if (!tpl || !root) return
  loadingTimer = setTimeout(() => {
    const Alpine = window.Alpine
    const frag = tpl.content.cloneNode(true)
    if (Alpine) {
      Alpine.mutateDom(() => {
        Alpine.destroyTree(root)
        root.replaceChildren(frag)
      })
      Alpine.initTree(root)
    } else {
      root.replaceChildren(frag)
    }
  }, 150)
}

function disarmLoadingBoundary(): void {
  if (loadingTimer) clearTimeout(loadingTimer)
  loadingTimer = null
}

// ── Core navigation ───────────────────────────────────────────────────────────

/** Import the incoming page's component module so its Alpine factory registers. */
async function registerIncoming(doc: Document): Promise<void> {
  const meta = doc.querySelector<HTMLMetaElement>(MODULE_META)
  const spec = meta?.content
  if (!spec) return
  try {
    await import(/* @vite-ignore */ new URL(spec, location.href).href)
  } catch {
    // Registration failed — the page will render but not hydrate; the caller
    // still swaps so navigation isn't blocked. A hard reload would recover.
  }
}

/** Merge the incoming document's managed <head> tags + title into the live head. */
function mergeHead(doc: Document): void {
  document.title = doc.title
  for (const el of document.head.querySelectorAll(HEAD)) el.remove()
  const frag = document.createDocumentFragment()
  for (const el of doc.head.querySelectorAll(HEAD)) frag.appendChild(document.importNode(el, true))
  document.head.appendChild(frag)
}

/** Replace the page state islands with the incoming ones (so readState is fresh). */
function swapStateIslands(doc: Document): void {
  for (const el of document.querySelectorAll(STATE)) el.remove()
  for (const el of doc.querySelectorAll(STATE)) {
    document.body.appendChild(document.importNode(el, true))
  }
}

/** Perform the DOM swap + Alpine re-init for a freshly fetched document. */
async function swap(html: string): Promise<boolean> {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const incoming = doc.querySelector<HTMLElement>(ROOT)
  const oldRoot = currentRoot()
  if (!incoming || !oldRoot) return false // shape we don't recognise → hard nav

  await registerIncoming(doc)
  mergeHead(doc)
  swapStateIslands(doc)

  const adopted = document.importNode(incoming, true)
  // Drop server-rendered x-for/x-if clones so Alpine recreates them cleanly
  // (same reason the initial-load runtime does, but scoped to the new subtree).
  removeSsrClones(adopted)

  const Alpine = window.Alpine
  if (Alpine) {
    Alpine.mutateDom(() => {
      Alpine.destroyTree(oldRoot)
      oldRoot.replaceWith(adopted)
    })
    Alpine.initTree(adopted)
  } else {
    oldRoot.replaceWith(adopted)
  }
  return true
}

/** Save the current scroll position onto the active history entry. */
function saveScroll(): void {
  try {
    history.replaceState({ ...history.state, apexScroll: window.scrollY }, '')
  } catch {
    // history.state not settable (rare) — scroll restoration is best-effort.
  }
}

function focusMain(): void {
  const target = document.querySelector<HTMLElement>('main, [data-apex-root] h1, [data-apex-root]')
  if (!target) return
  const prev = target.getAttribute('tabindex')
  target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
  if (prev === null) target.removeAttribute('tabindex')
}

interface NavIntent {
  push?: boolean
  scroll?: number | null
}

async function navigate(rawUrl: string, intent: NavIntent = {}): Promise<void> {
  const url = new URL(rawUrl, location.href)
  const { push = true } = intent

  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal

  if (push) saveScroll()
  startBar()
  armLoadingBoundary()

  const cached = prefetchCache.get(url.href)
  const html = cached ? await cached : await fetchPage(url.href, signal)
  if (signal.aborted) return

  disarmLoadingBoundary()

  if (html == null) {
    // Couldn't fetch/parse (offline, 404, 500, redirect to another origin) —
    // hand off to the browser so it shows the real response.
    location.assign(url.href)
    return
  }

  const ok = await swap(html)
  if (!ok) {
    location.assign(url.href)
    return
  }

  if (push) history.pushState({ apexScroll: 0 }, '', url.href)
  if (intent.scroll != null) window.scrollTo(0, intent.scroll)
  else if (url.hash) document.querySelector(url.hash)?.scrollIntoView()
  else window.scrollTo(0, 0)
  focusMain()
  finishBar()
}

// ── Prefetch ──────────────────────────────────────────────────────────────────
function prefetch(url: string): void {
  const href = new URL(url, location.href).href
  if (prefetchCache.has(href) || href === location.href) return
  if (prefetchCache.size >= PREFETCH_MAX) {
    const first = prefetchCache.keys().next().value
    if (first) prefetchCache.delete(first)
  }
  prefetchCache.set(href, fetchPage(href))
}

function anchorFrom(target: EventTarget | null): HTMLAnchorElement | null {
  const el = target as Element | null
  return el?.closest?.('a[href]') ?? null
}

// ── Install ───────────────────────────────────────────────────────────────────

/**
 * Wire up client-side navigation. Idempotent — safe to call once from the shell
 * boot. No-op in non-browser environments.
 */
export function installNav(options: NavOptions = {}): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (window.__apexNav) return
  window.__apexNav = true
  const { prefetch: doPrefetch = true, progress = true } = options

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  history.replaceState({ ...history.state, apexScroll: window.scrollY }, '')

  document.addEventListener('click', (e) => {
    const a = anchorFrom(e.target)
    if (!a || !interceptable(a, e)) return
    e.preventDefault()
    void navigate(a.href)
  })

  window.addEventListener('popstate', (e) => {
    const scroll = (e.state?.apexScroll as number | undefined) ?? 0
    void navigate(location.href, { push: false, scroll })
  })

  if (doPrefetch) {
    const maybePrefetch = (target: EventTarget | null) => {
      const a = anchorFrom(target)
      if (!a || a.hasAttribute('data-apex-no-prefetch')) return
      const url = new URL(a.href, location.href)
      if (url.origin === location.origin && !a.hasAttribute('download')) prefetch(url.href)
    }
    document.addEventListener('mouseover', (e) => maybePrefetch(e.target), { passive: true })
    document.addEventListener('focusin', (e) => maybePrefetch(e.target))
    document.addEventListener('touchstart', (e) => maybePrefetch(e.target), { passive: true })
  }

  if (!progress && bar) bar.remove()
}
