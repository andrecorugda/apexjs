// @apex-stack/kit — public API.

export type {
  AlpineDescriptor,
  ScriptBlock,
  SourceLocation,
  StyleBlock,
  TemplateBlock,
} from './parse/parseAlpineFile.js'
export { AlpineParseError, parseAlpineFile } from './parse/parseAlpineFile.js'
export type { ComponentEntry, ComponentRegistry } from './render/components.js'
export { rewriteComponentTags } from './render/components.js'
export { AlpineEvalError, clearExprCache, evaluate } from './render/evaluator.js'
export { serializeState, stateIsland } from './render/island.js'
export type {
  ClientDirective,
  RenderComponentInput,
  RenderComponentResult,
  RenderIslandsResult,
} from './render/renderComponent.js'
export {
  renderComponent,
  renderFragment,
  renderIslands,
} from './render/renderComponent.js'
export { scopeCss } from './style/scopedCss.js'
