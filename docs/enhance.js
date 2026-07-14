// Progressive enhancement for every code block on the site: a line-number
// gutter (like the editor) and a one-click Copy button. Purely additive —
// runs on load, wraps each <pre> and never touches the interactive editor.
;(() => {
  const COPY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>'

  const enhanceOne = (pre) => {
    if (pre.dataset.enhanced) return
    if (pre.closest('.ax-ide')) return // skip the live, interactive editor
    const code = pre.querySelector('code') || pre

    // Line count + copy text: prefer explicit .line spans, else split on \n.
    const lineEls = code.querySelectorAll('.line')
    let raw
    let lines
    if (lineEls.length) {
      raw = Array.prototype.map.call(lineEls, (l) => l.textContent).join('\n')
      lines = lineEls.length
    } else {
      raw = code.textContent.replace(/\n$/, '')
      lines = raw.split('\n').length
    }
    pre.dataset.enhanced = '1'

    const cb = document.createElement('div')
    cb.className = 'cb'
    const top = document.createElement('div')
    top.className = 'cb-top'
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'cb-copy'
    btn.innerHTML = `${COPY}<span>Copy</span>`
    top.appendChild(btn)

    const body = document.createElement('div')
    body.className = 'cb-body'
    const gutter = document.createElement('div')
    gutter.className = 'cb-gutter'
    gutter.setAttribute('aria-hidden', 'true')
    let g = ''
    for (let i = 1; i <= lines; i++) g += i + (i < lines ? '\n' : '')
    gutter.textContent = g

    pre.parentNode.insertBefore(cb, pre)
    body.appendChild(gutter)
    body.appendChild(pre)
    cb.appendChild(top)
    cb.appendChild(body)

    const flash = () => {
      btn.classList.add('ok')
      const s = btn.querySelector('span')
      const prev = s.textContent
      s.textContent = 'Copied'
      setTimeout(() => {
        btn.classList.remove('ok')
        s.textContent = prev
      }, 1400)
    }
    const fallback = () => {
      const t = document.createElement('textarea')
      t.value = raw
      t.style.position = 'fixed'
      t.style.opacity = '0'
      document.body.appendChild(t)
      t.select()
      try {
        document.execCommand('copy')
      } catch (_e) {}
      document.body.removeChild(t)
      flash()
    }
    btn.addEventListener('click', () => {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(raw).then(flash, fallback)
      } else {
        fallback()
      }
    })
  }

  const enhance = () => {
    for (const pre of document.querySelectorAll('pre')) enhanceOne(pre)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhance)
  } else {
    enhance()
  }
})()

// Ko-fi floating support button — a small coffee icon, bottom-right, site-wide.
// (Ko-fi's own overlay widget renders oversized + off-screen on mobile and can't
// be resized from outside its iframe, so we use a clean, fully-controlled button.)
;(() => {
  const a = document.createElement('a')
  a.className = 'kofi-float'
  a.href = 'https://ko-fi.com/G7S722N0L8'
  a.target = '_blank'
  a.rel = 'noopener'
  a.setAttribute('aria-label', 'Support me on Ko-fi')
  a.title = 'Support me on Ko-fi'
  a.innerHTML = '<img src="https://storage.ko-fi.com/cdn/cup-border.png" alt="" width="30" height="30" />'
  document.body.appendChild(a)
})()

// Docs mobile drawer — on small screens the sidebar slides in over the content
// instead of stacking above it, so you never scroll back up to navigate. Opened
// by a burger in the sticky navbar (left of the brand); the drawer has its own
// sticky header with a back button, and a scrollable body. Desktop is untouched
// (the burger, drawer header, and scrim are CSS-hidden there).
;(() => {
  const sidebar = document.querySelector('.docs-sidebar')
  if (!sidebar) return

  // 1) Burger in the sticky navbar, before the brand.
  const bar = document.querySelector('.site-header .bar')
  const burger = document.createElement('button')
  burger.className = 'docs-burger'
  burger.type = 'button'
  burger.setAttribute('aria-label', 'Open contents')
  burger.setAttribute('aria-expanded', 'false')
  burger.innerHTML =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>'
  if (bar) bar.insertBefore(burger, bar.firstChild)

  // 2) Give the drawer a sticky header (back button + title) and a scrollable body.
  const head = document.createElement('div')
  head.className = 'docs-drawer-head'
  head.innerHTML =
    '<button type="button" class="docs-drawer-close" aria-label="Close contents"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button><span class="docs-drawer-title">Contents</span>'
  const body = document.createElement('div')
  body.className = 'docs-drawer-body'
  while (sidebar.firstChild) body.appendChild(sidebar.firstChild)
  sidebar.appendChild(head)
  sidebar.appendChild(body)

  // 3) Backdrop + open/close wiring.
  const scrim = document.createElement('div')
  scrim.className = 'docs-scrim'
  const open = () => {
    sidebar.classList.add('open')
    scrim.classList.add('show')
    burger.setAttribute('aria-expanded', 'true')
  }
  const close = () => {
    sidebar.classList.remove('open')
    scrim.classList.remove('show')
    burger.setAttribute('aria-expanded', 'false')
  }
  burger.addEventListener('click', () =>
    sidebar.classList.contains('open') ? close() : open(),
  )
  head.querySelector('.docs-drawer-close').addEventListener('click', close)
  scrim.addEventListener('click', close)
  // Tapping a nav link navigates → close the drawer so the reader lands on content.
  body.addEventListener('click', (e) => {
    if (e.target.closest('a')) close()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close()
  })

  document.body.appendChild(scrim)
})()

// On-device mobile keynote — the swipeable phone (splash → app → how it works).
// Drag/swipe, dots, arrows, or ← → keys; the caption tracks the active screen.
;(() => {
  const root = document.getElementById('apexPhone')
  if (!root) return
  const track = root.querySelector('[data-phone-track]')
  const pages = track ? track.children : null
  if (!track || !pages || !pages.length) return
  const capEl = root.querySelector('[data-phone-cap]')
  const dotsEl = root.querySelector('[data-phone-dots]')
  const splash = root.querySelector('[data-phone-splash]')
  const n = pages.length
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const captions = [
    ['01', 'Cold-starts offline — no server to reach.'],
    ['02', 'Your app, server-rendered on the device.'],
    ['03', 'The whole server runs inside the phone.'],
  ]
  let i = 0

  for (let d = 0; d < n; d++) {
    const b = document.createElement('button')
    b.className = 'dot'
    b.type = 'button'
    b.setAttribute('role', 'tab')
    b.setAttribute('aria-label', 'Screen ' + (d + 1))
    b.dataset.i = String(d)
    dotsEl.appendChild(b)
  }
  const dots = dotsEl.children

  const render = (animateSplash) => {
    track.style.transform = 'translateX(' + -i * 100 + '%)'
    const c = captions[i] || ['', '']
    capEl.innerHTML = '<span class="n">' + c[0] + '</span><span class="t">' + c[1] + '</span>'
    for (let k = 0; k < n; k++) dots[k].classList.toggle('on', k === i)
    if (i === 0 && animateSplash && splash && !reduce) {
      splash.classList.remove('on')
      void splash.offsetWidth
      splash.classList.add('on')
    }
  }
  const go = (to, animate) => {
    i = ((to % n) + n) % n
    render(animate !== false)
  }

  dotsEl.addEventListener('click', (e) => {
    const t = e.target.closest('.dot')
    if (t) go(+t.dataset.i)
  })
  root.querySelector('[data-phone-prev]').addEventListener('click', () => go(i - 1))
  root.querySelector('[data-phone-next]').addEventListener('click', () => go(i + 1))
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(i - 1)
    else if (e.key === 'ArrowRight') go(i + 1)
  })

  // drag / swipe
  let startX = 0, dx = 0, dragging = false, w = 0
  const down = (x) => { dragging = true; startX = x; w = track.offsetWidth; track.classList.add('dragging') }
  const move = (x) => {
    if (!dragging) return
    dx = x - startX
    track.style.transform = 'translateX(' + (-i * 100 + (dx / w) * 100) + '%)'
  }
  const up = () => {
    if (!dragging) return
    dragging = false
    track.classList.remove('dragging')
    if (Math.abs(dx) > w * 0.18) go(i + (dx < 0 ? 1 : -1))
    else render(false)
    dx = 0
  }
  track.addEventListener('touchstart', (e) => down(e.touches[0].clientX), { passive: true })
  track.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true })
  track.addEventListener('touchend', up)
  track.addEventListener('mousedown', (e) => { e.preventDefault(); down(e.clientX) })
  window.addEventListener('mousemove', (e) => move(e.clientX))
  window.addEventListener('mouseup', up)

  render(true)
  // gentle auto-boot once (splash → app), like a real launch
  if (!reduce) setTimeout(() => { if (i === 0) go(1) }, 2600)
})()
