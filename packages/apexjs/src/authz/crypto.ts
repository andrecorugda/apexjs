// Crypto primitives for the authz pillar. `node:crypto` is lazy-imported INSIDE each function (never
// at module top level) so statically importing this file stays on-device safe — the node module is
// only pulled in when a hashing/compare/random path actually runs on the server.
//
// Hashing is a bare SHA-256: these are opaque high-entropy secrets (48+ random bytes), not
// low-entropy passwords, so a slow memory-hard KDF buys nothing — a bare digest with a timing-safe
// compare is the correct, standard construction (this is what Sanctum/Fortify do for API tokens).
// Passwords are a different animal — the app hashes those with scrypt via ../auth/password.ts.

/** SHA-256 of a UTF-8 string → lowercase hex digest. */
export async function sha256Hex(input: string): Promise<string> {
  const { createHash } = await import('node:crypto')
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

/**
 * Constant-time comparison of two hex digests. Length mismatch short-circuits to false (the digests
 * are fixed-width, so this leaks nothing). Otherwise `crypto.timingSafeEqual` avoids a timing oracle
 * on the byte-by-byte compare — the whole point of storing a hash you look up and then verify.
 */
export async function timingSafeEqualHex(a: string, b: string): Promise<boolean> {
  const { timingSafeEqual } = await import('node:crypto')
  const ba = Buffer.from(a, 'hex')
  const bb = Buffer.from(b, 'hex')
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

/** A cryptographically random secret, base64url (URL-safe, no padding). Defaults to 48 bytes. */
export async function randomSecret(bytes = 48): Promise<string> {
  const { randomBytes } = await import('node:crypto')
  return randomBytes(bytes).toString('base64url')
}

/** A random opaque id (UUID v4). Used when the caller injects no `idFactory`. */
export async function randomId(): Promise<string> {
  const { randomUUID } = await import('node:crypto')
  return randomUUID()
}
