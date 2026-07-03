// apexjs-kit — public API.
export { parseAlpineFile, AlpineParseError } from './parse/parseAlpineFile.js'
export type {
  AlpineDescriptor,
  ScriptBlock,
  TemplateBlock,
  StyleBlock,
  SourceLocation,
} from './parse/parseAlpineFile.js'

export { evaluate, AlpineEvalError, clearExprCache } from './render/evaluator.js'
export {
  renderComponent,
  renderFragment,
  renderIslands,
} from './render/renderComponent.js'
export type {
  RenderComponentInput,
  RenderComponentResult,
  RenderIslandsResult,
  ClientDirective,
} from './render/renderComponent.js'
export { rewriteComponentTags } from './render/components.js'
export type { ComponentEntry, ComponentRegistry } from './render/components.js'
export { serializeState, stateIsland } from './render/island.js'
export { scopeCss } from './style/scopedCss.js'
