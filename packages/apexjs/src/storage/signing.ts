// HMAC signing for the `local` driver's time-limited URLs. A signed URL is the object route plus
// `?exp=<unix-seconds>&sig=<hex>`, where `sig = HMAC-SHA256(secret, "<path>:<exp>")`. The verifier
// recomputes the MAC, compares it in constant time, and rejects once `exp` has passed. This is the
// filesystem analogue of an S3 presigned GET — a bearer capability that expires. Server-only
// (imports `node:crypto`).
import { createHmac, timingSafeEqual } from 'node:crypto'

/** Normalize a logical object path to a stable, forward-slashed, leading-slash-free key. */
export function normalizeKey(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '')
}

/** Compute the hex HMAC-SHA256 signature binding an object path to an expiry. */
export function signPath(path: string, exp: number, secret: string): string {
  return createHmac('sha256', secret).update(`${normalizeKey(path)}:${exp}`).digest('hex')
}

/**
 * Build the signed query suffix (`exp=…&sig=…`) for an object valid for `expiresInSeconds`.
 * `now` (unix seconds) is injectable for tests.
 */
export function signedQuery(
  path: string,
  expiresInSeconds: number,
  secret: string,
  now: number = Math.floor(Date.now() / 1000),
): string {
  const exp = now + expiresInSeconds
  const sig = signPath(path, exp, secret)
  return `exp=${exp}&sig=${sig}`
}

/**
 * Verify a signed URL. Returns true only when the signature matches AND the URL has not expired.
 * The MAC comparison is constant-time; a malformed hex signature returns false (never throws).
 * `now` (unix seconds) is injectable for tests.
 */
export function verifySignedUrl(
  path: string,
  sig: string,
  exp: number | string,
  secret: string,
  now: number = Math.floor(Date.now() / 1000),
): boolean {
  const expNum = typeof exp === 'string' ? Number(exp) : exp
  if (!Number.isFinite(expNum) || now >= expNum) return false
  const expected = signPath(path, expNum, secret)
  let a: Buffer
  let b: Buffer
  try {
    a = Buffer.from(sig, 'hex')
    b = Buffer.from(expected, 'hex')
  } catch {
    return false
  }
  if (a.length !== b.length || a.length === 0) return false
  return timingSafeEqual(a, b)
}
