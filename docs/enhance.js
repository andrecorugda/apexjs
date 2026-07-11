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

// Ko-fi floating support button — site-wide (replaces the old top-nav button).
;(() => {
  const s = document.createElement('script')
  s.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'
  s.onload = () => {
    if (!window.kofiWidgetOverlay) return
    window.kofiWidgetOverlay.draw('andrecorugda', {
      type: 'floating-chat',
      'floating-chat.donateButton.text': 'Support me',
      'floating-chat.donateButton.background-color': '#323842',
      'floating-chat.donateButton.text-color': '#fff',
    })
  }
  document.head.appendChild(s)
})()

// Docs mobile drawer — on small screens the sidebar slides in over the content
// (via a bottom-left toggle) instead of stacking above it, so you never scroll
// back up to navigate. Desktop is untouched (toggle + scrim are CSS-hidden there).
;(() => {
  const sidebar = document.querySelector('.docs-sidebar')
  if (!sidebar) return

  const toggle = document.createElement('button')
  toggle.className = 'docs-nav-toggle'
  toggle.type = 'button'
  toggle.setAttribute('aria-label', 'Open contents')
  toggle.setAttribute('aria-expanded', 'false')
  toggle.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg><span>Contents</span>'

  const scrim = document.createElement('div')
  scrim.className = 'docs-scrim'

  const open = () => {
    sidebar.classList.add('open')
    scrim.classList.add('show')
    toggle.setAttribute('aria-expanded', 'true')
  }
  const close = () => {
    sidebar.classList.remove('open')
    scrim.classList.remove('show')
    toggle.setAttribute('aria-expanded', 'false')
  }
  toggle.addEventListener('click', () =>
    sidebar.classList.contains('open') ? close() : open(),
  )
  scrim.addEventListener('click', close)
  // Tapping a nav link navigates → close the drawer so the reader lands on content.
  sidebar.addEventListener('click', (e) => {
    if (e.target.closest('a')) close()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close()
  })

  document.body.appendChild(scrim)
  document.body.appendChild(toggle)
})()
