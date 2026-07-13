import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { defineCommand } from 'citty'

type Kind =
  | 'page'
  | 'component'
  | 'api'
  | 'store'
  | 'layout'
  | 'service'
  | 'test'
  | 'middleware'
  | 'model'
  | 'migration'
  | 'auth'
  | 'client'

/** Components are referenced as `<PascalCase/>`, so their file must be PascalCase. */
function pascalCase(s: string): string {
  return s
    .replace(/[-_\s]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase())
}

/** A possibly-nested component name → its path under `components/`, PascalCasing only
 * the filename so folders group them: `ui/navbar` → `ui/Navbar`, `Card` → `Card`. */
function componentRel(name: string): string {
  const parts = name.replace(/^\/+/, '').split('/')
  const base = parts.pop() ?? name
  return [...parts, pascalCase(base)].join('/')
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

function clientTemplate(): string {
  return `// app.client.ts — runs on the client BEFORE Alpine.start().
// Register Alpine plugins, custom directives, and magics here.
//
//   import persist from '@alpinejs/persist'
//   export default (Alpine) => { Alpine.plugin(persist) }
import type { Alpine } from 'alpinejs'

export default (Alpine: Alpine) => {
  // Alpine.plugin(somePlugin)
  // Alpine.directive('my-directive', (el) => { /* … */ })
  // Alpine.magic('my-magic', () => (arg) => arg)
}
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

function authTemplate(): string {
  return `import { useRuntimeConfig } from '@apex-stack/core'
import { sessionAuth } from '@apex-stack/core/server'

// Resolves the request's user, injected as \`user\` into every loader, route handler,
// and MCP tool call. This default reads a sealed (encrypted + signed) session cookie.
// The /api/login and /api/logout routes scaffolded alongside this file write/clear it.
//
// Set a 32+ char secret in apex.config.ts \`runtimeConfig.sessionPassword\` (override
// per-environment via APEX_SESSION_PASSWORD). Prefer an adapter (Lucia / Better-Auth /
// Auth.js) for OAuth / JWT / 2FA — return the user from its session in \`toUser\`.
export default sessionAuth({
  password:
    (useRuntimeConfig().sessionPassword as string) ?? process.env.APEX_SESSION_PASSWORD ?? '',
  // toUser: (data) => (data.user as { id: string; roles?: string[] }) ?? null,
})
`
}

function loginRouteTemplate(): string {
  return `import { defineApexRoute, useRuntimeConfig } from '@apex-stack/core'
import { login, setStatus } from '@apex-stack/core/server'
import { z } from 'zod'

// POST /api/login — verify credentials, then write the sealed session cookie.
// Handlers receive \`event\` — pass it to the session/response helpers.
export default defineApexRoute({
  method: 'POST',
  input: { email: z.string(), password: z.string() },
  handler: async ({ input, event }) => {
    const user = await verifyCredentials(input.email, input.password)
    if (!user) {
      setStatus(event, 401)
      return { error: 'Invalid credentials' }
    }
    await login(event, { user }, { password: sessionPassword() })
    return { ok: true, user }
  },
})

function sessionPassword(): string {
  return (useRuntimeConfig().sessionPassword as string) ?? process.env.APEX_SESSION_PASSWORD ?? ''
}

// TODO: replace this stub with a real lookup (DB + hashed-password compare).
async function verifyCredentials(email: string, password: string) {
  return email && password ? { id: email } : null
}
`
}

function logoutRouteTemplate(): string {
  return `import { defineApexRoute, useRuntimeConfig } from '@apex-stack/core'
import { logout } from '@apex-stack/core/server'

// POST /api/logout — clear the sealed session cookie.
export default defineApexRoute({
  method: 'POST',
  handler: async ({ event }) => {
    await logout(event, {
      password:
        (useRuntimeConfig().sessionPassword as string) ?? process.env.APEX_SESSION_PASSWORD ?? '',
    })
    return { ok: true }
  },
})
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

// ── Model generation (`apex make model todos title:string done:boolean!`) ──────

type FieldType = 'string' | 'text' | 'int' | 'float' | 'boolean' | 'timestamp' | 'json'
interface ParsedField {
  name: string
  type: FieldType
  notNull: boolean
}

const TYPE_ALIASES: Record<string, FieldType> = {
  string: 'string',
  str: 'string',
  text: 'text',
  int: 'int',
  integer: 'int',
  number: 'float',
  float: 'float',
  bool: 'boolean',
  boolean: 'boolean',
  timestamp: 'timestamp',
  date: 'timestamp',
  json: 'json',
}

/** Parse `title:string`, `views:int`, `email:string!` (trailing `!` = NOT NULL). */
function parseFields(specs: string[]): ParsedField[] {
  return specs.map((spec) => {
    const [rawName, rawType = 'string'] = spec.split(':')
    const notNull = rawType.endsWith('!')
    const key = rawType.replace(/!$/, '').toLowerCase()
    const type = TYPE_ALIASES[key]
    if (!type)
      throw new Error(
        `Unknown field type "${rawType}" (use: ${Object.keys(TYPE_ALIASES).join(', ')})`,
      )
    return { name: (rawName ?? '').trim(), type, notNull }
  })
}

function modelTemplate(name: string, fields: ParsedField[]): string {
  const body =
    fields
      .map((f) =>
        f.notNull
          ? `    ${f.name}: { type: '${f.type}', notNull: true },`
          : `    ${f.name}: '${f.type}',`,
      )
      .join('\n') || "    // title: 'string',"
  return `import { defineModel } from '@apex-stack/data'

// One definition → zod validation + a Drizzle table + the CREATE TABLE migration
// + a REST resource (list/get/create/update/delete) that is ALSO an MCP tool set.
export default defineModel('${name}', {
  fields: {
${body}
  },
})
`
}

function modelApiTemplate(name: string): string {
  return `import { createDb } from '@apex-stack/data'
import model from '../../models/${name}'

// Auto-served by Apex's API loader: REST at /api/${name} (+ /:id) and MCP tools
// ${name}_list / _get / _create / _update / _delete. Override any op by adding your
// own defineApexRoute here, or swap the connection for Turso/Supabase/Neon/PGlite.
const db = await createDb('data.db')
export default model.resource(db)
`
}

/** SQLite column type for the starter migration (matches defineModel's mapping). */
function sqliteType(t: FieldType): string {
  // timestamp is stored as an ISO string (TEXT) — matches defineModel, and stays
  // portable to Postgres unlike the loose-typed INTEGER SQLite would tolerate.
  return t === 'float'
    ? 'REAL'
    : t === 'string' || t === 'text' || t === 'json' || t === 'timestamp'
      ? 'TEXT'
      : 'INTEGER'
}

function modelMigration(name: string, fields: ParsedField[]): string {
  const cols = [
    '  id INTEGER PRIMARY KEY AUTOINCREMENT',
    ...fields.map((f) => `  ${f.name} ${sqliteType(f.type)}${f.notNull ? ' NOT NULL' : ''}`),
  ]
  return `-- Create the ${name} table. Run \`apex migrate\` (reverse with \`apex migrate --rollback\`).
CREATE TABLE IF NOT EXISTS ${name} (
${cols.join(',\n')}
);

-- @down
DROP TABLE IF EXISTS ${name};
`
}

/** An empty, reversible migration for hand-written schema changes (ALTER, index, trigger, …). */
function migrationFileTemplate(name: string): string {
  return `-- ${name}
-- Any SQL runs here (ALTER TABLE, CREATE INDEX, CREATE TRIGGER, backfills, …).
-- e.g. ALTER TABLE todos ADD COLUMN priority INTEGER DEFAULT 0;
-- e.g. CREATE INDEX idx_todos_done ON todos (done);

-- @down
-- Reverse the change above (run by \`apex migrate --rollback\`).
-- e.g. DROP INDEX idx_todos_done;
`
}

function migrationStamp(): string {
  // Sortable YYYYMMDDHHMMSS prefix so applyMigrations runs files in order.
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
}

type Artifact = { path: string; contents: string }

/** Where a generated artifact lands, and its contents (one or more files). */
// ── Co-generated tests (emitted alongside service/api/model; opt out with --no-test) ──

function serviceTestTemplate(name: string): string {
  const cls = `${pascalCase(name)}Service`
  return `import { describe, expect, it } from 'vitest'
import { ${cls} } from '../services/${cls}'

// Services are plain classes → unit-test them in isolation, no server needed.
describe('${cls}', () => {
  it('works', () => {
    expect(new ${cls}().run('x')).toBe('x')
  })
})
`
}

function apiTestTemplate(name: string): string {
  return `import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '@apex-stack/core/testing'

// The test kit boots your API + MCP surface in-process. Pass { user } to a call to
// authenticate it (skips login) for auth: true routes.
let app: TestApp
beforeAll(async () => {
  app = await createTestApp({ root: process.cwd() })
})
afterAll(() => app.close())

describe('${name} route', () => {
  it('responds over REST', async () => {
    const res = await app.get('/api/${name}?name=world')
    expect(res.status).toBe(200)
  })

  it('is callable as an MCP tool', async () => {
    expect(await app.mcp.listTools()).toContain('${name}')
  })
})
`
}

function modelTestTemplate(name: string): string {
  return `import { createDb, factory } from '@apex-stack/data'
import { describe, expect, it } from 'vitest'
import model from '../models/${name}'

// factory(model) builds schema-valid rows (override any field). An in-memory SQLite db
// (via @libsql/client, the driver you already installed) gives a fresh DB per run.
describe('${name} model', () => {
  it('factory builds a valid row', () => {
    expect(factory(model).make()).toBeDefined()
  })

  it('creates rows in a fresh in-memory db', async () => {
    const db = await createDb({ driver: 'sqlite', url: ':memory:' })
    await db.exec(model.migrationSql('sqlite'))
    await factory(model).createMany(db, 3)
    const rows = await db.query('SELECT COUNT(*) AS n FROM ${name}')
    expect(Number(rows[0]?.n)).toBe(3)
    await db.close()
  })
})
`
}

function plan(
  kind: Kind,
  name: string,
  fieldSpecs: string[],
  root: string,
  withTest = true,
): Artifact[] {
  const test = (file: string, contents: string): Artifact[] =>
    withTest ? [{ path: join(root, 'tests', file), contents }] : []
  switch (kind) {
    case 'page':
      return [{ path: join(root, 'pages', `${name}.alpine`), contents: pageTemplate(name) }]
    case 'component':
      return [
        {
          path: join(root, 'components', `${componentRel(name)}.alpine`),
          contents: componentTemplate(),
        },
      ]
    case 'api':
      return [
        { path: join(root, 'server', 'api', `${name}.ts`), contents: apiTemplate(name) },
        ...test(`${name}.test.ts`, apiTestTemplate(name)),
      ]
    case 'store':
      return [{ path: join(root, 'stores', `${name}.ts`), contents: storeTemplate(name) }]
    case 'layout':
      return [{ path: join(root, 'layouts', `${name}.alpine`), contents: layoutTemplate() }]
    case 'service':
      return [
        {
          path: join(root, 'services', `${pascalCase(name)}Service.ts`),
          contents: serviceTemplate(name),
        },
        ...test(`${pascalCase(name)}Service.test.ts`, serviceTestTemplate(name)),
      ]
    case 'test':
      return [{ path: join(root, 'tests', `${name}.test.ts`), contents: testTemplate(name) }]
    case 'middleware':
      return [{ path: join(root, 'middleware', `${name}.ts`), contents: middlewareTemplate() }]
    case 'migration':
      return [
        {
          path: join(root, 'db', 'migrations', `${migrationStamp()}_${name}.sql`),
          contents: migrationFileTemplate(name),
        },
      ]
    case 'auth':
      return [
        { path: join(root, 'server', 'auth.ts'), contents: authTemplate() },
        { path: join(root, 'server', 'api', 'login.ts'), contents: loginRouteTemplate() },
        { path: join(root, 'server', 'api', 'logout.ts'), contents: logoutRouteTemplate() },
      ]
    case 'client':
      return [{ path: join(root, 'app.client.ts'), contents: clientTemplate() }]
    case 'model': {
      const fields = parseFields(fieldSpecs)
      return [
        { path: join(root, 'models', `${name}.ts`), contents: modelTemplate(name, fields) },
        { path: join(root, 'server', 'api', `${name}.ts`), contents: modelApiTemplate(name) },
        {
          path: join(root, 'db', 'migrations', `${migrationStamp()}_create_${name}.sql`),
          contents: modelMigration(name, fields),
        },
        ...test(`${name}.test.ts`, modelTestTemplate(name)),
      ]
    }
  }
}

export const makeCommand = defineCommand({
  meta: {
    name: 'make',
    description:
      'Generate a page, component, API route, store, layout, service, test, middleware, model, migration, auth, or the Alpine client hook',
  },
  args: {
    kind: {
      type: 'positional',
      required: true,
      description:
        'page | component | api | store | layout | service | test | middleware | model | migration | auth | client',
    },
    // Optional: `apex make auth` takes no name (it always writes server/auth.ts).
    name: { type: 'positional', required: false, description: 'Name (about, Counter, todos, …)' },
    root: { type: 'string', description: 'Project root', default: '.' },
    test: {
      type: 'boolean',
      default: true,
      description: 'Also generate a matching test (service/api/model). Use --no-test to skip.',
    },
  },
  run({ args, rawArgs }) {
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
      'model',
      'migration',
      'auth',
      'client',
    ]
    if (!kinds.includes(kind)) {
      console.error(`\n  Unknown type "${args.kind}". Use: ${kinds.join(' | ')}\n`)
      process.exit(1)
    }
    // `auth` and `client` take no name (they write a fixed file).
    if (kind !== 'auth' && kind !== 'client' && !args.name) {
      console.error(`\n  ✗ A name is required: apex make ${kind} <name>\n`)
      process.exit(1)
    }

    // Extra positionals after `<kind> <name>` are model field specs (title:string …),
    // ignoring flags (--root …). rawArgs preserves order that citty's args object drops.
    const positionals = rawArgs.filter((a) => !a.startsWith('-'))
    const fieldSpecs = kind === 'model' ? positionals.slice(2) : []

    const root = resolve(process.cwd(), args.root)
    let artifacts: Artifact[]
    try {
      artifacts = plan(kind, args.name ?? '', fieldSpecs, root, args.test !== false)
    } catch (err) {
      console.error(`\n  ✗ ${(err as Error).message}\n`)
      process.exit(1)
    }

    for (const { path } of artifacts) {
      if (existsSync(path)) {
        console.error(`\n  ✗ Already exists: ${path}\n`)
        process.exit(1)
      }
    }
    for (const { path, contents } of artifacts) {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, contents)
      console.log(`  ${'\x1b[32m'}✓${'\x1b[0m'} ${path.replace(`${root}/`, '')}`)
    }
    if (kind === 'model') {
      console.log(
        `\n  Next: install the data layer + a driver (\x1b[36mnpm i @apex-stack/data @libsql/client\x1b[0m), ` +
          `run \x1b[36mapex migrate\x1b[0m, then \x1b[36mapex dev\x1b[0m — REST at /api/${args.name} and MCP tools are live.\n`,
      )
    } else if (kind === 'auth') {
      console.log(
        `\n  Next: set a 32+ char \x1b[36msessionPassword\x1b[0m in apex.config.ts runtimeConfig ` +
          `(or \x1b[36mAPEX_SESSION_PASSWORD\x1b[0m), then gate routes with \x1b[36mauth: true\x1b[0m / ` +
          `\x1b[36mcan\x1b[0m and resources with \x1b[36maccess\x1b[0m / \x1b[36mscope\x1b[0m.\n`,
      )
    } else {
      console.log('')
    }
  },
})
