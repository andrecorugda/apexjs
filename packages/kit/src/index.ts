// @apexjs/kit — public API.
export { parseAlpineFile, AlpineParseError } from './parse/parseAlpineFile.js'
export type {
  AlpineDescriptor,
  ScriptBlock,
  TemplateBlock,
  StyleBlock,
  SourceLocation,
} from './parse/parseAlpineFile.js'

export { evaluate, AlpineEvalError, clearExprCache } from './render/evaluator.js'
export { renderComponent } from './render/renderComponent.js'
export type {
  RenderComponentInput,
  RenderComponentResult,
} from './render/renderComponent.js'
