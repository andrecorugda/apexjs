import { cloudflarePreset } from './cloudflare.js'
import { dockerPreset } from './docker.js'
import { netlifyPreset } from './netlify.js'
import type { DeployPreset } from './types.js'
import { vercelPreset } from './vercel.js'

export { collectCloudflareAssets, emitCloudflarePreset } from './cloudflare.js'
export { emitDockerPreset } from './docker.js'
export { emitNetlifyPreset } from './netlify.js'
export type { DeployPreset, DeployPresetContext } from './types.js'
export { emitVercelPreset } from './vercel.js'

/** Registry of built-in deploy presets, keyed by `--preset` name. */
export const deployPresets: Record<string, DeployPreset> = {
  [vercelPreset.name]: vercelPreset,
  [netlifyPreset.name]: netlifyPreset,
  [dockerPreset.name]: dockerPreset,
  [cloudflarePreset.name]: cloudflarePreset,
}

/** Look a preset up by `--preset` value; undefined for an unknown name. */
export function resolveDeployPreset(name: string): DeployPreset | undefined {
  return deployPresets[name]
}
