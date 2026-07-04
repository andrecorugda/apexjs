import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { defineCommand } from 'citty'

type Kind = 'page' | 'component' | 'api' | 'store' | 'layout' | 'service' | 'test' | 'middleware'

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

function serviceTemplate(name: string): string {
  const cls = `${pascalCase(name)}Service`
  return `/**
 * ${cls} — business logic as a plain, testable class. Keep routes and loaders
 * thin and delegate to services like this one (the clean-code backbone).
 */
export class ${cls} {
  // Replace with your methods.
  run(input: string): string {
    return input
  }
}
`
}

function middlewareTemplate(): string {
  return `import { defineMiddleware } from '@apex-stack/core'

// Runs on every request before the page/API handler. Attach request-scoped
// state to ctx.locals (read in a page loader via \`loader({ locals })\` and in
// route handlers via \`{ locals }\`), or return ctx.redirect('/path') to
// short-circuit. Files run in filename order — prefix with 01. / 02. to order.
export default defineMiddleware((ctx) => {
  // ctx.locals.user = await getUser(ctx.headers)
  // if (ctx.url.startsWith('/admin') && !ctx.locals.user) return ctx.redirect('/login')
})
`
}

function testTemplate(name: string): string {
  return `import { describe, expect, it } from 'vitest'

describe('${name}', () => {
  it('works', () => {
    expect(true).toBe(true)
  })
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
    case 'service':
      return {
        path: join(root, 'services', `${pascalCase(name)}Service.ts`),
        contents: serviceTemplate(name),
      }
    case 'test':
      return { path: join(root, 'tests', `${name}.test.ts`), contents: testTemplate(name) }
    case 'middleware':
      return { path: join(root, 'middleware', `${name}.ts`), contents: middlewareTemplate() }
  }
}

export const makeCommand = defineCommand({
  meta: {
    name: 'make',
    description:
      'Generate a page, component, API route, store, layout, service, test, or middleware',
  },
  args: {
    kind: {
      type: 'positional',
      required: true,
      description: 'page | component | api | store | layout | service | test | middleware',
    },
    name: { type: 'positional', required: true, description: 'Name (about, Counter, todos, …)' },
    root: { type: 'string', description: 'Project root', default: '.' },
  },
  run({ args }) {
    const kind = args.kind as Kind
    const kinds: Kind[] = [
      'page',
      'component',
      'api',
      'store',
      'layout',
      'service',
      'test',
      'middleware',
    ]
    if (!kinds.includes(kind)) {
      console.error(`\n  Unknown type "${args.kind}". Use: ${kinds.join(' | ')}\n`)
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
