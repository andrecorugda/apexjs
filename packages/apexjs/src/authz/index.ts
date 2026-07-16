// @apex-stack/core authz pillar — RBAC (roles/permissions), opaque API tokens, and single-use
// password-reset / email-verification flow tokens. All server-only (they run real `node:crypto` on
// use) and all persist through a passed DB handle (see ./handle.ts). Wire this barrel into the
// server entry: `export * from './authz/index.js'`.

export {
  createFlowTokens,
  type FlowKind,
  type FlowTokens,
  type FlowTokensOptions,
} from './flows.js'
export type { AuthzDbHandle } from './handle.js'
export {
  type AccessControl,
  type AccessControlOptions,
  createAccessControl,
  permissionGate,
} from './roles.js'
export {
  abilitiesGrant,
  createTokenStore,
  type IssuedToken,
  type IssueOptions,
  type TokenStore,
  type TokenStoreOptions,
  type TokenSummary,
  type VerifiedToken,
} from './tokens.js'
