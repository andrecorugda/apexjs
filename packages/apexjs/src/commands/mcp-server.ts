import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineCommand } from 'citty'
import { z } from 'zod'
import { scanPages } from '../routing/router.js'
import { VERSION } from '../ui.js'

// An MCP server that exposes the Apex CLI itself as tools over stdio — so an AI
// agent can scaffold, extend, add, and build an Apex app by CALLING TOOLS instead
// of shelling out or hand-writing files. Point your agent host at:
//   command: "apex", args: ["mcp-server"]   (or "npx apex mcp-server")
//
// stdout is the MCP channel — this command writes NOTHING to it except protocol.

const CLI = fileURLToPath(new URL('./cli.js', import.meta.url))
const KINDS = [
  'page',
  'component',
  'api',
  'service',
  'store',
  'layout',
  'middleware',
  'test',
  'model',
  'migration',
  'auth',
] as const

function runApex(args: string[], cwd: string): string {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' })
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim()
  return out || (r.status === 0 ? 'done' : `apex exited with code ${r.status}`)
}

function text(t: string) {
  return { content: [{ type: 'text' as const, text: t }] }
}

/** List files with an extension under a dir (recursive), relative paths. */
function listFiles(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  const walk = (d: string, rel: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) walk(join(d, e.name), r)
      else if (e.name.endsWith(ext)) out.push(r)
    }
  }
  walk(dir, '')
  return out
}

/** A machine-readable map of an Apex app — so an agent can read before it writes. */
function projectInfo(root: string) {
  return {
    routes: existsSync(join(root, 'pages'))
      ? scanPages(root).map((r) => ({ url: r.pattern, dynamic: r.isDynamic }))
      : [],
    apiRoutes: listFiles(join(root, 'server', 'api'), '.ts'),
    models: listFiles(join(root, 'models'), '.ts'),
    components: listFiles(join(root, 'components'), '.alpine'),
    features: {
      auth: existsSync(join(root, 'server', 'auth.ts')),
      i18n: existsSync(join(root, 'locales')),
      data: existsSync(join(root, 'models')) || existsSync(join(root, 'db', 'index.ts')),
    },
  }
}

export const mcpServerCommand = defineCommand({
  meta: {
    name: 'mcp-server',
    description: 'Run an MCP server exposing the Apex CLI as tools (stdio) — for AI agents',
  },
  args: {
    root: {
      type: 'string',
      description: 'Default project root the tools operate on',
      default: '.',
    },
  },
  async run({ args }) {
    const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js')
    const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js')

    const defaultRoot = resolve(process.cwd(), String(args.root))
    const rootOf = (a: { root?: string }) => (a.root ? resolve(process.cwd(), a.root) : defaultRoot)

    const server = new McpServer({ name: 'apex-cli', version: VERSION })

    server.registerTool(
      'apex_make',
      {
        description:
          'Generate a file in an Apex app. Kinds: page, component, api, service, store, layout, middleware, test, model, migration, auth. For a model, pass fields like "title:string done:boolean".',
        inputSchema: {
          kind: z.enum(KINDS),
          name: z.string(),
          fields: z.string().optional(),
          root: z.string().optional(),
        },
      },
      async (a) => {
        const extra = a.fields ? a.fields.split(/\s+/).filter(Boolean) : []
        return text(runApex(['make', a.kind, a.name, ...extra], rootOf(a)))
      },
    )

    server.registerTool(
      'apex_extend',
      {
        description:
          'Add an optional feature to an Apex app: data (DB model + REST/MCP CRUD + a demo page), auth (sealed-cookie sessions + login/logout + gated route), or i18n (locales + /<locale> routing). Idempotent.',
        inputSchema: { feature: z.enum(['data', 'auth', 'i18n']), root: z.string().optional() },
      },
      async (a) => text(runApex(['extend', a.feature], rootOf(a))),
    )

    server.registerTool(
      'apex_add',
      {
        description: 'Add themeable UI components (space-separated), e.g. "button card modal".',
        inputSchema: { components: z.string(), root: z.string().optional() },
      },
      async (a) => text(runApex(['add', ...a.components.split(/\s+/).filter(Boolean)], rootOf(a))),
    )

    server.registerTool(
      'apex_build',
      {
        description:
          'Build the app. Pass a deploy preset (vercel | netlify | docker) to also generate host config, or server:true for a Node server target.',
        inputSchema: {
          preset: z.enum(['vercel', 'netlify', 'docker']).optional(),
          server: z.boolean().optional(),
          root: z.string().optional(),
        },
      },
      async (a) => {
        const flags = a.preset ? ['--preset', a.preset] : a.server ? ['--server'] : []
        return text(runApex(['build', ...flags], rootOf(a)))
      },
    )

    server.registerTool(
      'apex_list',
      {
        description:
          'Discover what you can do: "features" (apex extend options), "components" (apex add registry), or "make-kinds".',
        inputSchema: {
          what: z.enum(['features', 'components', 'make-kinds']),
          root: z.string().optional(),
        },
      },
      async (a) => {
        if (a.what === 'make-kinds') return text(KINDS.join(' '))
        if (a.what === 'features') return text(runApex(['extend'], rootOf(a)))
        return text(runApex(['add'], rootOf(a)))
      },
    )

    server.registerTool(
      'apex_project_info',
      {
        description:
          'Read the current Apex app: its routes (from pages/), API routes, models, components, and which features (auth/i18n/data) are installed. Use this to understand an app before changing it.',
        inputSchema: { root: z.string().optional() },
      },
      async (a) => text(JSON.stringify(projectInfo(rootOf(a)), null, 2)),
    )

    server.registerTool(
      'apex_test',
      {
        description:
          "Run the app's tests once with Vitest (optionally filtered by a name pattern). Use it to verify your changes.",
        inputSchema: { pattern: z.string().optional(), root: z.string().optional() },
      },
      async (a) => text(runApex(['test', 'run', ...(a.pattern ? [a.pattern] : [])], rootOf(a))),
    )

    await server.connect(new StdioServerTransport())
  },
})
