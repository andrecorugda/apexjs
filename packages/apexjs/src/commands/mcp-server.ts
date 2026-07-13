import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineCommand } from 'citty'
import { z } from 'zod'
import { componentName } from '../components/registry.js'
import { mountedApiPath, parseModelInfo, parseRouteInfo } from '../introspect/projectKnowledge.js'
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
  'client',
] as const

// ESC written without a literal control char (keeps the linter happy).
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')

/** Run the CLI and return clean, agent-friendly text: ANSI stripped, the ASCII
 * brand banner removed, and failures reported usefully (not "code null"). */
function runApex(args: string[], cwd: string): { text: string; ok: boolean } {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' })
  if (r.error) return { text: `apex failed to run: ${r.error.message}`, ok: false }
  const clean = `${r.stdout ?? ''}\n${r.stderr ?? ''}`
    .replace(ANSI, '')
    .split('\n')
    .filter((l) => !/[█╗╝╔═║╚]/.test(l) && !/The full-stack, AI-native/.test(l))
    .join('\n')
    .trim()
  const ok = r.status === 0
  const text =
    clean ||
    (ok
      ? 'done'
      : r.status != null
        ? `apex exited with code ${r.status}`
        : `apex terminated with no output${r.signal ? ` (signal ${r.signal})` : ''}`)
  return { text, ok }
}

/** An MCP tool result. `isError: true` is set on failure so a client can tell
 * failure from success — the text body alone isn't enough. */
function result(text: string, isError = false) {
  return isError
    ? { content: [{ type: 'text' as const, text }], isError: true }
    : { content: [{ type: 'text' as const, text }] }
}

/** Run the CLI and return an MCP result carrying its success/failure. */
function run(args: string[], cwd: string) {
  const r = runApex(args, cwd)
  return result(r.text, !r.ok)
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

/** Read a file, returning '' if it can't be read (missing/permission). */
function readSafe(p: string): string {
  try {
    return readFileSync(p, 'utf8')
  } catch {
    return ''
  }
}

/** A machine-readable map of an Apex app — so an agent can read before it writes.
 * Routes/models carry their SHAPE (method + mount + mcp/auth flags; table + fields
 * + behaviors), so an agent can act — "add a `views:int` field to Post" — without
 * having to open and parse the files itself. */
function projectInfo(root: string) {
  const apiDir = join(root, 'server', 'api')
  const modelsDir = join(root, 'models')
  return {
    routes: existsSync(join(root, 'pages'))
      ? scanPages(root).map((r) => ({ url: r.pattern, dynamic: r.isDynamic }))
      : [],
    apiRoutes: listFiles(apiDir, '.ts').map((file) => ({
      file,
      path: mountedApiPath(file),
      ...parseRouteInfo(readSafe(join(apiDir, file))),
    })),
    models: listFiles(modelsDir, '.ts').map((file) => ({
      file,
      ...parseModelInfo(readSafe(join(modelsDir, file))),
    })),
    components: listFiles(join(root, 'components'), '.alpine').map((file) => ({
      file,
      tag: componentName(file.replace(/\.alpine$/, '')),
    })),
    features: {
      auth: existsSync(join(root, 'server', 'auth.ts')),
      i18n: existsSync(join(root, 'locales')),
      data: existsSync(modelsDir) || existsSync(join(root, 'db', 'index.ts')),
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
          'Generate a file in an Apex app. Kinds: page, component, api, service, store, layout, middleware, test, model, migration, auth, client. For a model, pass fields like "title:string done:boolean". A page or component name may include a folder (e.g. "ui/Card") to group it — the folder is created, and a nested component\'s tag is namespaced by folder (components/ui/Card.alpine → <UiCard/>). The "client" kind (no name) scaffolds app.client.ts — the hook that runs before Alpine.start() where you register Alpine plugins ($persist, x-intersect, x-mask, …), custom directives, and magics.',
        inputSchema: {
          kind: z.enum(KINDS),
          name: z.string(),
          fields: z.string().optional(),
          root: z.string().optional(),
        },
      },
      async (a) => {
        const extra = a.fields ? a.fields.split(/\s+/).filter(Boolean) : []
        return run(['make', a.kind, a.name, ...extra], rootOf(a))
      },
    )

    server.registerTool(
      'apex_extend',
      {
        description:
          'Add an optional feature to an Apex app: data (DB model + REST/MCP CRUD + a demo page), auth (sealed-cookie sessions + login/logout + gated route), or i18n (locales + /<locale> routing). Idempotent.',
        inputSchema: { feature: z.enum(['data', 'auth', 'i18n']), root: z.string().optional() },
      },
      async (a) => run(['extend', a.feature], rootOf(a)),
    )

    server.registerTool(
      'apex_add',
      {
        description:
          'Add themeable UI components (space-separated), e.g. "button card modal". A name may carry a folder (e.g. "ui/button") to copy it into components/ui/ (namespaced tag <UiButton/>). Pass force:true to overwrite existing files.',
        inputSchema: {
          components: z.string(),
          force: z.boolean().optional(),
          root: z.string().optional(),
        },
      },
      async (a) =>
        run(
          ['add', ...a.components.split(/\s+/).filter(Boolean), ...(a.force ? ['--force'] : [])],
          rootOf(a),
        ),
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
        return run(['build', ...flags], rootOf(a))
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
        if (a.what === 'make-kinds') return result(KINDS.join(' '))
        if (a.what === 'features') return run(['extend'], rootOf(a))
        return run(['add'], rootOf(a))
      },
    )

    server.registerTool(
      'apex_project_info',
      {
        description:
          'Read the current Apex app: page routes; API routes with their method, mounted path, and mcp/auth flags; models with their table, fields (name/type/notNull/default) and behaviors; components with their &lt;Tag&gt; name (folder-namespaced); and which features (auth/i18n/data) are installed. Gives enough shape to act (e.g. add a field to a model) without opening files. Use this to understand an app before changing it.',
        inputSchema: { root: z.string().optional() },
      },
      async (a) => result(JSON.stringify(projectInfo(rootOf(a)), null, 2)),
    )

    server.registerTool(
      'apex_test',
      {
        description:
          "Run the app's tests once with Vitest (optionally filtered by a name pattern). Use it to verify your changes.",
        inputSchema: { pattern: z.string().optional(), root: z.string().optional() },
      },
      async (a) => run(['test', 'run', ...(a.pattern ? [a.pattern] : [])], rootOf(a)),
    )

    server.registerTool(
      'apex_check',
      {
        description:
          "Type-check the app (tsc --noEmit; uses the native compiler when installed). Run this after generating or editing code to catch type errors before running tests — it's the fast type gate in the write→check→test loop. Fails (isError) when there are type errors, with the errors in the output.",
        inputSchema: { root: z.string().optional() },
      },
      async (a) => run(['check'], rootOf(a)),
    )

    await server.connect(new StdioServerTransport())
  },
})
