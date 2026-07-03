import { parseHTML } from 'linkedom'
import { applyBinding, resolveBindTarget } from './bindings.js'
import { type ComponentRegistry, rewriteComponentTags } from './components.js'
import { evaluate } from './evaluator.js'
import { parseForExpression, toIterablePairs } from './forExpression.js'
import { createMagics } from './magics.js'
import type { ScopeLayer } from './scope.js'

export interface RenderComponentInput {
  /** The SFC template's inner HTML (the content of the top-level <template>). */
  template: string
  /** The authored root `x-data` expression, if any (from `<template x-data="...">`). */
  rootXData?: string | null
  /** Stable component id, e.g. `c0`. Used for Alpine.data name + state island. */
  componentId: string
  /** Scoped-CSS attribute name, e.g. `data-apex-a1b2c3`. */
  scopeId: string
  /** Loader result — seeds the root scope and is serialized to the state island. */
  loaderData: Record<string, unknown>
  /** Registry of embeddable components (`<Counter/>` → components/Counter.alpine). */
  registry?: ComponentRegistry
  /** Global store initial state keyed by name, exposed as `$store` during SSR. */
  stores?: Record<string, unknown>
}

export interface RenderComponentResult {
  /** Rendered root element as an HTML string. */
  html: string
  /** The merged root data (authored x-data defaults + loader data). */
  rootData: Record<string, unknown>
}

const ELEMENT_NODE = 1

// Directive attributes we consume during SSR (removed handling is per-directive;
// most stay in the output so browser Alpine re-binds).
const SSR_IGNORED_PREFIXES = ['@', 'x-on:']

/**
 * Render a parsed `.alpine` descriptor to hydration-safe HTML against loader data.
 *
 * The SFC's top-level `<template>` is an authoring wrapper: its `x-data`
 * expression supplies component defaults/methods and its children are the actual
 * content. We emit a real root `<div x-data="apex_<id>">` (a `<template>` can't
 * host a live x-data), render its subtree server-side, and leave every behavioral
 * directive attribute in place for Alpine to pick up on boot.
 */
export function renderComponent(input: RenderComponentInput): RenderComponentResult {
  const { template, rootXData, componentId, scopeId, loaderData } = input
  const registry = input.registry ?? {}

  // Rewrite <PascalCase/> component tags before parsing (the DOM lowercases tags).
  const prepared = rewriteComponentTags(template, Object.keys(registry))
  // linkedom parses literally (no HTML5 tree construction), so `document.body`
  // is only populated when given a full <html><body> wrapper.
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${prepared}</body></html>`)
  const body = document.body

  // Root wrapper hosting the component's x-data reference.
  const root = document.createElement('div')
  root.setAttribute('x-data', `apex_${componentId}`)
  root.setAttribute('data-apex-root', componentId)
  while (body.firstChild) root.appendChild(body.firstChild)

  // Merge authored x-data defaults (evaluated) under the loader data.
  const authoredExpr = rootXData ?? undefined
  const authoredDefaults =
    authoredExpr && authoredExpr.trim()
      ? ((evaluate(authoredExpr, [{}]) as Record<string, unknown>) ?? {})
      : {}
  const rootData: Record<string, unknown> = { ...authoredDefaults, ...loaderData }

  const idCounter = { n: 0 }
  const magics = createMagics(root, idCounter, input.stores)
  const layers: ScopeLayer[] = [magics, rootData]

  stampScope(root, scopeId)
  walkChildren(root, layers, scopeId, document, registry)

  return { html: root.outerHTML, rootData }
}

/**
 * SSR-render a template fragment against `data`, without adding a component root
 * wrapper. Nested inline `x-data` islands are evaluated as their own scope layers
 * (so `x-text` etc. inside them resolve). Used by the islands renderer, where the
 * page has many independent interactive regions rather than one component root.
 */
export function renderFragment(
  templateHtml: string,
  data: Record<string, unknown>,
  scopeId: string,
  registry: ComponentRegistry = {},
): string {
  const idCounter = { n: 0 }
  return renderFragmentInternal(
    templateHtml,
    [createMagicsFor(idCounter), data],
    scopeId,
    registry,
  )
}

export type ClientDirective = 'load' | 'idle' | 'visible' | 'none'
const CLIENT_ATTRS: Array<`client:${ClientDirective}`> = [
  'client:load',
  'client:idle',
  'client:visible',
  'client:none',
]

export interface RenderIslandsResult {
  html: string
  /** Number of islands that will hydrate on the client (mode !== 'none'). */
  hydratingCount: number
}

/**
 * Render an islands page: the whole template is SSR'd (static HTML + islands),
 * then every element carrying a `client:*` directive is marked as an island —
 * `x-ignore`d so global Alpine never auto-hydrates it, and tagged with the
 * hydration mode for the lazy client loader to act on. Static content ships no
 * JS; islands hydrate individually on their trigger.
 */
export function renderIslands(
  templateHtml: string,
  data: Record<string, unknown>,
  scopeId: string,
  registry: ComponentRegistry = {},
): RenderIslandsResult {
  const prepared = rewriteComponentTags(templateHtml, Object.keys(registry))
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${prepared}</body></html>`)
  const body = document.body
  const idCounter = { n: 0 }
  const layers: ScopeLayer[] = [createMagics(body, idCounter), data]
  walkChildren(body, layers, scopeId, document, registry)

  let hydratingCount = 0
  let nextId = 0
  for (const el of Array.from(body.querySelectorAll('*')) as AnyEl[]) {
    const attr = CLIENT_ATTRS.find((a) => el.hasAttribute(a))
    if (!attr) continue
    const mode = attr.slice('client:'.length) as ClientDirective
    el.removeAttribute(attr)
    el.setAttribute('data-apex-island', String(nextId++))
    el.setAttribute('data-apex-client', mode)
    // Every island is ignored by global Alpine; the loader removes x-ignore on
    // the specific island it hydrates. `none` islands stay ignored forever.
    el.setAttribute('x-ignore', '')
    if (mode !== 'none') hydratingCount++
  }

  return { html: body.innerHTML, hydratingCount }
}

type AnyEl = any

/** Parse + walk a template fragment with the given scope, returning its innerHTML. */
function renderFragmentInternal(
  templateHtml: string,
  layers: ScopeLayer[],
  scopeId: string,
  registry: ComponentRegistry,
): string {
  const prepared = rewriteComponentTags(templateHtml, Object.keys(registry))
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${prepared}</body></html>`)
  const body = document.body
  walkChildren(body, layers, scopeId, document, registry)
  return body.innerHTML
}

function createMagicsFor(idCounter: { n: number }): ScopeLayer {
  return createMagics(null, idCounter)
}

function walkChildren(
  parent: AnyEl,
  layers: ScopeLayer[],
  scopeId: string,
  document: AnyEl,
  registry: ComponentRegistry,
): void {
  // Snapshot children first — the walk mutates the tree (x-for/x-if insert clones,
  // components get replaced by their rendered output).
  const children = Array.from(parent.childNodes) as AnyEl[]
  for (const node of children) {
    if (node.nodeType !== ELEMENT_NODE) continue
    walkElement(node, layers, scopeId, document, registry)
  }
}

function walkElement(
  el: AnyEl,
  layers: ScopeLayer[],
  scopeId: string,
  document: AnyEl,
  registry: ComponentRegistry,
): void {
  const tag = String(el.tagName).toLowerCase()

  // Component usage (`<Counter/>` was rewritten to <apex-component data-apex-name>).
  if (tag === 'apex-component') {
    renderComponentInstance(el, layers, document, registry)
    return
  }

  // Structural directives live on <template> elements.
  if (tag === 'template') {
    const xFor = el.getAttribute('x-for')
    if (xFor != null) return renderFor(el, xFor, layers, scopeId, document, registry)
    const xIf = el.getAttribute('x-if')
    if (xIf != null) return renderIf(el, xIf, layers, scopeId, document, registry)
    // A plain <template> (no structural directive) is left untouched.
    return
  }

  // x-cloak is obsolete once the server rendered correct content.
  if (el.hasAttribute('x-cloak')) el.removeAttribute('x-cloak')

  // A nested x-data introduces its own scope layer for this subtree.
  let scoped = layers
  const nestedData = el.getAttribute('x-data')
  if (nestedData != null && nestedData.trim()) {
    const obj = (evaluate(nestedData, layers) as Record<string, unknown>) ?? {}
    scoped = [...layers, obj]
  }

  stampScope(el, scopeId)

  // Attribute bindings (:attr / x-bind:attr).
  for (const attr of Array.from(el.attributes) as AnyEl[]) {
    const name = attr.name as string
    if (SSR_IGNORED_PREFIXES.some((p) => name.startsWith(p))) continue
    const target = resolveBindTarget(name)
    if (target) applyBinding(el, target, attr.value, scoped)
  }

  // x-show → inline display:none when falsy.
  const xShow = el.getAttribute('x-show')
  if (xShow != null && !evaluate(xShow, scoped)) {
    const style = el.getAttribute('style') ?? ''
    const sep = style && !style.trim().endsWith(';') ? '; ' : style ? ' ' : ''
    el.setAttribute('style', `${style}${sep}display: none`.trim())
  }

  // x-html / x-text replace content; otherwise recurse into children.
  const xHtml = el.getAttribute('x-html')
  const xText = el.getAttribute('x-text')
  if (xHtml != null) {
    el.innerHTML = String(evaluate(xHtml, scoped) ?? '')
  } else if (xText != null) {
    el.textContent = String(evaluate(xText, scoped) ?? '')
  } else {
    walkChildren(el, scoped, scopeId, document, registry)
  }
}

/**
 * Render an embedded component instance. Props come from the usage attributes
 * (`prop="x"` static, `:prop="expr"` evaluated). The component's authored x-data
 * is evaluated with the props in scope to get the resolved initial data, which is
 * baked onto the wrapper as a JSON literal — so client hydration needs no access
 * to the parent scope or props. A `client:*` directive is forwarded to the wrapper
 * so islands mode can hydrate the component lazily.
 */
function renderComponentInstance(
  el: AnyEl,
  layers: ScopeLayer[],
  document: AnyEl,
  registry: ComponentRegistry,
): void {
  const name = el.getAttribute('data-apex-name') as string
  const entry = registry[name]
  if (!entry) {
    el.replaceWith(document.createComment(` apex: unknown component "${name}" `))
    return
  }

  const props: Record<string, unknown> = {}
  let clientDirective: string | null = null
  for (const attr of Array.from(el.attributes) as AnyEl[]) {
    const n = attr.name as string
    if (n === 'data-apex-name') continue
    if (n.startsWith('client:')) {
      clientDirective = n
      continue
    }
    if (n.startsWith(':')) props[n.slice(1)] = evaluate(attr.value, layers)
    else if (n.startsWith('x-bind:')) props[n.slice('x-bind:'.length)] = evaluate(attr.value, layers)
    else props[n] = attr.value
  }

  const dataObj =
    entry.rootXData && entry.rootXData.trim()
      ? ((evaluate(entry.rootXData, [props]) as Record<string, unknown>) ?? {})
      : {}
  // Props first so component x-data can override; both are available in the
  // component's scope and baked into the hydration literal.
  const merged = { ...props, ...dataObj }

  const idCounter = { n: 0 }
  const innerLayers: ScopeLayer[] = [createMagics(el, idCounter), merged]
  const innerHtml = renderFragmentInternal(entry.template, innerLayers, entry.scopeId, registry)

  const root = document.createElement('div')
  root.setAttribute('x-data', JSON.stringify(merged))
  root.setAttribute('data-apex-component', name)
  root.setAttribute(entry.scopeId, '')
  if (clientDirective) root.setAttribute(clientDirective, '')
  root.innerHTML = innerHtml
  el.replaceWith(root)
}

function renderFor(
  template: AnyEl,
  expr: string,
  layers: ScopeLayer[],
  scopeId: string,
  document: AnyEl,
  registry: ComponentRegistry,
): void {
  const parsed = parseForExpression(expr)
  if (!parsed) return
  const pairs = toIterablePairs(evaluate(parsed.items, layers))

  // Insert clones sequentially right after the <template>, matching Alpine.
  let anchor: AnyEl = template
  for (const [value, index] of pairs) {
    const itemScope: ScopeLayer = { [parsed.item]: value }
    if (parsed.index) itemScope[parsed.index] = index
    const scoped = [...layers, itemScope]

    const frag = template.content.cloneNode(true)
    const clones = Array.from(frag.childNodes) as AnyEl[]
    anchor.after(frag)
    for (const clone of clones) {
      if (clone.nodeType !== ELEMENT_NODE) continue
      clone.setAttribute('data-apex-ssr', '')
      walkElement(clone, scoped, scopeId, document, registry)
      anchor = clone
    }
  }
}

function renderIf(
  template: AnyEl,
  expr: string,
  layers: ScopeLayer[],
  scopeId: string,
  document: AnyEl,
  registry: ComponentRegistry,
): void {
  if (!evaluate(expr, layers)) return
  const frag = template.content.cloneNode(true)
  const clones = Array.from(frag.childNodes) as AnyEl[]
  template.after(frag)
  for (const clone of clones) {
    if (clone.nodeType !== ELEMENT_NODE) continue
    clone.setAttribute('data-apex-ssr', '')
    walkElement(clone, layers, scopeId, document, registry)
  }
}

function stampScope(el: AnyEl, scopeId: string): void {
  el.setAttribute(scopeId, '')
}
