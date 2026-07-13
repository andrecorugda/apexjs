// @apex-stack/core/client — the browser runtime, re-exported so user apps that depend
// on `@apex-stack/core` can import it without needing `@apex-stack/kit` as a direct dependency.

export type {
  ActionOptions,
  ActionState,
  NavOptions,
  ResourceClientOptions,
  ResourceClientState,
} from '@apex-stack/kit/client'
export {
  createAction,
  createResourceClient,
  installNav,
  registerApexComponent,
  // Emitted into page glue by the .alpine compiler for root-x-data plugin magics — MUST
  // stay re-exported here (the compiler imports it from THIS entry). See client.test.ts.
  resolveRootMagic,
} from '@apex-stack/kit/client'
