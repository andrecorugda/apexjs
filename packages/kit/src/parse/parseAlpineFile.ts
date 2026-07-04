import { Parser } from 'htmlparser2'

export interface SourceLocation {
  start: number
  end: number
}

export interface ScriptBlock {
  /** Raw inner source of the <script server> block. */
  content: string
  lang: 'ts' | 'js'
  attrs: Record<string, string>
  loc: SourceLocation
}

export interface TemplateBlock {
  /** Raw inner HTML of the <template> block, untouched. */
  content: string
  /** The attributes on the root <template> element (e.g. x-data). */
  attrs: Record<string, string>
  loc: SourceLocation
}

export interface StyleBlock {
  content: string
  scoped: boolean
  lang: string
  loc: SourceLocation
}

export interface AlpineDescriptor {
  filename: string
  /** The `<script server>` block (loader; server-only, excluded from the client bundle). */
  script?: ScriptBlock
  /** The `<script client>` block (imports + logic available to the template/x-data). */
  clientScript?: ScriptBlock
  template?: TemplateBlock
  styles: StyleBlock[]
}

export class AlpineParseError extends Error {
  constructor(
    message: string,
    readonly filename: string,
    readonly offset: number,
  ) {
    super(`${filename}: ${message} (at offset ${offset})`)
    this.name = 'AlpineParseError'
  }
}

const TOP_LEVEL_BLOCKS = new Set(['script', 'template', 'style'])

interface OpenBlock {
  tag: string
  attrs: Record<string, string>
  /** htmlparser2 startIndex of the opening tag. */
  tagStart: number
  /** index just past the opening tag's `>` — where inner content begins. */
  contentStart: number
}

/**
 * Split a `.alpine` single-file component into its `<script server>`,
 * `<template>` and `<style>` blocks.
 *
 * Uses htmlparser2 as a SAX stream and only treats **depth-0** tags as block
 * delimiters. This is what makes nested `<template x-for>` / `<template x-if>`
 * inside the top-level `<template>` safe — a naive regex would truncate at the
 * first inner `</template>`. Inner content is sliced verbatim from the original
 * source (no reserialization) so offsets stay accurate for future source maps.
 */
export function parseAlpineFile(source: string, filename = 'anonymous.alpine'): AlpineDescriptor {
  const descriptor: AlpineDescriptor = { filename, styles: [] }

  // Held in an object so TypeScript keeps the full `OpenBlock | null` type when
  // read after the parser callbacks (a closure-mutated `let` would narrow back
  // to its `null` initializer). `depth` tracks nesting of the open block.
  const state: { open: OpenBlock | null; depth: number } = { open: null, depth: 0 }

  const fail = (message: string, offset: number): never => {
    throw new AlpineParseError(message, filename, offset)
  }

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        const tag = name.toLowerCase()
        if (state.open) {
          // Inside a block already — just track nesting depth so a nested
          // <template> doesn't prematurely close the outer one.
          if (tag === state.open.tag) state.depth++
          return
        }
        if (!TOP_LEVEL_BLOCKS.has(tag)) {
          fail(
            `unexpected top-level <${tag}>; only <script>, <template> and <style> are allowed`,
            parser.startIndex,
          )
        }
        state.depth = 1
        state.open = {
          tag,
          attrs: attribs,
          tagStart: parser.startIndex,
          contentStart: parser.endIndex + 1,
        }
      },
      onclosetag(name) {
        const tag = name.toLowerCase()
        if (!state.open || tag !== state.open.tag) return
        state.depth--
        if (state.depth > 0) return

        // Closing the top-level block. Inner content is [contentStart, closeStart).
        const closeStart = parser.startIndex
        const content = source.slice(state.open.contentStart, closeStart)
        const loc: SourceLocation = { start: state.open.tagStart, end: parser.endIndex + 1 }
        commitBlock(descriptor, state.open, content, loc, fail)
        state.open = null
      },
    },
    { recognizeSelfClosing: true, lowerCaseTags: true },
  )

  parser.write(source)
  parser.end()

  if (state.open) fail(`unclosed <${state.open.tag}> block`, state.open.tagStart)

  return descriptor
}

function commitBlock(
  descriptor: AlpineDescriptor,
  block: OpenBlock,
  content: string,
  loc: SourceLocation,
  fail: (message: string, offset: number) => never,
): void {
  switch (block.tag) {
    case 'script': {
      const isClient = 'client' in block.attrs
      const isServer = 'server' in block.attrs
      if (!isClient && !isServer) {
        fail(
          '<script> must be marked `server` or `client` (e.g. <script server> or <script client>)',
          loc.start,
        )
      }
      const lang = block.attrs.lang === 'ts' || block.attrs.lang === 'js' ? block.attrs.lang : 'ts'
      if (isClient) {
        if (descriptor.clientScript) fail('duplicate <script client> block', loc.start)
        descriptor.clientScript = { content, lang, attrs: block.attrs, loc }
      } else {
        if (descriptor.script) fail('duplicate <script server> block', loc.start)
        descriptor.script = { content, lang, attrs: block.attrs, loc }
      }
      return
    }
    case 'template': {
      if (descriptor.template)
        fail('a .alpine file may only have one top-level <template>', loc.start)
      descriptor.template = { content, attrs: block.attrs, loc }
      return
    }
    case 'style': {
      descriptor.styles.push({
        content,
        scoped: 'scoped' in block.attrs,
        lang: block.attrs.lang ?? 'css',
        loc,
      })
      return
    }
  }
}
