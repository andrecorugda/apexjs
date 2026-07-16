// Password hashing for app auth flows — scrypt (memory-hard KDF) from `node:crypto`, with a
// per-hash random salt and a constant-time comparison on verify. Server-only (imports
// node:crypto); it is NOT wired into the request path — it's a primitive apps call from their
// own login/register routes. Format is self-describing so parameters can evolve:
//
//   scrypt$N$r$p$<salt-base64>$<hash-base64>
//
// Prefer this over storing plaintext or a bare SHA — scrypt is deliberately slow + memory-hard,
// so an attacker who steals the hashes still can't brute-force them cheaply.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'

// scrypt cost params — N (CPU/memory cost), r (block size), p (parallelism). Defaults chosen for
// a ~interactive login cost. `maxmem` is raised so N=16384 doesn't hit the default 32 MB ceiling.
const N = 16384
const R = 8
const P = 1
const KEYLEN = 64
const SALT_BYTES = 16

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, KEYLEN, { N, r: R, p: P, maxmem: 128 * N * R * 2 }, (err, dk) => {
      if (err) reject(err)
      else resolve(dk)
    })
  })
}

/** Hash a plaintext password → a self-describing `scrypt$...` string safe to store. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const derived = await scrypt(password, salt)
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${derived.toString('base64')}`
}

/**
 * Verify a plaintext password against a stored hash. Returns false (never throws) for a
 * malformed/foreign hash string. The final compare is constant-time to avoid a timing oracle.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, nRaw, rRaw, pRaw, saltB64, hashB64] = parts as [
    string,
    string,
    string,
    string,
    string,
    string,
  ]
  const n = Number(nRaw)
  const r = Number(rRaw)
  const p = Number(pRaw)
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false
  let expected: Buffer
  try {
    expected = Buffer.from(hashB64, 'base64')
  } catch {
    return false
  }
  const salt = Buffer.from(saltB64, 'base64')
  const derived = await new Promise<Buffer | null>((resolve) => {
    scryptCb(password, salt, expected.length, { N: n, r, p, maxmem: 128 * n * r * 2 }, (err, dk) =>
      resolve(err ? null : dk),
    )
  })
  if (!derived || derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}
