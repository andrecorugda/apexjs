// The API-based mail transport: POST a JSON body to a provider's send endpoint via `fetch`. It is
// deliberately generic — `mapBody` shapes the request for any provider — with `resend`/`postmark`
// presets that fill endpoint + auth header + body mapping from an apiKey. No bespoke SDK, no
// top-level `node:` import: `fetch` is global on every target runtime.
import type { Mailer, NormalizedMessage, SendResult } from './mail.js'
import { allRecipients, normalizeMessage } from './mail.js'

/** The `fetch` signature this transport depends on — injectable so tests can supply a mock. */
export type FetchLike = (input: string, init: FetchInit) => Promise<FetchResponse>

/** The subset of `RequestInit` the transport sets. */
export interface FetchInit {
  method: string
  headers: Record<string, string>
  body: string
}

/** The subset of `Response` the transport reads. */
export interface FetchResponse {
  ok: boolean
  status: number
  text(): Promise<string>
}

/**
 * Config for the http transport. `endpoint` is the provider's send URL; `headers` carries auth;
 * `mapBody` turns a normalized message into the provider's request body (defaults to a common
 * `{ from, to, subject, html, text, ... }` JSON shape). Pass `fetch` to inject a mock in tests.
 */
export interface HttpMailConfig {
  driver: 'http'
  endpoint: string
  headers?: Record<string, string>
  mapBody?: (message: NormalizedMessage) => unknown
  fetch?: FetchLike
}

/** The default provider-agnostic body: a normalized message with array recipient fields. */
function defaultMapBody(message: NormalizedMessage): unknown {
  return message
}

/** Resolve the fetch implementation: the injected one, else the runtime global. */
function resolveFetch(injected: FetchLike | undefined): FetchLike {
  if (injected) return injected
  const globalFetch = (globalThis as { fetch?: unknown }).fetch
  if (typeof globalFetch !== 'function') {
    throw new Error('mail(http): global fetch is unavailable — pass `fetch` in the config')
  }
  return globalFetch as unknown as FetchLike
}

/** Try to pull a provider message id out of a parsed JSON response; `undefined` if none. */
function extractId(raw: unknown): string | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined
  const record = raw as Record<string, unknown>
  const candidate = record.id ?? record.MessageID ?? record.message_id
  return typeof candidate === 'string' ? candidate : undefined
}

/** Build the http {@link Mailer}. Non-2xx responses reject with the status and body text. */
export function createHttpMailer(config: HttpMailConfig): Mailer {
  const doFetch = resolveFetch(config.fetch)
  const mapBody = config.mapBody ?? defaultMapBody
  return {
    async send(message): Promise<SendResult> {
      const normalized = normalizeMessage(message)
      const response = await doFetch(config.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...config.headers },
        body: JSON.stringify(mapBody(normalized)),
      })
      const bodyText = await response.text()
      if (!response.ok) {
        throw new Error(`mail(http): ${response.status} from ${config.endpoint}: ${bodyText}`)
      }
      let raw: unknown
      try {
        raw = bodyText.length > 0 ? JSON.parse(bodyText) : undefined
      } catch {
        raw = bodyText // provider returned non-JSON; hand back the text
      }
      const result: SendResult = { accepted: allRecipients(normalized), raw }
      const id = extractId(raw)
      if (id !== undefined) result.id = id
      return result
    },
  }
}

// --- Provider presets --------------------------------------------------------------------------
// Each preset returns a ready {@link HttpMailConfig}; spread extra fields (e.g. `fetch`) to override.

/** Options common to the presets. */
export interface PresetOptions {
  /** Inject a mock `fetch` (tests) or a custom implementation. */
  fetch?: FetchLike
}

/**
 * Resend (https://resend.com) preset. Maps to `POST /emails` with a Bearer key and Resend's field
 * names (`reply_to`). Provide `from` on each message — Resend requires it.
 */
export function resend(apiKey: string, options: PresetOptions = {}): HttpMailConfig {
  const config: HttpMailConfig = {
    driver: 'http',
    endpoint: 'https://api.resend.com/emails',
    headers: { authorization: `Bearer ${apiKey}` },
    mapBody: (m) => ({
      from: m.from,
      to: m.to,
      subject: m.subject,
      ...(m.html !== undefined ? { html: m.html } : {}),
      ...(m.text !== undefined ? { text: m.text } : {}),
      ...(m.cc ? { cc: m.cc } : {}),
      ...(m.bcc ? { bcc: m.bcc } : {}),
      ...(m.replyTo !== undefined ? { reply_to: m.replyTo } : {}),
      ...(m.headers ? { headers: m.headers } : {}),
    }),
  }
  if (options.fetch) config.fetch = options.fetch
  return config
}

/**
 * Postmark (https://postmarkapp.com) preset. Maps to `POST /email` with the `X-Postmark-Server-Token`
 * header and Postmark's capitalized field names (`From`, `To`, `HtmlBody`, …).
 */
export function postmark(apiKey: string, options: PresetOptions = {}): HttpMailConfig {
  const config: HttpMailConfig = {
    driver: 'http',
    endpoint: 'https://api.postmarkapp.com/email',
    headers: { accept: 'application/json', 'x-postmark-server-token': apiKey },
    mapBody: (m) => ({
      From: m.from,
      To: m.to.join(', '),
      Subject: m.subject,
      ...(m.html !== undefined ? { HtmlBody: m.html } : {}),
      ...(m.text !== undefined ? { TextBody: m.text } : {}),
      ...(m.cc ? { Cc: m.cc.join(', ') } : {}),
      ...(m.bcc ? { Bcc: m.bcc.join(', ') } : {}),
      ...(m.replyTo !== undefined ? { ReplyTo: m.replyTo } : {}),
    }),
  }
  if (options.fetch) config.fetch = options.fetch
  return config
}
