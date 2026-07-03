// Copies the scaffold templates from create-apexjs into this package at build
// time, so the global `apex new` command can scaffold without duplicating the
// template source. create-apexjs/templates is the single source of truth.
import { cpSync, existsSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const src = fileURLToPath(new URL('../../create-apexjs/templates', import.meta.url))
const dest = fileURLToPath(new URL('../templates', import.meta.url))

if (existsSync(dest)) rmSync(dest, { recursive: true, force: true })
cpSync(src, dest, { recursive: true })
console.log('apex: copied scaffold templates from create-apexjs')
