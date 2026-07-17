// AWS Signature Version 4 — the request-signing scheme every S3-compatible store speaks. Two
// entry points: {@link signRequest} builds an `Authorization` header for a live request (used by
// the s3 driver's put/get/delete/head/list), and {@link presignGetUrl} bakes the signature into
// the query string so a plain GET URL works with no headers (the s3 driver's `url()`). Both are
// pure and side-effect-free — no `fetch`, injectable clock — so they can be unit-tested against
// AWS's published presigned-URL vector. Server-only (imports `node:crypto`).
//
// Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html
import { createHash, createHmac } from 'node:crypto'

const ALGORITHM = 'AWS4-HMAC-SHA256'
/** S3 GETs/DELETEs and presigned URLs sign an unsigned payload. */
export const UNSIGNED_PAYLOAD = 'UNSIGNED-PAYLOAD'

/** SHA-256 → lowercase hex. */
export function sha256Hex(data: string | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}

function hmac(key: string | Buffer, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest()
}

/** Derive the SigV4 date-scoped signing key. */
export function signingKey(
  secret: string,
  dateStamp: string,
  region: string,
  service: string,
): Buffer {
  const kDate = hmac(`AWS4${secret}`, dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, service)
  return hmac(kService, 'aws4_request')
}

/** RFC 3986 encode a single query component (encodes `!*'()` that `encodeURIComponent` leaves). */
function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(
    /[!*'()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

/** Encode a URI path, preserving `/` between segments (S3 canonical-URI rules). */
export function encodePath(path: string): string {
  return path
    .split('/')
    .map((seg) => encodeRfc3986(seg))
    .join('/')
}

/** `YYYYMMDDTHHMMSSZ` (amz-date) and its `YYYYMMDD` date stamp for a given instant. */
export function amzDate(now: Date): { amzDate: string; dateStamp: string } {
  const iso = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
  return { amzDate: iso, dateStamp: iso.slice(0, 8) }
}

/** Build the canonical query string: RFC-3986-encode each key/value, then sort by encoded key. */
function canonicalQuery(query: Record<string, string>): string {
  return Object.keys(query)
    .map((k) => [encodeRfc3986(k), encodeRfc3986(query[k] ?? '')] as const)
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
}

export interface SignRequestParams {
  method: string
  host: string
  /** Object path beginning with `/` (already logical, not yet percent-encoded). */
  path: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  service?: string
  /** Extra query params to include in the signature (e.g. `list-type=2`). */
  query?: Record<string, string>
  /** Extra headers to sign, beyond the always-signed `host`/`x-amz-*`. */
  headers?: Record<string, string>
  /** Hex SHA-256 of the body, or `UNSIGNED-PAYLOAD`. Defaults to the empty-body hash. */
  payloadHash?: string
  now?: Date
}

/** The headers to attach to a live, SigV4-header-signed request. */
export interface SignedHeaders {
  headers: Record<string, string>
}

/**
 * Header-based SigV4: returns the full header set (`Authorization`, `x-amz-date`,
 * `x-amz-content-sha256`, plus any extras) to send with the request.
 */
export function signRequest(params: SignRequestParams): SignedHeaders {
  const service = params.service ?? 's3'
  const now = params.now ?? new Date()
  const { amzDate: amz, dateStamp } = amzDate(now)
  const payloadHash = params.payloadHash ?? sha256Hex('')

  const signed: Record<string, string> = {
    host: params.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amz,
    ...lowerKeys(params.headers ?? {}),
  }
  const signedHeaderNames = Object.keys(signed).sort()
  const canonicalHeaders = signedHeaderNames.map((h) => `${h}:${signed[h]?.trim()}\n`).join('')
  const signedHeadersList = signedHeaderNames.join(';')

  const canonicalRequest = [
    params.method.toUpperCase(),
    encodePath(params.path),
    canonicalQuery(params.query ?? {}),
    canonicalHeaders,
    signedHeadersList,
    payloadHash,
  ].join('\n')

  const scope = `${dateStamp}/${params.region}/${service}/aws4_request`
  const stringToSign = [ALGORITHM, amz, scope, sha256Hex(canonicalRequest)].join('\n')
  const signature = createHmac(
    'sha256',
    signingKey(params.secretAccessKey, dateStamp, params.region, service),
  )
    .update(stringToSign, 'utf8')
    .digest('hex')

  const authorization =
    `${ALGORITHM} Credential=${params.accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeadersList}, Signature=${signature}`

  return { headers: { ...signed, Authorization: authorization } }
}

export interface PresignParams {
  host: string
  /** Object path beginning with `/` (already logical, not yet percent-encoded). */
  path: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  expiresSeconds: number
  service?: string
  protocol?: string
  now?: Date
}

/**
 * Query-based SigV4: a presigned GET URL that authenticates via `X-Amz-*` query params, so a bare
 * browser GET works with no headers. Verified against AWS's published presigned-URL test vector.
 */
export function presignGetUrl(params: PresignParams): string {
  const service = params.service ?? 's3'
  const protocol = params.protocol ?? 'https:'
  const now = params.now ?? new Date()
  const { amzDate: amz, dateStamp } = amzDate(now)
  const scope = `${dateStamp}/${params.region}/${service}/aws4_request`

  const query: Record<string, string> = {
    'X-Amz-Algorithm': ALGORITHM,
    'X-Amz-Credential': `${params.accessKeyId}/${scope}`,
    'X-Amz-Date': amz,
    'X-Amz-Expires': String(params.expiresSeconds),
    'X-Amz-SignedHeaders': 'host',
  }

  const canonicalRequest = [
    'GET',
    encodePath(params.path),
    canonicalQuery(query),
    `host:${params.host}\n`,
    'host',
    UNSIGNED_PAYLOAD,
  ].join('\n')

  const stringToSign = [ALGORITHM, amz, scope, sha256Hex(canonicalRequest)].join('\n')
  const signature = createHmac(
    'sha256',
    signingKey(params.secretAccessKey, dateStamp, params.region, service),
  )
    .update(stringToSign, 'utf8')
    .digest('hex')

  const finalQuery = `${canonicalQuery(query)}&X-Amz-Signature=${signature}`
  return `${protocol}//${params.host}${encodePath(params.path)}?${finalQuery}`
}

function lowerKeys(obj: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) out[k.toLowerCase()] = v
  return out
}
