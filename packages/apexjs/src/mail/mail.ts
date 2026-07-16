// A small mail subsystem: one `Mailer` interface, one `createMailer` factory, three transports
// (`memory`, `http`, `smtp`). The factory + interface + config-object shape mirrors the cache and
// security primitives (see cache/cache.ts, security/kvStore.ts).
//
// On-device safe: this module has NO top-level `node:` import, so the `memory` and `http` paths run
// on a bare JS engine (QuickJS et al.) — `http` uses global `fetch`. The `smtp` transport lives in
// ./smtpDriver.ts and lazy-imports `node:net`/`node:tls` inside its send, so importing it never
// pulls those in at load time.

import { createHttpMailer, type HttpMailConfig } from './httpDriver.js'
import { createSmtpMailer, type SmtpMailConfig } from './smtpDriver.js'

/** A message to send. `to`/`cc`/`bcc` accept one address or many; only `subject` is required. */
export interface MailMessage {
  to: string | string[]
  from?: string
  subject: string
  html?: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string
  headers?: Record<string, string>
}

/**
 * A {@link MailMessage} after normalization: recipient fields are always string arrays, so
 * transports and the memory `.sent` log see one canonical shape regardless of caller input.
 */
export interface NormalizedMessage {
  to: string[]
  from?: string
  subject: string
  html?: string
  text?: string
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  headers?: Record<string, string>
}

/** The outcome of a send. `accepted` lists the recipients handed to the transport. */
export interface SendResult {
  /** Provider message id when the transport returns one (http/smtp); `undefined` for memory. */
  id?: string
  /** Recipients the transport accepted — `to` ∪ `cc` ∪ `bcc` after normalization. */
  accepted: string[]
  /** The transport's raw response, when it has one (e.g. parsed JSON from an http provider). */
  raw?: unknown
}

/** The mailer surface. One method: send a message, get a {@link SendResult}. */
export interface Mailer {
  send(message: MailMessage): Promise<SendResult>
}

/**
 * The in-memory {@link Mailer} returned by the default (`memory`) transport. It never talks to the
 * network — every send is appended to {@link MemoryMailer.sent}, which dev tooling and tests read.
 */
export interface MemoryMailer extends Mailer {
  /** Every message sent through this mailer, in order, after normalization. */
  readonly sent: NormalizedMessage[]
}

/** Config for {@link createMailer}. `memory` is the default; `http`/`smtp` are opt-in. */
export type MailConfig = { driver?: 'memory' } | HttpMailConfig | SmtpMailConfig

/** Coerce one-or-many string input to an array, dropping the field entirely when empty. */
function toArray(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined
  const list = (Array.isArray(value) ? value : [value]).filter((s) => s.length > 0)
  return list.length > 0 ? list : undefined
}

/** Normalize a {@link MailMessage} into a {@link NormalizedMessage} (array recipient fields). */
export function normalizeMessage(message: MailMessage): NormalizedMessage {
  const normalized: NormalizedMessage = {
    to: toArray(message.to) ?? [],
    subject: message.subject,
  }
  if (message.from !== undefined) normalized.from = message.from
  if (message.html !== undefined) normalized.html = message.html
  if (message.text !== undefined) normalized.text = message.text
  const cc = toArray(message.cc)
  if (cc) normalized.cc = cc
  const bcc = toArray(message.bcc)
  if (bcc) normalized.bcc = bcc
  if (message.replyTo !== undefined) normalized.replyTo = message.replyTo
  if (message.headers !== undefined) normalized.headers = message.headers
  return normalized
}

/** Every recipient a message reaches: `to` ∪ `cc` ∪ `bcc`. */
export function allRecipients(message: NormalizedMessage): string[] {
  return [...message.to, ...(message.cc ?? []), ...(message.bcc ?? [])]
}

/**
 * The built-in in-memory {@link Mailer} — zero config, no network. Sent messages accumulate on
 * `.sent` for assertions and local previews.
 */
export function createMemoryMailer(): MemoryMailer {
  const sent: NormalizedMessage[] = []
  return {
    sent,
    async send(message: MailMessage): Promise<SendResult> {
      const normalized = normalizeMessage(message)
      sent.push(normalized)
      return { accepted: allRecipients(normalized) }
    },
  }
}

/**
 * Create a {@link Mailer}. `{ driver: 'memory' }` (the default) captures sends on `.sent`;
 * `{ driver: 'http', ... }` posts via `fetch` (use a preset like {@link resend} for provider auth);
 * `{ driver: 'smtp', ... }` speaks minimal SMTP over TLS (lazy-loads `node:net`/`node:tls`).
 */
export function createMailer(config?: { driver?: 'memory' }): MemoryMailer
export function createMailer(config: HttpMailConfig): Mailer
export function createMailer(config: SmtpMailConfig): Mailer
export function createMailer(config: MailConfig): Mailer
export function createMailer(config: MailConfig = { driver: 'memory' }): Mailer {
  if (config.driver === 'http') return createHttpMailer(config)
  if (config.driver === 'smtp') return createSmtpMailer(config)
  return createMemoryMailer()
}
