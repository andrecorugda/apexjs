import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { defineCommand } from 'citty'

type Kind = 'page' | 'component' | 'api' | 'store' | 'layout'

/** Components are referenced as `<PascalCase/>`, so their file must be PascalCase. */
function pascalCase(s: string): string {
  return s
    .replace(/[-_\s]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase())
}

function pageTemplate(name: string): string {
  return `<script server lang="ts">
  export function loader() {
    return { title: '${name}' }
  }
</script>

<template x-data>
  <main>
    <h1 x-text="title"></h1>
  </main>
</template>

<style scoped>
  main { max-width: 40rem; margin: 3rem auto; font-family: system-ui, sans-serif; }
</style>
`
}

function componentTemplate(): string {
  return `<template x-data="{ count: 0 }">
  <button @click="count++" x-text="count"></button>
</template>

<style scoped>
  button { cursor: pointer; }
</style>
`
}

function layoutTemplate(): string {
  return `<template>
  <header class="site-header">
    <nav><a href="/">Home</a></nav>
  </header>
  <main>
    <slot></slot>
  </main>
  <footer class="site-footer">
    <p>Built with Apex JS</p>
  </footer>
</template>

<style scoped>
  .site-header { padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
  main { max-width: 60rem; margin: 0 auto; padding: 2rem 1.5rem; }
  .site-footer { padding: 1.5rem; border-top: 1px solid #e5e7eb; color: #6b7280; }
</style>
`
}

function storeTemplate(name: string): string {
  return `import { defineStore } from '@apex-stack/core'

// Access anywhere as $store.${name} — SSR-rendered and reactive after hydration.
export default defineStore('${name}', () => ({
  count: 0,
  increment() {
    this.count++
  },
}))
`
}

function apiTemplate(name: string): string {
  return `import { defineApexRoute } from '@apex-stack/core'
import { z } from 'zod'

// GET /api/${name}  ·  MCP tool "${name}"
export default defineApexRoute({
  method: 'GET',
  description: 'Describe what ${name} does',
  input: { name: z.string() },
  mcp: true,
  handler: ({ input }) => ({ message: \`Hello, \${input.name}!\` }),
})
`
}

/** Where a generated artifact lands, and its contents. */
function plan(kind: Kind, name: string, root: string): { path: string; contents: string } {
  switch (kind) {
    case 'page':
      return { path: join(root, 'pages', `${name}.alpine`), contents: pageTemplate(name) }
    case 'component':
      return {
        path: join(root, 'components', `${pascalCase(name)}.alpine`),
        contents: componentTemplate(),
      }
    case 'api':
      return { path: join(root, 'server', 'api', `${name}.ts`), contents: apiTemplate(name) }
    case 'store':
      return { path: join(root, 'stores', `${name}.ts`), contents: storeTemplate(name) }
    case 'layout':
      return { path: join(root, 'layouts', `${name}.alpine`), contents: layoutTemplate() }
  }
}

export const makeCommand = defineCommand({
  meta: { name: 'make', description: 'Generate a page, component, API route, store, or layout' },
  args: {
    kind: {
      type: 'positional',
      required: true,
      description: 'page | component | api | store | layout',
    },
    name: { type: 'positional', required: true, description: 'Name (about, Counter, todos, …)' },
    root: { type: 'string', description: 'Project root', default: '.' },
  },
  run({ args }) {
    const kind = args.kind as Kind
    if (
      kind !== 'page' &&
      kind !== 'component' &&
      kind !== 'api' &&
      kind !== 'store' &&
      kind !== 'layout'
    ) {
      console.error(
        `\n  Unknown type "${args.kind}". Use: page | component | api | store | layout\n`,
      )
      process.exit(1)
    }

    const root = resolve(process.cwd(), args.root)
    const { path, contents } = plan(kind, args.name, root)
    if (existsSync(path)) {
      console.error(`\n  ✗ Already exists: ${path}\n`)
      process.exit(1)
    }

    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, contents)
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.log(`\n  ✓ Created ${path.replace(`${root}/`, '')}\n`)
  },
})
