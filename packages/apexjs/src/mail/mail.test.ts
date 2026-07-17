import { describe, expect, it, vi } from 'vitest'
import type { FetchInit, FetchResponse } from './httpDriver.js'
import { postmark, resend } from './httpDriver.js'
import { createMailer, normalizeMessage } from './mail.js'
import { escapeHtml, renderTemplate } from './template.js'

/** A minimal ok/JSON `fetch` mock that records the last call. */
function mockFetch(
  body: unknown,
  status = 200,
): (input: string, init: FetchInit) => Promise<FetchResponse> {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return typeof body === 'string' ? body : JSON.stringify(body)
    },
  }))
}

describe('createMailer — memory transport', () => {
  it('captures a sent message with all fields on .sent', async () => {
    const mailer = createMailer() // memory is the default
    const result = await mailer.send({
      to: 'to@example.com',
      from: 'from@example.com',
      subject: 'Hello',
      html: '<b>hi</b>',
      text: 'hi',
      cc: 'cc@example.com',
      bcc: 'bcc@example.com',
      replyTo: 'reply@example.com',
      headers: { 'X-Custom': '1' },
    })

    expect(mailer.sent).toHaveLength(1)
    expect(mailer.sent[0]).toEqual({
      to: ['to@example.com'],
      from: 'from@example.com',
      subject: 'Hello',
      html: '<b>hi</b>',
      text: 'hi',
      cc: ['cc@example.com'],
      bcc: ['bcc@example.com'],
      replyTo: 'reply@example.com',
      headers: { 'X-Custom': '1' },
    })
    expect(result.accepted).toEqual(['to@example.com', 'cc@example.com', 'bcc@example.com'])
    expect(result.id).toBeUndefined()
  })

  it('normalizes multiple recipients (array + single) to string arrays', async () => {
    const mailer = createMailer({ driver: 'memory' })
    await mailer.send({
      to: ['a@example.com', 'b@example.com'],
      cc: 'c@example.com',
      subject: 'Multi',
      text: 'body',
    })
    const sent = mailer.sent[0]
    expect(sent?.to).toEqual(['a@example.com', 'b@example.com'])
    expect(sent?.cc).toEqual(['c@example.com'])
    expect(sent?.bcc).toBeUndefined() // omitted stays omitted
  })
})

describe('normalizeMessage', () => {
  it('drops empty recipient fields and keeps only present optionals', () => {
    const normalized = normalizeMessage({ to: [], cc: '', subject: 'x' })
    expect(normalized).toEqual({ to: [], subject: 'x' })
  })
})

describe('createMailer — http transport', () => {
  it('POSTs JSON with headers and the default body shape', async () => {
    const fetch = mockFetch({ id: 'msg_123' })
    const mailer = createMailer({
      driver: 'http',
      endpoint: 'https://mail.test/send',
      headers: { authorization: 'Bearer key' },
      fetch,
    })

    const result = await mailer.send({
      to: ['a@example.com', 'b@example.com'],
      from: 'from@example.com',
      subject: 'Hi',
      html: '<p>x</p>',
    })

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = (fetch as unknown as { mock: { calls: [string, FetchInit][] } }).mock
      .calls[0] as [string, FetchInit]
    expect(url).toBe('https://mail.test/send')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      'content-type': 'application/json',
      authorization: 'Bearer key',
    })
    expect(JSON.parse(init.body)).toEqual({
      to: ['a@example.com', 'b@example.com'],
      from: 'from@example.com',
      subject: 'Hi',
      html: '<p>x</p>',
    })
    expect(result.id).toBe('msg_123')
    expect(result.accepted).toEqual(['a@example.com', 'b@example.com'])
  })

  it('rejects on a non-2xx response with status + body', async () => {
    const fetch = mockFetch('nope', 422)
    const mailer = createMailer({ driver: 'http', endpoint: 'https://mail.test/send', fetch })
    await expect(mailer.send({ to: 'a@example.com', subject: 's' })).rejects.toThrow(/422.*nope/)
  })

  it('resend preset builds the right request (endpoint, auth, reply_to)', async () => {
    const fetch = mockFetch({ id: 're_1' })
    const mailer = createMailer(resend('re_test_key', { fetch }))
    const result = await mailer.send({
      to: 'to@example.com',
      from: 'from@example.com',
      subject: 'Preset',
      html: '<b>hi</b>',
      replyTo: 'reply@example.com',
    })

    const [url, init] = (fetch as unknown as { mock: { calls: [string, FetchInit][] } }).mock
      .calls[0] as [string, FetchInit]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.headers.authorization).toBe('Bearer re_test_key')
    expect(JSON.parse(init.body)).toEqual({
      from: 'from@example.com',
      to: ['to@example.com'],
      subject: 'Preset',
      html: '<b>hi</b>',
      reply_to: 'reply@example.com',
    })
    expect(result.id).toBe('re_1')
  })

  it('postmark preset uses the server-token header and capitalized fields', async () => {
    const fetch = mockFetch({ MessageID: 'pm_1' })
    const mailer = createMailer(postmark('pm_test_key', { fetch }))
    const result = await mailer.send({
      to: ['a@example.com', 'b@example.com'],
      from: 'from@example.com',
      subject: 'PM',
      text: 'body',
    })

    const [url, init] = (fetch as unknown as { mock: { calls: [string, FetchInit][] } }).mock
      .calls[0] as [string, FetchInit]
    expect(url).toBe('https://api.postmarkapp.com/email')
    expect(init.headers['x-postmark-server-token']).toBe('pm_test_key')
    expect(JSON.parse(init.body)).toEqual({
      From: 'from@example.com',
      To: 'a@example.com, b@example.com',
      Subject: 'PM',
      TextBody: 'body',
    })
    expect(result.id).toBe('pm_1') // extracted from MessageID
  })
})

describe('renderTemplate', () => {
  it('substitutes and HTML-escapes {{ var }} by default', () => {
    const out = renderTemplate('<p>Hi {{ name }}</p>', { name: '<script>&"\'' })
    expect(out).toBe('<p>Hi &lt;script&gt;&amp;&quot;&#39;</p>')
  })

  it('interpolates {{{ var }}} raw (unescaped)', () => {
    const out = renderTemplate('{{{ badge }}} — {{ label }}', {
      badge: '<span>NEW</span>',
      label: '<b>',
    })
    expect(out).toBe('<span>NEW</span> — &lt;b&gt;')
  })

  it('renders numbers/booleans and treats missing/nullish as empty', () => {
    const out = renderTemplate('{{ n }}/{{ ok }}/{{ missing }}/{{ nil }}', {
      n: 42,
      ok: true,
      nil: null,
    })
    expect(out).toBe('42/true//')
  })

  it('escapeHtml handles the five significant characters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;')
  })
})
