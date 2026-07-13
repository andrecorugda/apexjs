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
// True once Alpine has started (after `alpine:init`). Registrations that arrive
// after this — i.e. during a client-side navigation — must register live rather
// than wait for an `alpine:init` that will never fire again.
let alpineReady = false

/** The subset of Alpine's global API the Apex runtime + nav layer use. */
export interface AlpineLike {
  data(name: string, factory: () => Record<string, unknown>): void
  initTree(el: Element): void
  destroyTree(el: Element): void
  mutateDom(cb: () => void): void
}

declare global {
  interface Window {
    Alpine?: AlpineLike
    /** Set once installNav() has wired up client-side navigation. */
    __apexNav?: boolean
  }
}

/** The `Alpine.data` factory for a component: authored defaults + loader state (loader wins). */
function componentFactory(id: string, factory: Factory): () => Record<string, unknown> {
  return () => {
    // Object.assign (not spread) so getters/methods from the factory —
    // e.g. a composable's `get double()` — survive; loader state overlays
    // plain data values on top (loader wins), same order the server used.
    const base = factory()
    const state = readState(id)
    return Object.keys(state).length ? Object.assign(base, state) : base
  }
}

/** Register a component factory. Called by generated per-component client modules. */
export function registerApexComponent(id: string, factory: Factory): void {
  registry.set(id, factory)
  if (alpineReady && window.Alpine) {
    // Client-side navigation: Alpine is already running, register immediately.
    window.Alpine.data(`apex_${id}`, componentFactory(id, factory))
  } else {
    arm()
  }
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
      Alpine.data(`apex_${id}`, componentFactory(id, factory))
    }
  }
  removeSsrClones()
  alpineReady = true
}

/**
 * Remove server-rendered `[data-apex-ssr]` clones (x-for / x-if output) so Alpine
 * recreates them cleanly. Scope to `root` during a client-side navigation; on the
 * initial load it clears the whole document.
 */
export function removeSsrClones(root: ParentNode = document): void {
  const clones = root.querySelectorAll('[data-apex-ssr]')
  for (let i = 0; i < clones.length; i++) clones[i]?.remove()
}

export type { ActionOptions, ActionState } from './action.js'
// Form-action sugar (see ./action.ts).
export { createAction } from './action.js'
// Client-side navigation (see ./nav.ts).
export { installNav, type NavOptions } from './nav.js'
// Reactive CRUD data-hook for a model resource (see ./resource.ts).
export type { ResourceClientOptions, ResourceClientState } from './resource.js'
export { createResourceClient } from './resource.js'

const warnedMagics = new Set<string>()

/**
 * Resolve an Alpine magic used to initialize a page's ROOT `x-data`. The root compiles
 * into an `Alpine.data` factory (plain JS), so a bare `$magic` isn't in scope — the
 * working form is the global `Alpine.$magic` (e.g. `@alpinejs/persist`). This returns
 * that global when it exists; when it doesn't (a magic with no global form), it warns
 * ONCE with the fix and returns a no-op, so a page root never crashes. Nested `x-data`
 * (evaluated by Alpine with all magics in scope) is the place for global-less magics.
 * Emitted by the `@apex-stack/vite` compiler for non-core `$magic(…)` calls. See #47.
 */
export function resolveRootMagic(
  name: string,
  alpine: AlpineLike | undefined,
): (...args: unknown[]) => unknown {
  const fn = (alpine as unknown as Record<string, unknown> | undefined)?.[`$${name}`]
  if (typeof fn === 'function') return fn as (...args: unknown[]) => unknown
  if (!warnedMagics.has(name)) {
    warnedMagics.add(name)
    console.warn(
      `[apex] $${name} has no global form (Alpine.$${name}), so it can't initialize a page-root ` +
        `x-data — it evaluates to undefined. Use it in a nested <div x-data="{ … }"> instead. ` +
        `https://apexjs.site/docs/components.html#plugins`,
    )
  }
  return () => undefined
}
