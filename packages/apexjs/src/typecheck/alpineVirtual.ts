import { parseAlpineFile, type ScriptBlock } from '@apex-stack/kit'

// Turn a `.alpine` single-file component into virtual TypeScript that `tsc` can
// check — the Volar/vue-tsc trick, minimal edition. Today `.alpine` files are
// invisible to `tsc`, so the TS in `<script server>` / `<script client>` is never
// type-checked. We emit ONE virtual `.ts` per script block, "line-preserved":
// every character outside the block becomes a space (newlines kept), so a
// diagnostic at (line, col) in the virtual file maps 1:1 back to the `.alpine`
// source — no source map needed. Server and client go to SEPARATE virtual files
// so their module-level code can't collide (duplicate imports/identifiers).
//
// Phase 1 covers the SCRIPT BLOCKS only. Template expressions (x-text, :class,
// @click, x-for) against the x-data scope are Phase 2.

export interface VirtualFile {
  /** Absolute path ending in `.alpine.server.ts` or `.alpine.client.ts`. */
  path: string
  /** Line-preserved TS: only this block's content is kept; the rest is blanked. */
  content: string
}

/** Find the [start, end) offsets of a script block's INNER content in the source. */
function contentRange(source: string, block: ScriptBlock): [number, number] {
  const openEnd = source.indexOf('>', block.loc.start) + 1
  const closeStart = source.indexOf('</script', openEnd)
  return [openEnd, closeStart === -1 ? source.length : closeStart]
}

/** Blank everything outside [start, end) to spaces, keeping newlines (line-preserving). */
function keepOnly(source: string, start: number, end: number): string {
  let out = ''
  for (let i = 0; i < source.length; i++) {
    const ch = source[i]
    out += i >= start && i < end ? ch : ch === '\n' ? '\n' : ' '
  }
  return out
}

/**
 * Generate the virtual `.ts` file(s) for one `.alpine` source. `absPath` is the
 * real path of the `.alpine` file — virtual paths are derived from it so relative
 * imports (`../services/X`) resolve from the same directory.
 */
export function virtualFilesForAlpine(source: string, absPath: string): VirtualFile[] {
  const descriptor = parseAlpineFile(source, absPath)
  const out: VirtualFile[] = []
  const blocks: [ScriptBlock | undefined, string][] = [
    [descriptor.script, 'server'],
    [descriptor.clientScript, 'client'],
  ]
  for (const [block, suffix] of blocks) {
    if (!block) continue
    const [start, end] = contentRange(source, block)
    // POSIX separators: TypeScript normalizes paths to forward slashes internally,
    // so the virtual-file map must key on forward slashes or the host lookup misses
    // on Windows (backslashes) — silently skipping every .alpine file.
    const path = `${absPath}.${suffix}.ts`.replace(/\\/g, '/')
    out.push({ path, content: keepOnly(source, start, end) })
  }
  return out
}

/** Map a virtual file path back to its originating `.alpine` file. */
export function virtualToAlpine(virtualPath: string): string {
  return virtualPath.replace(/\.alpine\.(server|client)\.ts$/, '.alpine')
}
