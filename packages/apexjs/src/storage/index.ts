// Public entry for the storage subsystem. `createStorage(config)` selects a driver by its
// discriminant (`local` — the default — or `s3`) and returns the driver-agnostic {@link Storage}.
// Apps depend only on the `Storage` interface, so swapping filesystem ↔ S3 is a config change.

export { createLocalStorage, StoragePathError } from './local.js'
export { createS3Storage, parseListXml } from './s3.js'
export { normalizeKey, signedQuery, signPath, verifySignedUrl } from './signing.js'
export {
  amzDate,
  encodePath,
  presignGetUrl,
  sha256Hex,
  signingKey,
  signRequest,
  UNSIGNED_PAYLOAD,
} from './sigv4.js'
export type {
  LocalStorageConfig,
  PutOptions,
  S3StorageConfig,
  Storage,
  StorageConfig,
  StorageEntry,
  UrlOptions,
} from './types.js'

import { createLocalStorage } from './local.js'
import { createS3Storage } from './s3.js'
import type { Storage, StorageConfig } from './types.js'

/**
 * Build a {@link Storage} from a driver config. `local` writes files under a base directory (the
 * zero-config default); `s3` targets any S3-compatible object store over `fetch` + SigV4.
 */
export function createStorage(config: StorageConfig): Storage {
  switch (config.driver) {
    case 's3':
      return createS3Storage(config)
    case 'local':
      return createLocalStorage(config)
    default: {
      const exhaustive: never = config
      throw new Error(
        `Unknown storage driver: ${JSON.stringify((exhaustive as { driver?: string }).driver)}`,
      )
    }
  }
}
