import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStorage } from './index.js'
import { createLocalStorage, StoragePathError } from './local.js'
import { createS3Storage, parseListXml } from './s3.js'
import { signedQuery, verifySignedUrl } from './signing.js'
import { presignGetUrl, signRequest } from './sigv4.js'
import type { Storage } from './types.js'

describe('local driver', () => {
  let dir: string
  let store: Storage

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'apex-storage-'))
    store = createLocalStorage({ driver: 'local', dir, signingSecret: 'top-secret' })
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('round-trips put/get/getText/exists/delete', async () => {
    expect(await store.exists('docs/a.txt')).toBe(false)
    expect(await store.get('docs/a.txt')).toBeNull()
    expect(await store.getText('docs/a.txt')).toBeNull()

    await store.put('docs/a.txt', 'hello world', { contentType: 'text/plain' })
    expect(await store.exists('docs/a.txt')).toBe(true)
    expect(await store.getText('docs/a.txt')).toBe('hello world')
    expect(Array.from((await store.get('docs/a.txt'))!)).toEqual(
      Array.from(new TextEncoder().encode('hello world')),
    )

    await store.delete('docs/a.txt')
    expect(await store.exists('docs/a.txt')).toBe(false)
    // delete is idempotent
    await expect(store.delete('docs/a.txt')).resolves.toBeUndefined()
  })

  it('stores and reads binary data', async () => {
    const bytes = new Uint8Array([0, 1, 2, 253, 254, 255])
    await store.put('bin/blob', bytes)
    expect(Array.from((await store.get('bin/blob'))!)).toEqual(Array.from(bytes))
  })

  it('lists objects, optionally by prefix', async () => {
    await store.put('a/1.txt', '1')
    await store.put('a/2.txt', '22')
    await store.put('b/3.txt', '333')

    const all = await store.list()
    expect(all.map((e) => e.path).sort()).toEqual(['a/1.txt', 'a/2.txt', 'b/3.txt'])
    expect(all.find((e) => e.path === 'a/2.txt')?.size).toBe(2)

    const onlyA = await store.list('a/')
    expect(onlyA.map((e) => e.path).sort()).toEqual(['a/1.txt', 'a/2.txt'])
  })

  it('rejects path traversal that escapes the base dir', async () => {
    await expect(store.put('../escape.txt', 'x')).rejects.toBeInstanceOf(StoragePathError)
    await expect(store.get('../../etc/passwd')).rejects.toBeInstanceOf(StoragePathError)
    await expect(store.put('a/../../escape.txt', 'x')).rejects.toBeInstanceOf(StoragePathError)
    // a `..` that stays inside the base is fine
    await store.put('a/b/../c.txt', 'ok')
    expect(await store.getText('a/c.txt')).toBe('ok')
  })

  it('builds a plain public URL when no expiry is given', async () => {
    expect(await store.url('img/pic.png')).toBe('/storage/img/pic.png')
    const custom = createLocalStorage({ driver: 'local', dir, baseUrl: '/files/' })
    expect(await custom.url('/img/pic.png')).toBe('/files/img/pic.png')
  })

  it('signs a URL that verifySignedUrl accepts, and rejects tampering/expiry', async () => {
    const url = await store.url('img/pic.png', { expiresInSeconds: 3600 })
    const parsed = new URL(url, 'http://host')
    const sig = parsed.searchParams.get('sig')!
    const exp = parsed.searchParams.get('exp')!
    expect(parsed.pathname).toBe('/storage/img/pic.png')

    expect(verifySignedUrl('img/pic.png', sig, exp, 'top-secret')).toBe(true)
    // tampered signature
    expect(verifySignedUrl('img/pic.png', sig.replace(/.$/, '0'), exp, 'top-secret')).toBe(false)
    // tampered path
    expect(verifySignedUrl('img/other.png', sig, exp, 'top-secret')).toBe(false)
    // wrong secret
    expect(verifySignedUrl('img/pic.png', sig, exp, 'wrong')).toBe(false)
    // expired
    expect(verifySignedUrl('img/pic.png', sig, exp, 'top-secret', Number(exp) + 1)).toBe(false)
  })

  it('signedQuery/verifySignedUrl agree over an injected clock', () => {
    const now = 1_000_000
    const q = new URLSearchParams(signedQuery('k/v', 60, 'secret', now))
    const sig = q.get('sig')!
    const exp = q.get('exp')!
    expect(Number(exp)).toBe(now + 60)
    expect(verifySignedUrl('k/v', sig, exp, 'secret', now + 59)).toBe(true)
    expect(verifySignedUrl('k/v', sig, exp, 'secret', now + 60)).toBe(false)
  })

  it('throws when asked for a signed URL without a signing secret', async () => {
    const nosecret = createLocalStorage({ driver: 'local', dir })
    await expect(nosecret.url('x.png', { expiresInSeconds: 60 })).rejects.toThrow(/signingSecret/)
  })

  it('createStorage builds the local driver by default discriminant', async () => {
    const s = createStorage({ driver: 'local', dir })
    await s.put('z.txt', 'zed')
    expect(await s.getText('z.txt')).toBe('zed')
  })
})

describe('SigV4', () => {
  // AWS's published presigned-URL example — a known-answer vector.
  // https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
  it('presignGetUrl matches the AWS presigned-URL test vector', () => {
    const url = presignGetUrl({
      host: 'examplebucket.s3.amazonaws.com',
      path: '/test.txt',
      region: 'us-east-1',
      service: 's3',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      expiresSeconds: 86400,
      now: new Date('2013-05-24T00:00:00.000Z'),
    })
    const parsed = new URL(url)
    expect(parsed.searchParams.get('X-Amz-Signature')).toBe(
      'aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404',
    )
    expect(parsed.searchParams.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256')
    expect(parsed.searchParams.get('X-Amz-Credential')).toBe(
      'AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request',
    )
    expect(parsed.searchParams.get('X-Amz-SignedHeaders')).toBe('host')
  })

  it('signRequest produces a well-formed Authorization header', () => {
    const { headers } = signRequest({
      method: 'GET',
      host: 'examplebucket.s3.amazonaws.com',
      path: '/test.txt',
      region: 'us-east-1',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      now: new Date('2013-05-24T00:00:00.000Z'),
    })
    expect(headers['x-amz-date']).toBe('20130524T000000Z')
    expect(headers.Authorization).toMatch(
      /^AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE\/20130524\/us-east-1\/s3\/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/,
    )
  })
})

describe('parseListXml', () => {
  it('extracts keys and sizes from a ListObjectsV2 response', () => {
    const xml = `<?xml version="1.0"?>
      <ListBucketResult>
        <Contents><Key>a/1.txt</Key><Size>10</Size></Contents>
        <Contents><Key>a/b &amp; c.txt</Key><Size>20</Size></Contents>
      </ListBucketResult>`
    expect(parseListXml(xml)).toEqual([
      { path: 'a/1.txt', size: 10 },
      { path: 'a/b & c.txt', size: 20 },
    ])
  })
})

describe('s3 driver (mocked fetch)', () => {
  const config = {
    driver: 's3' as const,
    bucket: 'my-bucket',
    region: 'eu-west-1',
    accessKeyId: 'AKIA-TEST',
    secretAccessKey: 'secret-test',
  }

  const mockFetch = (impl: (url: string, init?: RequestInit) => Promise<Response>) =>
    vi.fn(impl)

  it('PUTs to the virtual-hosted host with a signed Authorization header', async () => {
    const fetchMock = mockFetch(async () => new Response(null, { status: 200 }))
    const s3 = createS3Storage({ ...config, fetch: fetchMock as unknown as typeof fetch })
    await s3.put('avatars/1.png', new Uint8Array([1, 2, 3]), { contentType: 'image/png' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://my-bucket.s3.eu-west-1.amazonaws.com/avatars/1.png')
    expect(init!.method).toBe('PUT')
    const headers = init!.headers as Record<string, string>
    expect(headers['content-type']).toBe('image/png')
    expect(headers.Authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=AKIA-TEST\//)
    expect(headers['x-amz-content-sha256']).toMatch(/^[0-9a-f]{64}$/)
  })

  it('GET returns bytes on 200 and null on 404', async () => {
    const ok = vi.fn(async () => new Response(new Uint8Array([9, 8, 7]), { status: 200 }))
    const s3ok = createS3Storage({ ...config, fetch: ok as unknown as typeof fetch })
    expect(Array.from((await s3ok.get('x'))!)).toEqual([9, 8, 7])

    const missing = vi.fn(async () => new Response(null, { status: 404 }))
    const s3missing = createS3Storage({ ...config, fetch: missing as unknown as typeof fetch })
    expect(await s3missing.get('x')).toBeNull()
  })

  it('exists uses HEAD and maps 404 → false', async () => {
    const head = mockFetch(async () => new Response(null, { status: 404 }))
    const s3 = createS3Storage({ ...config, fetch: head as unknown as typeof fetch })
    expect(await s3.exists('nope')).toBe(false)
    expect(head.mock.calls[0]![1]!.method).toBe('HEAD')
  })

  it('delete tolerates a 404', async () => {
    const del = mockFetch(async () => new Response(null, { status: 404 }))
    const s3 = createS3Storage({ ...config, fetch: del as unknown as typeof fetch })
    await expect(s3.delete('gone')).resolves.toBeUndefined()
    expect(del.mock.calls[0]![1]!.method).toBe('DELETE')
  })

  it('list issues a list-type=2 query and parses the XML', async () => {
    const xml = `<ListBucketResult><Contents><Key>p/a</Key><Size>1</Size></Contents></ListBucketResult>`
    const listFetch = mockFetch(async () => new Response(xml, { status: 200 }))
    const s3 = createS3Storage({ ...config, fetch: listFetch as unknown as typeof fetch })
    const res = await s3.list('p/')
    expect(res).toEqual([{ path: 'p/a', size: 1 }])
    const url = listFetch.mock.calls[0]![0]
    expect(url).toContain('list-type=2')
    expect(url).toContain('prefix=p%2F')
  })

  it('uses path-style addressing for a custom endpoint', async () => {
    const fetchMock = mockFetch(async () => new Response(null, { status: 200 }))
    const s3 = createS3Storage({
      ...config,
      endpoint: 'https://minio.example.com',
      fetch: fetchMock as unknown as typeof fetch,
    })
    await s3.put('k.txt', 'hi')
    expect(fetchMock.mock.calls[0]![0]).toBe('https://minio.example.com/my-bucket/k.txt')
  })

  it('url() returns a presigned GET URL with an expiry', async () => {
    const s3 = createS3Storage(config)
    const url = await s3.url('avatars/1.png', { expiresInSeconds: 900 })
    const parsed = new URL(url)
    expect(parsed.host).toBe('my-bucket.s3.eu-west-1.amazonaws.com')
    expect(parsed.pathname).toBe('/avatars/1.png')
    expect(parsed.searchParams.get('X-Amz-Expires')).toBe('900')
    expect(parsed.searchParams.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/)
    // plain public URL without expiry
    expect(await s3.url('avatars/1.png')).toBe('https://my-bucket.s3.eu-west-1.amazonaws.com/avatars/1.png')
  })
})
