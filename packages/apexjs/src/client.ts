// @apex-stack/core/client — the browser runtime, re-exported so user apps that depend
// on `@apex-stack/core` can import it without needing `@apex-stack/kit` as a direct dependency.

export type { ActionOptions, ActionState, NavOptions } from '@apex-stack/kit/client'
export { createAction, installNav, registerApexComponent } from '@apex-stack/kit/client'
