/**
 * @apex-stack/kit/client — the tiny browser runtime.
 *
 * Two jobs, both performed synchronously inside the `alpine:init` event (which
 * fires during Alpine.start(), before Alpine walks the DOM):
 *
 *  1. Register each component's `Alpine.data` factory, merging the authored
 *     x-data defaults with the server's loader state (loader wins) — the exact
 *     same merge order the server used, so hydration is value-identical.
 *
 *  2. Remove server-rendered `[data-apex-ssr]` clones (x-for / x-if output) so
 *     Alpine recreates them cleanly on its first synchronous pass. Because the
 *     removal and Alpine's re-insertion happen in the same task before paint,
 *     there is no flash.
 */
import { parse } from 'devalue'

type Factory = () => Record<string, unknown>

const registry = new Map<string, Factory>()
let armed = false

declare global {
  interface Window {
    Alpine?: {
      data(name: string, factory: () => Record<string, unknown>): void
    }
  }
}

/** Register a component factory. Called by generated per-component client modules. */
export function registerApexComponent(id: string, factory: Factory): void {
  registry.set(id, factory)
  arm()
}

function readState(id: string): Record<string, unknown> {
  const el = document.querySelector(`script[type="application/json"][data-apex-state="${id}"]`)
  if (!el?.textContent) return {}
  try {
    return parse(el.textContent) as Record<string, unknown>
  } catch {
    return {}
  }
}

function arm(): void {
  if (armed) return
  armed = true
  document.addEventListener('alpine:init', onAlpineInit)
}

function onAlpineInit(): void {
  const Alpine = window.Alpine
  if (Alpine) {
    for (const [id, factory] of registry) {
      Alpine.data(`apex_${id}`, () => {
        // Object.assign (not spread) so getters/methods from the factory —
        // e.g. a composable's `get double()` — survive; loader state overlays
        // plain data values on top (loader wins), same order the server used.
        const base = factory()
        const state = readState(id)
        return Object.keys(state).length ? Object.assign(base, state) : base
      })
    }
  }
  removeSsrClones()
}

function removeSsrClones(): void {
  const clones = document.querySelectorAll('[data-apex-ssr]')
  for (let i = 0; i < clones.length; i++) clones[i]?.remove()
}
