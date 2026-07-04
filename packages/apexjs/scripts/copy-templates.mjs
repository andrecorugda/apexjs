// Copies build-time assets into this package so the global `apex` command is
// self-contained: (1) the scaffold templates from create-apexjs (single source
// of truth), and (2) the packaged .alpine VS Code extension (.vsix), so
// `apex new` / `apex upgrade` can offer to install it.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// (1) templates
const src = fileURLToPath(new URL('../../create-apexjs/templates', import.meta.url))
const dest = fileURLToPath(new URL('../templates', import.meta.url))
if (existsSync(dest)) rmSync(dest, { recursive: true, force: true })
cpSync(src, dest, { recursive: true })
console.log('apex: copied scaffold templates from create-apexjs')

// (2) VS Code extension — copy the latest .vsix to a stable, version-less name.
const extDir = fileURLToPath(new URL('../../../editors/vscode-apex', import.meta.url))
const vsxDest = fileURLToPath(new URL('../vscode', import.meta.url))
if (existsSync(extDir)) {
  const vsix = readdirSync(extDir)
    .filter((f) => f.endsWith('.vsix'))
    .sort()
    .pop()
  if (vsix) {
    if (existsSync(vsxDest)) rmSync(vsxDest, { recursive: true, force: true })
    mkdirSync(vsxDest, { recursive: true })
    cpSync(`${extDir}/${vsix}`, `${vsxDest}/apex-alpine.vsix`)
    console.log(`apex: bundled VS Code extension (${vsix})`)
  }
}
