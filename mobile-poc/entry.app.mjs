import * as m0 from '../examples/showcase/dist/server/components_Badge.mjs'
import * as m1 from '../examples/showcase/dist/server/components_Button.mjs'
import * as m2 from '../examples/showcase/dist/server/components_Card.mjs'
import * as m3 from '../examples/showcase/dist/server/components_Counter.mjs'
import * as m4 from '../examples/showcase/dist/server/layouts_default.mjs'
import * as m5 from '../examples/showcase/dist/server/pages_index.mjs'
import * as m6 from '../examples/showcase/dist/server/server_api_ping.mjs'
import { createProdWebHandler } from '@apex-stack/core/server'
const registry = {
  "components_Badge.mjs": m0,
  "components_Button.mjs": m1,
  "components_Card.mjs": m2,
  "components_Counter.mjs": m3,
  "layouts_default.mjs": m4,
  "pages_index.mjs": m5,
  "server_api_ping.mjs": m6,
}
let _handler
async function handler() { return (_handler ??= await createProdWebHandler({ dir: '/', loadModule: async (f) => registry[f] })) }
export async function run(path) {
  const h = await handler()
  const res = await h(new Request('http://localhost' + (path || '/')))
  const body = await res.text()
  return { status: res.status, contentType: res.headers.get('content-type'), body }
}
