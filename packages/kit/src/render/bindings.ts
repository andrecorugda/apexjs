import { evaluate } from './evaluator.js'
import type { ScopeLayer } from './scope.js'

// HTML boolean attributes: present when truthy, absent when falsy.
const BOOLEAN_ATTRS = new Set([
  'disabled',
  'checked',
  'selected',
  'readonly',
  'required',
  'multiple',
  'hidden',
  'open',
  'autofocus',
  'novalidate',
  'formnovalidate',
])

type El = {
  getAttribute(name: string): string | null
  setAttribute(name: string, value: string): void
  removeAttribute(name: string): void
}

/** Merge an evaluated `:class` value into the element's existing class list. */
export function applyClassBinding(el: El, value: unknown): void {
  const existing = (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)
  const set = new Set(existing)
  collectClasses(value, set)
  const next = [...set].join(' ')
  if (next) el.setAttribute('class', next)
  else el.removeAttribute('class')
}

function collectClasses(value: unknown, set: Set<string>): void {
  if (!value) return
  if (typeof value === 'string') {
    for (const t of value.split(/\s+/).filter(Boolean)) set.add(t)
  } else if (Array.isArray(value)) {
    for (const v of value) collectClasses(v, set)
  } else if (typeof value === 'object') {
    for (const [key, on] of Object.entries(value)) {
      if (on) for (const t of key.split(/\s+/).filter(Boolean)) set.add(t)
      else for (const t of key.split(/\s+/).filter(Boolean)) set.delete(t)
    }
  }
}

/** Merge an evaluated `:style` value into the element's inline style. */
export function applyStyleBinding(el: El, value: unknown): void {
  if (!value) return
  const existing = el.getAttribute('style') ?? ''
  let addition = ''
  if (typeof value === 'string') {
    addition = value
  } else if (typeof value === 'object') {
    addition = Object.entries(value)
      .filter(([, v]) => v != null && v !== false)
      .map(([k, v]) => `${camelToKebab(k)}: ${String(v)}`)
      .join('; ')
  }
  if (!addition) return
  const sep = existing && !existing.trim().endsWith(';') ? '; ' : existing ? ' ' : ''
  el.setAttribute('style', `${existing}${sep}${addition}`.trim())
}

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
}

/** Apply a generic `:attr` / `x-bind:attr` binding. */
export function applyAttrBinding(el: El, attr: string, value: unknown): void {
  if (attr === 'class') return applyClassBinding(el, value)
  if (attr === 'style') return applyStyleBinding(el, value)

  if (BOOLEAN_ATTRS.has(attr)) {
    if (value) el.setAttribute(attr, '')
    else el.removeAttribute(attr)
    return
  }
  if (value == null || value === false) {
    el.removeAttribute(attr)
    return
  }
  el.setAttribute(attr, String(value))
}

/**
 * Resolve a directive attribute name to a normalized binding.
 * Returns null for directives handled elsewhere or ignored during SSR.
 */
export function resolveBindTarget(attrName: string): string | null {
  if (attrName.startsWith(':')) return attrName.slice(1)
  if (attrName.startsWith('x-bind:')) return attrName.slice('x-bind:'.length)
  return null
}

/** Evaluate the given expression and apply as a bound attribute. */
export function applyBinding(
  el: El,
  target: string,
  expression: string,
  layers: ScopeLayer[],
): void {
  applyAttrBinding(el, target, evaluate(expression, layers))
}
