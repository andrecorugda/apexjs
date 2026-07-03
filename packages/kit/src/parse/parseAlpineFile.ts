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
  script?: ScriptBlock
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

  // Depth of the currently-open top-level block. 0 means we're at the document
  // root and the next open tag is a candidate block delimiter.
  let depth = 0
  let open: OpenBlock | null = null

  const fail = (message: string, offset: number): never => {
    throw new AlpineParseError(message, filename, offset)
  }

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        const tag = name.toLowerCase()
        if (open) {
          // Inside a block already — just track nesting depth so a nested
          // <template> doesn't prematurely close the outer one.
          if (tag === open.tag) depth++
          return
        }
        if (!TOP_LEVEL_BLOCKS.has(tag)) {
          fail(`unexpected top-level <${tag}>; only <script>, <template> and <style> are allowed`, parser.startIndex)
        }
        depth = 1
        open = {
          tag,
          attrs: attribs,
          tagStart: parser.startIndex,
          contentStart: parser.endIndex + 1,
        }
      },
      onclosetag(name) {
        const tag = name.toLowerCase()
        if (!open || tag !== open.tag) return
        depth--
        if (depth > 0) return

        // Closing the top-level block. Inner content is [contentStart, closeStart).
        const closeStart = parser.startIndex
        const content = source.slice(open.contentStart, closeStart)
        const loc: SourceLocation = { start: open.tagStart, end: parser.endIndex + 1 }
        commitBlock(descriptor, open, content, loc, fail)
        open = null
      },
    },
    { recognizeSelfClosing: true, lowerCaseTags: true },
  )

  parser.write(source)
  parser.end()

  if (open) fail(`unclosed <${open.tag}> block`, open.tagStart)

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
      if (!('server' in block.attrs)) {
        fail('<script> blocks must be marked `server` in Phase 0 (e.g. <script server>)', loc.start)
      }
      if (descriptor.script) fail('duplicate <script server> block', loc.start)
      const lang = block.attrs.lang === 'ts' || block.attrs.lang === 'js' ? block.attrs.lang : 'ts'
      descriptor.script = { content, lang, attrs: block.attrs, loc }
      return
    }
    case 'template': {
      if (descriptor.template) fail('a .alpine file may only have one top-level <template>', loc.start)
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
