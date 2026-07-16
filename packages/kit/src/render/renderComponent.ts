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
  /** Pre-evaluated root x-data defaults (from a compiled `rootData()` factory).
   * When provided, used instead of sandbox-evaluating the `rootXData` string —
   * this is how composables/imports in x-data resolve during SSR. */
  authoredDefaults?: Record<string, unknown>
  /** Root `<template>`'s directive attributes other than x-data (x-init, x-effect, @events,
   * …), carried onto the emitted root `<div>` so Alpine runs them on hydration. */
  rootAttrs?: Record<string, string>
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
export async function renderComponent(input: RenderComponentInput): Promise<RenderComponentResult> {
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
  // Carry the root template's other directives (x-init, x-effect, @events, …) so Alpine
  // runs them on hydration — x-data is handled separately above.
  for (const [k, v] of Object.entries(input.rootAttrs ?? {})) {
    if (k !== 'x-data') root.setAttribute(k, v)
  }
  while (body.firstChild) root.appendChild(body.firstChild)

  // Merge authored x-data defaults under the loader data. Prefer defaults from a
  // compiled `rootData()` factory (real JS — resolves composable imports); else
  // fall back to sandbox-evaluating the authored x-data string.
  const authoredExpr = rootXData ?? undefined
  const authoredDefaults =
    input.authoredDefaults ??
    (authoredExpr?.trim() ? ((evaluate(authoredExpr, [{}]) as Record<string, unknown>) ?? {}) : {})
  const rootData: Record<string, unknown> = { ...authoredDefaults, ...loaderData }

  const idCounter = { n: 0 }
  const stores = input.stores ?? {}
  const magics = createMagics(root, idCounter, stores)
  const layers: ScopeLayer[] = [magics, rootData]

  stampScope(root, scopeId)
  await walkChildren(root, layers, scopeId, document, registry, stores)

  return { html: root.outerHTML, rootData }
}

/**
 * SSR-render a template fragment against `data`, without adding a component root
 * wrapper. Nested inline `x-data` islands are evaluated as their own scope layers
 * (so `x-text` etc. inside them resolve). Used by the islands renderer, where the
 * page has many independent interactive regions rather than one component root.
 */
export async function renderFragment(
  templateHtml: string,
  data: Record<string, unknown>,
  scopeId: string,
  registry: ComponentRegistry = {},
  stores: Record<string, unknown> = {},
): Promise<string> {
  const idCounter = { n: 0 }
  return renderFragmentInternal(
    templateHtml,
    [createMagicsFor(idCounter, stores), data],
    scopeId,
    registry,
    stores,
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
export async function renderIslands(
  templateHtml: string,
  data: Record<string, unknown>,
  scopeId: string,
  registry: ComponentRegistry = {},
  stores: Record<string, unknown> = {},
): Promise<RenderIslandsResult> {
  const prepared = rewriteComponentTags(templateHtml, Object.keys(registry))
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${prepared}</body></html>`)
  const body = document.body
  const idCounter = { n: 0 }
  const layers: ScopeLayer[] = [createMagics(body, idCounter, stores), data]
  await walkChildren(body, layers, scopeId, document, registry, stores)

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
async function renderFragmentInternal(
  templateHtml: string,
  layers: ScopeLayer[],
  scopeId: string,
  registry: ComponentRegistry,
  stores: Record<string, unknown> = {},
): Promise<string> {
  const prepared = rewriteComponentTags(templateHtml, Object.keys(registry))
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${prepared}</body></html>`)
  const body = document.body
  await walkChildren(body, layers, scopeId, document, registry, stores)
  return body.innerHTML
}

function createMagicsFor(
  idCounter: { n: number },
  stores: Record<string, unknown> = {},
): ScopeLayer {
  return createMagics(null, idCounter, stores)
}

async function walkChildren(
  parent: AnyEl,
  layers: ScopeLayer[],
  scopeId: string,
  document: AnyEl,
  registry: ComponentRegistry,
  stores: Record<string, unknown>,
): Promise<void> {
  // Snapshot children first — the walk mutates the tree (x-for/x-if insert clones,
  // components get replaced by their rendered output).
  const children = Array.from(parent.childNodes) as AnyEl[]
  for (const node of children) {
    if (node.nodeType !== ELEMENT_NODE) continue
    await walkElement(node, layers, scopeId, document, registry, stores)
  }
}

async function walkElement(
  el: AnyEl,
  layers: ScopeLayer[],
  scopeId: string,
  document: AnyEl,
  registry: ComponentRegistry,
  stores: Record<string, unknown>,
): Promise<void> {
  const tag = String(el.tagName).toLowerCase()

  // Component usage (`<Counter/>` was rewritten to <apex-component data-apex-name>).
  if (tag === 'apex-component') {
    await renderComponentInstance(el, layers, scopeId, document, registry, stores)
    return
  }

  // Structural directives live on <template> elements.
  if (tag === 'template') {
    const xFor = el.getAttribute('x-for')
    if (xFor != null) {
      await renderFor(el, xFor, layers, scopeId, document, registry, stores)
      return
    }
    const xIf = el.getAttribute('x-if')
    if (xIf != null) {
      await renderIf(el, xIf, layers, scopeId, document, registry, stores)
      return
    }
    // A plain <template> (no structural directive) is left untouched.
    return
  }

  // x-cloak is obsolete once the server rendered correct content.
  if (el.hasAttribute('x-cloak')) el.removeAttribute('x-cloak')

  // A nested x-data introduces its own scope layer for this subtree.
  let scoped = layers
  const nestedData = el.getAttribute('x-data')
  if (nestedData?.trim()) {
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

  // x-model → emit the field's initial state server-side (Alpine binds the same
  // value on the client). The x-model attribute is left in place for rebinding.
  const xModel = el.getAttribute('x-model')
  if (xModel != null) applyModel(el, tag, xModel, scoped)

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
    await walkChildren(el, scoped, scopeId, document, registry, stores)
  }
}

/**
 * Emit the SSR initial state for an `x-model` field, matching Alpine's own client
 * `x-model` binding so controlled inputs don't flash empty before hydration.
 * Only writes when the bound value is defined; the `x-model` attribute itself is
 * preserved by the caller for client rebinding.
 */
function applyModel(el: AnyEl, tag: string, expr: string, scoped: ScopeLayer[]): void {
  const value = evaluate(expr, scoped)
  if (value === undefined) return

  if (tag === 'textarea') {
    el.textContent = stringifyModel(value)
    return
  }

  if (tag === 'select') {
    const multiple = el.hasAttribute('multiple')
    for (const opt of Array.from(el.querySelectorAll('option')) as AnyEl[]) {
      const optVal = opt.hasAttribute('value')
        ? (opt.getAttribute('value') ?? '')
        : (opt.textContent ?? '').trim()
      const selected =
        multiple && Array.isArray(value)
          ? value.some((v) => String(v) === optVal)
          : String(value) === optVal
      if (selected) opt.setAttribute('selected', '')
      else opt.removeAttribute('selected')
    }
    return
  }

  const type = (el.getAttribute('type') ?? 'text').toLowerCase()

  if (tag === 'input' && type === 'checkbox') {
    // Bound to an array → membership on the checkbox's `value`; else boolean.
    const checked = Array.isArray(value)
      ? value.some((v) => String(v) === (el.getAttribute('value') ?? 'on'))
      : Boolean(value)
    if (checked) el.setAttribute('checked', '')
    else el.removeAttribute('checked')
    return
  }

  if (tag === 'input' && type === 'radio') {
    const checked = String(value) === (el.getAttribute('value') ?? '')
    if (checked) el.setAttribute('checked', '')
    else el.removeAttribute('checked')
    return
  }

  // Text/number/email/…/other inputs → the `value` attribute.
  el.setAttribute('value', stringifyModel(value))
}

/** Serialize an x-model value to its attribute/text form (Alpine coerces to string). */
function stringifyModel(value: unknown): string {
  if (value == null) return ''
  return String(value)
}

/**
 * Render an embedded component instance. Props come from the usage attributes
 * (`prop="x"` static, `:prop="expr"` evaluated). The component's authored x-data
 * is evaluated with the props in scope to get the resolved initial data, which is
 * baked onto the wrapper as a JSON literal — so client hydration needs no access
 * to the parent scope or props. A `client:*` directive is forwarded to the wrapper
 * so islands mode can hydrate the component lazily.
 */
async function renderComponentInstance(
  el: AnyEl,
  layers: ScopeLayer[],
  scopeId: string,
  document: AnyEl,
  registry: ComponentRegistry,
  stores: Record<string, unknown>,
): Promise<void> {
  const name = el.getAttribute('data-apex-name') as string
  const entry = registry[name]
  if (!entry) {
    el.replaceWith(document.createComment(` apex: unknown component "${name}" `))
    return
  }

  // Slot content = the children of the usage tag, rendered in the PARENT scope
  // (authored where the component is used, styled by the parent's scope).
  const slotSource = String(el.innerHTML ?? '')
  const slotHtml = slotSource.trim()
    ? await renderFragmentInternal(slotSource, layers, scopeId, registry, stores)
    : ''

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
    else if (n.startsWith('x-bind:'))
      props[n.slice('x-bind:'.length)] = evaluate(attr.value, layers)
    else props[n] = attr.value
  }

  // Run the component's OWN server loader (if declared), with its resolved props.
  // Its result is available to the component's x-data + template and is baked
  // into the hydration literal below — so the client never re-runs it.
  const loaderData = entry.loader
    ? (((await entry.loader({ props })) as Record<string, unknown>) ?? {})
    : {}

  const dataObj = entry.rootXData?.trim()
    ? ((evaluate(entry.rootXData, [{ ...props, ...loaderData }]) as Record<string, unknown>) ?? {})
    : {}
  // Precedence props < loader < x-data; all available in the component's scope
  // and baked into the hydration literal (so hydration needs no parent scope).
  const merged = { ...props, ...loaderData, ...dataObj }

  const idCounter = { n: 0 }
  const innerLayers: ScopeLayer[] = [createMagics(el, idCounter, stores), merged]
  const innerHtml = await renderFragmentInternal(
    entry.template,
    innerLayers,
    entry.scopeId,
    registry,
    stores,
  )

  const root = document.createElement('div')
  root.setAttribute('x-data', JSON.stringify(merged))
  root.setAttribute('data-apex-component', name)
  root.setAttribute(entry.scopeId, '')
  if (clientDirective) root.setAttribute(clientDirective, '')
  // Inject slot content into the component's <slot> (keeping fallback when none given).
  root.innerHTML = innerHtml.replace(
    /<slot\b[^>]*>([\s\S]*?)<\/slot>/,
    (_m: string, fallback: string) => slotHtml || fallback,
  )
  el.replaceWith(root)
}

/**
 * Expand embedded components INSIDE a <template>'s content (x-for / x-if) into
 * their resolved markup, in place, keeping bindings RAW. Alpine re-creates a
 * <template>'s children per clone on the client — but it doesn't know the
 * `<apex-component>` tag, so without this the component would hydrate unstyled.
 * Expanding it here means every clone gets real markup. This is what lets Apex
 * components work in loops/conditionals — the bit raw Alpine can't do.
 */
function expandTemplateComponents(
  template: AnyEl,
  document: AnyEl,
  registry: ComponentRegistry,
): void {
  // linkedom serializes a <template> from an internal child list, NOT from
  // `.content` — mutating `.content` reaches cloneNode but not the serialized
  // output Alpine ships to the client. Writing back `innerHTML` syncs both.
  template.innerHTML = expandComponentsHtml(template.innerHTML, document, registry)
}

/** Expand `<apex-component>` tags in an HTML string into structural markup. */
function expandComponentsHtml(html: string, document: AnyEl, registry: ComponentRegistry): string {
  const holder = document.createElement('div')
  holder.innerHTML = html
  expandComponentsInEl(holder, document, registry)
  return holder.innerHTML
}

function expandComponentsInEl(
  container: AnyEl,
  document: AnyEl,
  registry: ComponentRegistry,
): void {
  // Snapshot: replaceWith mutates the child list as we go.
  for (const node of Array.from(container.childNodes ?? []) as AnyEl[]) {
    if (node.nodeType !== ELEMENT_NODE) continue
    const tag = String(node.tagName).toLowerCase()
    if (tag === 'apex-component') {
      const repl = buildStructuralComponent(node, document, registry)
      node.replaceWith(repl)
      expandComponentsInEl(repl, document, registry) // nested components in the expansion
    } else if (tag === 'template') {
      // A nested x-for/x-if — recurse via innerHTML so it too serializes expanded.
      node.innerHTML = expandComponentsHtml(node.innerHTML, document, registry)
    } else {
      expandComponentsInEl(node, document, registry)
    }
  }
}

/**
 * Build the structural (unresolved) expansion of one `<apex-component>`: the
 * component's template with `<slot>` replaced by the usage's children, wrapped in
 * a div whose `x-data` reconstructs props (static + loop-bound) and the
 * component's own x-data at runtime — so Alpine resolves them per clone.
 */
function buildStructuralComponent(el: AnyEl, document: AnyEl, registry: ComponentRegistry): AnyEl {
  const name = el.getAttribute('data-apex-name') as string
  const entry = registry[name]
  if (!entry) return document.createComment(` apex: unknown component "${name}" `)

  const staticEntries: string[] = []
  const dynEntries: string[] = []
  for (const attr of Array.from(el.attributes) as AnyEl[]) {
    const n = attr.name as string
    if (n === 'data-apex-name' || n.startsWith('client:')) continue
    if (n.startsWith(':')) dynEntries.push(`${JSON.stringify(n.slice(1))}: (${attr.value})`)
    else if (n.startsWith('x-bind:'))
      dynEntries.push(`${JSON.stringify(n.slice('x-bind:'.length))}: (${attr.value})`)
    else staticEntries.push(`${JSON.stringify(n)}: ${JSON.stringify(attr.value)}`)
  }
  const propObj = `{ ${[...staticEntries, ...dynEntries].join(', ')} }`
  const hasProps = staticEntries.length + dynEntries.length > 0
  const rootXData = entry.rootXData?.trim()
  const base = rootXData
    ? // Props are in scope (as bare names) for the component's x-data, then merged.
      `(function(p){with(p){return Object.assign({},p,(${rootXData}))}})(${propObj})`
    : hasProps
      ? propObj
      : null
  let xData: string | null = base
  if (entry.loader) {
    // Loop/conditional server loader: merge this instance's loader result, baked
    // as an inline object literal keyed by the loop `:key` and looked up in the
    // clone's own scope. renderFor/renderIf fill the two placeholders after running
    // the loader once per item — so the client re-evaluates x-data per clone and
    // gets its item's data with NO island and NO extra client runtime.
    xData = `Object.assign({}, ${base ?? '{}'}, (__APEX_LMAP__[String(__APEX_LKEY__)]||{}))`
  }

  const slotSource = String(el.innerHTML ?? '').trim()
  const inner = rewriteComponentTags(entry.template, Object.keys(registry)).replace(
    /<slot\b[^>]*>([\s\S]*?)<\/slot>/,
    (_m: string, fallback: string) => slotSource || fallback,
  )

  const root = document.createElement('div')
  root.setAttribute('data-apex-component', name)
  root.setAttribute(entry.scopeId, '')
  if (xData) root.setAttribute('x-data', xData)
  if (entry.loader) {
    // Markers so renderFor/renderIf can resolve props + run the loader per item.
    root.setAttribute('data-apex-lname', name)
    root.setAttribute('data-apex-lprops', propObj)
  }
  root.innerHTML = inner
  // Stamp the component's scope on ITS OWN elements so `<style scoped>` matches
  // them. The resolved (non-loop) path does this via renderFragmentInternal; the
  // structural (in-loop) expansion builds raw markup, so without this the loop
  // clones' inner elements only get the enclosing page scope re-stamped on them
  // and the component's scoped CSS (`button[data-apex-x]`) never matches.
  stampSubtreeScope(root, entry.scopeId)
  return root
}

/**
 * Stamp `scopeId` on every descendant element of `el`, stopping at nested
 * component boundaries (each component owns its own scope). Used to scope the
 * structural (in-loop) component expansion, mirroring the resolved path.
 */
function stampSubtreeScope(el: AnyEl, scopeId: string): void {
  for (const child of Array.from(el.childNodes ?? []) as AnyEl[]) {
    if (child.nodeType !== ELEMENT_NODE) continue
    if (child.hasAttribute('data-apex-component')) continue // nested component: its own scope
    child.setAttribute(scopeId, '')
    stampSubtreeScope(child, scopeId)
  }
}

/**
 * For each loader-carrying component (`[data-apex-lname]`) directly inside an
 * expanded x-for/x-if template, run its loader once per instance and bake the
 * results as an inline object literal keyed by `keyExpr`, filling the placeholders
 * buildStructuralComponent emitted. Server-only: the client re-evaluates the
 * resulting x-data per clone and reads its item's slice from the inline map — no
 * payload island, no extra client runtime. Identical props are deduped per bake
 * (mitigates N+1). Nested-template loader components are handled by the nested
 * renderFor/renderIf when that template is walked.
 */
async function bakeComponentLoaders(
  template: AnyEl,
  instanceScopes: ScopeLayer[][],
  keyExpr: string,
  registry: ComponentRegistry,
  document: AnyEl,
): Promise<void> {
  // Work on a re-parsed holder: mutating `template.content` reaches cloneNode
  // (the SSR clones) but NOT the serialized <template> the client re-clones from
  // (linkedom serializes from an internal child list). Writing `innerHTML` back
  // syncs both — same trick as expandTemplateComponents.
  const holder = document.createElement('div')
  holder.innerHTML = template.innerHTML
  const divs = Array.from(holder.querySelectorAll('[data-apex-lname]')) as AnyEl[]
  if (!divs.length) return
  for (const div of divs) {
    const name = div.getAttribute('data-apex-lname') as string
    const propsExpr = div.getAttribute('data-apex-lprops') || '{}'
    div.removeAttribute('data-apex-lname')
    div.removeAttribute('data-apex-lprops')
    const loader = registry[name]?.loader
    if (!loader) continue
    const map: Record<string, unknown> = {}
    const memo = new Map<string, unknown>()
    for (const scope of instanceScopes) {
      const props = (evaluate(`(${propsExpr})`, scope) as Record<string, unknown>) ?? {}
      const keyVal = String(evaluate(keyExpr, scope))
      const memoKey = JSON.stringify(props)
      let data: unknown
      if (memo.has(memoKey)) data = memo.get(memoKey)
      else {
        data = (await loader({ props })) ?? {}
        memo.set(memoKey, data)
      }
      map[keyVal] = data
    }
    const xd = (div.getAttribute('x-data') ?? '')
      .replace('__APEX_LMAP__', JSON.stringify(map))
      .replace('__APEX_LKEY__', `(${keyExpr})`)
    div.setAttribute('x-data', xd)
  }
  template.innerHTML = holder.innerHTML
}

async function renderFor(
  template: AnyEl,
  expr: string,
  layers: ScopeLayer[],
  scopeId: string,
  document: AnyEl,
  registry: ComponentRegistry,
  stores: Record<string, unknown>,
): Promise<void> {
  // Expand components in the template ONCE so both the SSR clones (walked below)
  // and the kept <template> (cloned by Alpine on the client) get real markup.
  expandTemplateComponents(template, document, registry)
  const parsed = parseForExpression(expr)
  if (!parsed) return
  const pairs = Array.from(toIterablePairs(evaluate(parsed.items, layers)))

  const itemScopeFor = (value: unknown, index: unknown): ScopeLayer => {
    const s: ScopeLayer = { [parsed.item]: value }
    if (parsed.index) s[parsed.index] = index
    return s
  }

  // Run per-item component loaders + bake their results into the loop's x-data
  // (keyed by the loop :key, or the item itself when no :key is given).
  const keyExpr = template.getAttribute(':key') || parsed.item
  await bakeComponentLoaders(
    template,
    pairs.map(([value, index]) => [...layers, itemScopeFor(value, index)]),
    keyExpr,
    registry,
    document,
  )

  // Insert clones sequentially right after the <template>, matching Alpine.
  let anchor: AnyEl = template
  for (const [value, index] of pairs) {
    const scoped = [...layers, itemScopeFor(value, index)]

    const frag = template.content.cloneNode(true)
    const clones = Array.from(frag.childNodes) as AnyEl[]
    anchor.after(frag)
    for (const clone of clones) {
      if (clone.nodeType !== ELEMENT_NODE) continue
      clone.setAttribute('data-apex-ssr', '')
      await walkElement(clone, scoped, scopeId, document, registry, stores)
      anchor = clone
    }
  }
}

async function renderIf(
  template: AnyEl,
  expr: string,
  layers: ScopeLayer[],
  scopeId: string,
  document: AnyEl,
  registry: ComponentRegistry,
  stores: Record<string, unknown>,
): Promise<void> {
  expandTemplateComponents(template, document, registry)
  if (!evaluate(expr, layers)) return
  // Single instance: run any component loaders once, keyed by a constant.
  await bakeComponentLoaders(template, [layers], "'_'", registry, document)
  const frag = template.content.cloneNode(true)
  const clones = Array.from(frag.childNodes) as AnyEl[]
  template.after(frag)
  for (const clone of clones) {
    if (clone.nodeType !== ELEMENT_NODE) continue
    clone.setAttribute('data-apex-ssr', '')
    await walkElement(clone, layers, scopeId, document, registry, stores)
  }
}

function stampScope(el: AnyEl, scopeId: string): void {
  el.setAttribute(scopeId, '')
}
