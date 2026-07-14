// Dependency-free HMAC-SHA256 + a signed-cookie sealer, for environments without WebCrypto
// (`crypto.subtle`) — notably the bare on-device engine an `apex build --mobile` bundle runs in.
// Pure JS, no Node/Web crypto: used only when `globalThis.__APEX_DEVICE__` is set.
//
// The cookie is SIGNED (tamper-proof), not encrypted — appropriate on-device, where the payload
// is the user's own session on their own device. On a server, the sealed+encrypted h3 session
// (iron-webcrypto) is still used.

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

/** SHA-256 of a byte array → 32-byte digest. */
export function sha256(msg: Uint8Array): Uint8Array {
  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ])
  const l = msg.length
  const withOne = l + 1
  const total = withOne + ((64 - ((withOne + 8) % 64)) % 64) + 8
  const p = new Uint8Array(total)
  p.set(msg)
  p[l] = 0x80
  const bits = l * 8
  // 64-bit big-endian length (high 32 bits are ~always 0 for our small payloads).
  const dv = new DataView(p.buffer)
  dv.setUint32(total - 4, bits >>> 0)
  dv.setUint32(total - 8, Math.floor(bits / 0x100000000))

  const w = new Uint32Array(64)
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n))
  for (let i = 0; i < total; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4)
    for (let t = 16; t < 64; t++) {
      const a = w[t - 15] as number
      const b = w[t - 2] as number
      const s0 = rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)
      const s1 = rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10)
      w[t] = (((w[t - 16] as number) + s0 + (w[t - 7] as number) + s1) & 0xffffffff) >>> 0
    }
    let a = h[0] as number
    let b = h[1] as number
    let c = h[2] as number
    let d = h[3] as number
    let e = h[4] as number
    let f = h[5] as number
    let g = h[6] as number
    let hh = h[7] as number
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const t1 = (hh + S1 + ch + (K[t] as number) + (w[t] as number)) >>> 0
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (S0 + maj) >>> 0
      hh = g
      g = f
      f = e
      e = (d + t1) >>> 0
      d = c
      c = b
      b = a
      a = (t1 + t2) >>> 0
    }
    h[0] = ((h[0] as number) + a) >>> 0
    h[1] = ((h[1] as number) + b) >>> 0
    h[2] = ((h[2] as number) + c) >>> 0
    h[3] = ((h[3] as number) + d) >>> 0
    h[4] = ((h[4] as number) + e) >>> 0
    h[5] = ((h[5] as number) + f) >>> 0
    h[6] = ((h[6] as number) + g) >>> 0
    h[7] = ((h[7] as number) + hh) >>> 0
  }
  const out = new Uint8Array(32)
  const odv = new DataView(out.buffer)
  for (let i = 0; i < 8; i++) odv.setUint32(i * 4, h[i] as number)
  return out
}

/** HMAC-SHA256(key, message) → 32-byte digest. */
export function hmacSha256(key: Uint8Array, msg: Uint8Array): Uint8Array {
  const block = 64
  let k = key
  if (k.length > block) k = sha256(k)
  const pad = new Uint8Array(block)
  pad.set(k)
  const ipad = new Uint8Array(block)
  const opad = new Uint8Array(block)
  for (let i = 0; i < block; i++) {
    ipad[i] = (pad[i] as number) ^ 0x36
    opad[i] = (pad[i] as number) ^ 0x5c
  }
  const inner = sha256(concat(ipad, msg))
  return sha256(concat(opad, inner))
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a)
  out.set(b, a.length)
  return out
}

const enc = new TextEncoder()

/** URL-safe base64 of bytes (no padding). */
function b64url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] as number)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fromB64url(s: string): Uint8Array {
  const b = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b + '='.repeat((4 - (b.length % 4)) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** Constant-time-ish comparison of two byte arrays. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= (a[i] as number) ^ (b[i] as number)
  return diff === 0
}

/** Sign `data` into a `payload.signature` token with `password`. */
export function sealHmac(data: unknown, password: string): string {
  const payload = b64url(enc.encode(JSON.stringify(data)))
  const sig = b64url(hmacSha256(enc.encode(password), enc.encode(payload)))
  return `${payload}.${sig}`
}

/** Verify + parse a `sealHmac` token; returns null if missing/tampered/invalid. */
export function unsealHmac(token: string | undefined, password: string): Record<string, unknown> {
  if (!token) return {}
  const dot = token.lastIndexOf('.')
  if (dot < 0) return {}
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = b64url(hmacSha256(enc.encode(password), enc.encode(payload)))
  if (!timingSafeEqual(enc.encode(sig), enc.encode(expected))) return {}
  try {
    return JSON.parse(new TextDecoder().decode(fromB64url(payload))) as Record<string, unknown>
  } catch {
    return {}
  }
}
