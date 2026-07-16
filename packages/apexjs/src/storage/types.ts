// The Storage contract — a small, driver-agnostic surface for file/object persistence (uploads,
// avatars, documents). Pure types + config shapes, NO node/h3 imports, so this stays importable
// anywhere (it is the leaf every driver implements). The concrete drivers (`local`, `s3`) live
// alongside and are selected by {@link createStorage}. Named `Storage` for the object-store role —
// distinct from the client-side `defineStore`/`ApexStore` (global UI state) in the main entry.

/** Options for a single write. */
export interface PutOptions {
  /** MIME type recorded with the object (S3 `Content-Type`; advisory for the local driver). */
  contentType?: string
}

/** Options for building a URL to an object. */
export interface UrlOptions {
  /**
   * When set, produce a time-limited URL that stops working after this many seconds:
   * an HMAC-signed route for the `local` driver, a SigV4 presigned GET for `s3`. Omit for a
   * plain public URL (the caller is responsible for the object actually being public).
   */
  expiresInSeconds?: number
}

/** One entry returned by {@link Storage.list}. */
export interface StorageEntry {
  /** Logical object path (forward-slashed, relative to the store root). */
  path: string
  /** Size in bytes, when the driver can report it cheaply. */
  size?: number
}

/**
 * A file/object store. All paths are logical, forward-slashed keys relative to the store root
 * (leading slashes are ignored). Implementations must reject paths that escape the root.
 */
export interface Storage {
  /** Write bytes (or a UTF-8 string) at `path`, creating parents as needed. Overwrites. */
  put(path: string, data: string | Uint8Array, opts?: PutOptions): Promise<void>
  /** Read raw bytes, or `null` when the object does not exist. */
  get(path: string): Promise<Uint8Array | null>
  /** Read + UTF-8 decode, or `null` when the object does not exist. */
  getText(path: string): Promise<string | null>
  /** Whether an object exists at `path`. */
  exists(path: string): Promise<boolean>
  /** Delete `path`. Idempotent — deleting a missing object is not an error. */
  delete(path: string): Promise<void>
  /** List objects whose path starts with `prefix` (all objects when omitted). */
  list(prefix?: string): Promise<StorageEntry[]>
  /** A public URL, or a time-limited signed URL when `opts.expiresInSeconds` is set. */
  url(path: string, opts?: UrlOptions): Promise<string>
}

/** Config for the filesystem-backed `local` driver (the zero-config default). */
export interface LocalStorageConfig {
  driver: 'local'
  /** Base directory objects live under. Created on first write. */
  dir: string
  /**
   * Public route prefix `url()` builds against. Default `/storage`. A path `a/b.png` becomes
   * `<baseUrl>/a/b.png`.
   */
  baseUrl?: string
  /**
   * HMAC secret for signed URLs. Required to call `url(path, { expiresInSeconds })`; plain
   * public URLs work without it.
   */
  signingSecret?: string
}

/** Config for the `s3` (S3-compatible) driver. */
export interface S3StorageConfig {
  driver: 's3'
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  /**
   * Custom S3-compatible endpoint (MinIO, R2, Spaces …), e.g. `https://minio.example.com`.
   * When set, path-style addressing is used (`<endpoint>/<bucket>/<key>`). When omitted, AWS
   * virtual-hosted style is used (`https://<bucket>.s3.<region>.amazonaws.com/<key>`).
   */
  endpoint?: string
  /** Injectable fetch (defaults to global `fetch`) — for testing / custom agents. */
  fetch?: typeof fetch
}

/** The discriminated config union accepted by {@link createStorage}. */
export type StorageConfig = LocalStorageConfig | S3StorageConfig
