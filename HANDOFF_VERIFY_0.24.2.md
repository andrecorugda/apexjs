# Handoff — unbiased verify of `@apex-stack/core@0.24.2` (Windows session)

You are a **fresh, unbiased verifier**. Do **not** trust this document's claims —
reproduce them. Install from **npm** (not from any local build or checkout) so
you test exactly what a user would `npm install`. Report what you actually observe.

## What changed and why (context, not proof)

`apex mcp-server` exposes the Apex CLI to AI agents as MCP tools over stdio.
Two correctness bugs were fixed in **0.24.2**:

1. **`isError` on failed tool calls.** Previously every tool returned a
   success-shaped result even when the underlying CLI command failed, so a
   calling agent could not distinguish failure from success. Now any tool whose
   CLI invocation exits non-zero returns an MCP result with `isError: true`.

2. **`force` on `apex_add`.** The `apex_add` tool now accepts a `force: boolean`
   parameter that appends `--force` to `apex add`, overwriting existing component
   files. Previously the parameter did not exist, so overwrite was impossible via
   the tool.

Prior release 0.24.1 claimed these but shipped only unrelated output-cleanup —
that regression is the reason you're re-verifying. **Assume nothing.**

## Environment

- Node ≥ 20.19, a clean temp dir, network access to npmjs.org.
- Windows: run in PowerShell. Paths below use POSIX `/`; adjust as needed.

## Step 1 — Confirm the published versions

```bash
npm view @apex-stack/core version    # expect 0.24.2
npm view @apex-stack/data version    # expect 0.8.7
```

If core is not `0.24.2`, stop — the build under test is not on npm.

## Step 2 — Scaffold a throwaway app from npm

```bash
npm create apexjs@latest verify-app       # or: npx create-apexjs@latest verify-app
cd verify-app
npm install
```

Confirm the installed core is 0.24.2:

```bash
# NB: `require('@apex-stack/core/package.json')` fails — ./package.json isn't in
# the package exports map. Read it off disk instead:
node -p "JSON.parse(require('fs').readFileSync('node_modules/@apex-stack/core/package.json','utf8')).version"   # expect 0.24.2
```

The scaffold ships some components already in `components/` (e.g. `Button.alpine`).
Confirm that so the "overwrite existing" test is meaningful:

```bash
ls components            # expect Button.alpine present
```

## Step 3 — Drive the MCP server as a real client

The point is to exercise the **tool-call layer** (where `isError` lives), not the
CLI directly. Save this as `verify-mcp.mjs` **inside `verify-app`** so it resolves
the SDK that Apex depends on. It launches `apex mcp-server` over stdio and calls tools.

```js
// verify-app/verify-mcp.mjs
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const ROOT = process.cwd()
// The apex CLI is the published package bin (bin.apex = ./dist/cli.js):
const CLI = 'node_modules/@apex-stack/core/dist/cli.js'

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [CLI, 'mcp-server', '--root', ROOT],
})
const client = new Client({ name: 'verify', version: '0' })
await client.connect(transport)

const list = (await client.listTools()).tools
console.log('TOOLS:', list.map((t) => t.name).join(', '))

const add = list.find((t) => t.name === 'apex_add')
console.log('apex_add exposes `force`:', 'force' in (add.inputSchema.properties ?? {}))

const call = async (name, args) => {
  const r = await client.callTool({ name, arguments: args })
  return { isError: r.isError, text: r.content?.[0]?.text?.slice(0, 160) }
}

// (A) failure must surface as isError:true
const unknown = await call('apex_add', { components: 'definitely-not-real-xyz' })
console.log('\n[A] unknown component -> isError:', unknown.isError, '(EXPECT true)')
console.log('    ', JSON.stringify(unknown.text))

// (B) adding an existing component WITHOUT force -> success (skipped), isError falsy
const noForce = await call('apex_add', { components: 'button' })
console.log('\n[B] existing "button", no force -> isError:', noForce.isError, '(EXPECT undefined/false)')
console.log('    ', JSON.stringify(noForce.text))

// (C) WITH force -> --force appended, file overwritten, success
const withForce = await call('apex_add', { components: 'button', force: true })
console.log('\n[C] existing "button", force:true -> isError:', withForce.isError, '(EXPECT undefined/false)')
console.log('    ', JSON.stringify(withForce.text))

// (D) a read tool -> success
const info = await call('apex_project_info', {})
console.log('\n[D] apex_project_info -> isError:', info.isError, '(EXPECT undefined/false)')

await client.close()
console.log('\nDONE')
```

Run it:

```bash
node verify-mcp.mjs
```

## Step 4 — Pass/fail criteria (this is the whole test)

| # | Observation | Required |
|---|---|---|
| A | `apex_add` unknown component → **`isError: true`** | **MUST** |
| — | `apex_add` exposes `force` in its input schema | **MUST** |
| B | existing "button" no force → `isError` falsy, text says *skipped / use --force* | MUST |
| C | existing "button" `force:true` → `isError` falsy, text says *Added … Button* (overwrote) | **MUST** |
| D | `apex_project_info` → `isError` falsy | MUST |
| — | `TOOLS:` lists 7 tools (make, extend, add, build, list, project_info, test) | should |

**Verdict = PASS** only if A, C, and the `force`-in-schema check all hold, and B/D
show successes are *not* falsely flagged as errors. If A returns
`isError: undefined`, or C fails to overwrite / lacks `force` — the fix did not
ship again; **fail it and say so plainly**, the way 0.24.1 was failed.

## Step 5 — Optional cross-check (stdout stays protocol-clean)

MCP over stdio breaks if anything but protocol hits stdout. Sanity check that the
banner/logs don't leak: the client connecting at all (Step 3) already proves this,
but if curious, run `node node_modules/@apex-stack/core/dist/cli.js mcp-server`
and confirm it emits nothing until it receives a JSON-RPC message on stdin.

## Report back

State the observed value for each of A–D and the `force`-in-schema check
(true/false, not "looks right"), your environment (OS, Node version, installed
core version), and a one-line **PASS / FAIL** verdict. If FAIL, paste the actual
`verify-mcp.mjs` output.

---

### Cleanup after verifying

- Delete `verify-app/`.
- No credentials involved in this verify. (Separately, the Vercel/Supabase tokens
  from the earlier deploy work still need revoking — not part of this task.)
