// The `s3` driver — talks to any S3-compatible object store (AWS S3, MinIO, Cloudflare R2, DO
// Spaces) over plain `fetch`, signing every request with SigV4 (see ./sigv4.ts). No AWS SDK: the
// signing is ~150 lines and keeps the dependency footprint at zero. `url()` returns a SigV4
// presigned GET so browsers can fetch private objects directly. Addressing is virtual-hosted for
// AWS (`<bucket>.s3.<region>.amazonaws.com`) and path-style when a custom `endpoint` is set (what
// MinIO/R2 expect). Server-only (imports `node:crypto` via sigv4).
import { normalizeKey } from './signing.js'
import { presignGetUrl, sha256Hex, signRequest, UNSIGNED_PAYLOAD } from './sigv4.js'
import type { PutOptions, S3StorageConfig, Storage, StorageEntry, UrlOptions } from './types.js'

interface Target {
  protocol: string
  host: string
  /** Request path beginning with `/`, logical (not yet percent-encoded). */
  path: string
}

export function createS3Storage(config: S3StorageConfig): Storage {
  const doFetch = config.fetch ?? globalThis.fetch
  if (typeof doFetch !== 'function') {
    throw new Error('S3 storage: no global fetch available — pass config.fetch')
  }

  /** Resolve the wire host/path for an object key (or the bucket itself when key is ''). */
  const target = (key: string): Target => {
    const clean = normalizeKey(key)
    if (config.endpoint) {
      const u = new URL(config.endpoint)
      const base = u.pathname.replace(/\/+$/, '')
      return {
        protocol: u.protocol,
        host: u.host,
        path: `${base}/${config.bucket}${clean ? `/${clean}` : ''}`,
      }
    }
    return {
      protocol: 'https:',
      host: `${config.bucket}.s3.${config.region}.amazonaws.com`,
      path: `/${clean}`,
    }
  }

  const send = async (
    method: string,
    key: string,
    opts: { body?: Uint8Array; contentType?: string; query?: Record<string, string> } = {},
  ): Promise<Response> => {
    const t = target(key)
    const payloadHash = opts.body ? sha256Hex(opts.body) : method === 'PUT' ? sha256Hex('') : UNSIGNED_PAYLOAD
    const extraHeaders: Record<string, string> = {}
    if (opts.contentType) extraHeaders['content-type'] = opts.contentType
    const { headers } = signRequest({
      method,
      host: t.host,
      path: t.path,
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      query: opts.query,
      headers: extraHeaders,
      payloadHash,
    })
    const qs = opts.query
      ? '?' +
        Object.keys(opts.query)
          .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(opts.query?.[k] ?? '')}`)
          .join('&')
      : ''
    return doFetch(`${t.protocol}//${t.host}${t.path}${qs}`, {
      method,
      headers,
      body: opts.body as BodyInit | undefined,
    })
  }

  return {
    async put(path, data, opts?: PutOptions) {
      const body = typeof data === 'string' ? new TextEncoder().encode(data) : data
      const res = await send('PUT', path, {
        body,
        contentType: opts?.contentType,
      })
      if (!res.ok) throw await s3Error('put', path, res)
    },

    async get(path) {
      const res = await send('GET', path)
      if (res.status === 404) return null
      if (!res.ok) throw await s3Error('get', path, res)
      return new Uint8Array(await res.arrayBuffer())
    },

    async getText(path) {
      const res = await send('GET', path)
      if (res.status === 404) return null
      if (!res.ok) throw await s3Error('get', path, res)
      return res.text()
    },

    async exists(path) {
      const res = await send('HEAD', path)
      if (res.status === 404) return false
      if (!res.ok) throw await s3Error('head', path, res)
      return true
    },

    async delete(path) {
      const res = await send('DELETE', path)
      // S3 returns 204 for a successful delete and also for a missing key.
      if (!res.ok && res.status !== 404) throw await s3Error('delete', path, res)
    },

    async list(prefix?: string) {
      const query: Record<string, string> = { 'list-type': '2' }
      if (prefix) query.prefix = normalizeKey(prefix)
      const res = await send('GET', '', { query })
      if (!res.ok) throw await s3Error('list', prefix ?? '', res)
      return parseListXml(await res.text())
    },

    async url(path, opts?: UrlOptions) {
      const t = target(path)
      if (!opts?.expiresInSeconds) return `${t.protocol}//${t.host}${t.path}`
      return presignGetUrl({
        host: t.host,
        path: t.path,
        region: config.region,
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        expiresSeconds: opts.expiresInSeconds,
        protocol: t.protocol,
      })
    },
  }
}

async function s3Error(op: string, key: string, res: Response): Promise<Error> {
  let body = ''
  try {
    body = await res.text()
  } catch {
    /* ignore */
  }
  return new Error(`S3 ${op} failed for ${JSON.stringify(key)}: ${res.status} ${res.statusText} ${body}`.trim())
}

/** Extract object keys + sizes from a ListObjectsV2 XML response (no XML dep — regex over Contents). */
export function parseListXml(xml: string): StorageEntry[] {
  const out: StorageEntry[] = []
  const contents = /<Contents>([\s\S]*?)<\/Contents>/g
  let m: RegExpExecArray | null
  while ((m = contents.exec(xml)) !== null) {
    const block = m[1] ?? ''
    const key = /<Key>([\s\S]*?)<\/Key>/.exec(block)?.[1]
    if (key === undefined) continue
    const sizeStr = /<Size>(\d+)<\/Size>/.exec(block)?.[1]
    const entry: StorageEntry = { path: decodeXmlEntities(key) }
    if (sizeStr !== undefined) entry.size = Number(sizeStr)
    out.push(entry)
  }
  return out
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
