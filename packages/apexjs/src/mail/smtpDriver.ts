// A minimal SMTP transport. It speaks just enough of the protocol to submit a message —
// EHLO → (optional STARTTLS) → AUTH LOGIN → MAIL FROM → RCPT TO → DATA → QUIT — over an
// implicit-TLS socket (port 465) or a STARTTLS-upgraded plain socket (port 587).
//
// On-device safe by construction: NO top-level `node:` import. `node:net`/`node:tls` are
// lazy-imported inside `send`, so this module (statically imported by mail.ts) never pulls them in
// at load time and the memory/http paths keep running on a bare JS engine.
//
// Scope note: this is a lean, dependency-free submitter for transactional mail — not a full MTA.
// It does NOT implement AUTH PLAIN/CRAM-MD5, pipelining, 8BITMIME negotiation, connection pooling,
// or attachments. For heavy SMTP needs, plug a nodemailer-backed Mailer behind the same interface.
import type { Mailer, NormalizedMessage, SendResult } from './mail.js'
import { allRecipients, normalizeMessage } from './mail.js'

/**
 * Config for the smtp transport. `secure` defaults to `port === 465` (implicit TLS); otherwise the
 * connection starts plain and upgrades via STARTTLS. `auth` is optional (some relays authenticate
 * by IP). `from` supplies the envelope sender when a message omits `from`.
 */
export interface SmtpMailConfig {
  driver: 'smtp'
  host: string
  port?: number
  secure?: boolean
  auth?: { user: string; pass: string }
  from?: string
}

/** The structural slice of a `net`/`tls` socket this transport uses (avoids `node:` type imports). */
interface SmtpSocket {
  write(data: string): void
  on(event: 'data', listener: (chunk: { toString(encoding?: string): string }) => void): void
  once(event: string, listener: (arg?: unknown) => void): void
  removeAllListeners(event?: string): void
  end(): void
  destroy(): void
}

/** A parsed SMTP reply: the 3-digit status and the joined human text. */
interface SmtpReply {
  code: number
  text: string
}

/** Base64-encode a UTF-8 string (SMTP path is node-only, so `Buffer` is available). */
function b64(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64')
}

/** Drive request/response over a connected socket, resolving one full reply per command. */
function createDialog(socket: SmtpSocket): {
  read(): Promise<SmtpReply>
  send(line: string): Promise<SmtpReply>
} {
  let buffer = ''
  let resolveReply: ((reply: SmtpReply) => void) | null = null

  const tryFlush = () => {
    if (!resolveReply) return
    // A reply is complete when a line reads "NNN <text>" (space after code, not a hyphen).
    const lines = buffer.split('\r\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      if (/^\d{3} /.test(line)) {
        const text = lines
          .slice(0, i + 1)
          .map((l) => l.slice(4))
          .join(' ')
          .trim()
        const code = Number(line.slice(0, 3))
        buffer = lines.slice(i + 1).join('\r\n')
        const done = resolveReply
        resolveReply = null
        done({ code, text })
        return
      }
    }
  }

  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8')
    tryFlush()
  })

  const read = (): Promise<SmtpReply> =>
    new Promise<SmtpReply>((resolve) => {
      resolveReply = resolve
      tryFlush()
    })

  return {
    read,
    send(line: string): Promise<SmtpReply> {
      socket.write(`${line}\r\n`)
      return read()
    },
  }
}

/** Assert an SMTP reply's code is one of `expected`, else throw with the server text. */
function expect(reply: SmtpReply, expected: number[], step: string): void {
  if (!expected.includes(reply.code)) {
    throw new Error(`mail(smtp): ${step} failed — ${reply.code} ${reply.text}`)
  }
}

/** RFC 5322 date string for the `Date:` header. */
function rfc2822Date(date: Date): string {
  return date.toUTCString().replace('GMT', '+0000')
}

/** Build the DATA payload: headers + MIME body, with SMTP dot-stuffing applied. */
function buildMime(message: NormalizedMessage, from: string): string {
  const lines: string[] = []
  lines.push(`From: ${from}`)
  lines.push(`To: ${message.to.join(', ')}`)
  if (message.cc) lines.push(`Cc: ${message.cc.join(', ')}`)
  if (message.replyTo !== undefined) lines.push(`Reply-To: ${message.replyTo}`)
  lines.push(`Subject: ${message.subject}`)
  lines.push(`Date: ${rfc2822Date(new Date())}`)
  lines.push('MIME-Version: 1.0')
  for (const [key, value] of Object.entries(message.headers ?? {})) lines.push(`${key}: ${value}`)

  let body: string
  if (message.html !== undefined && message.text !== undefined) {
    const boundary = `=_apex_${Math.random().toString(36).slice(2)}`
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`)
    body = [
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      message.text,
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      message.html,
      `--${boundary}--`,
      '',
    ].join('\r\n')
  } else if (message.html !== undefined) {
    lines.push('Content-Type: text/html; charset=utf-8')
    body = message.html
  } else {
    lines.push('Content-Type: text/plain; charset=utf-8')
    body = message.text ?? ''
  }

  const raw = `${lines.join('\r\n')}\r\n\r\n${body}`
  // Dot-stuffing: a line consisting of a single "." would terminate DATA — double leading dots.
  return raw
    .split('\r\n')
    .map((line) => (line.startsWith('.') ? `.${line}` : line))
    .join('\r\n')
}

/** Extract a queued message id from a post-DATA reply like "250 OK: queued as ABC123". */
function extractQueuedId(text: string): string | undefined {
  const match = /queued as (\S+)/i.exec(text)
  return match?.[1]
}

/** Build the smtp {@link Mailer}. Each `send` opens a fresh connection and submits one message. */
export function createSmtpMailer(config: SmtpMailConfig): Mailer {
  const port = config.port ?? (config.secure ? 465 : 587)
  const secure = config.secure ?? port === 465

  return {
    async send(message): Promise<SendResult> {
      const normalized = normalizeMessage(message)
      const from = normalized.from ?? config.from
      if (from === undefined) {
        throw new Error('mail(smtp): no `from` — set it on the message or in the config')
      }
      const recipients = allRecipients(normalized)
      if (recipients.length === 0) {
        throw new Error('mail(smtp): no recipients')
      }

      const net = await import('node:net')
      const tls = await import('node:tls')

      /** Open the initial socket: implicit TLS, or a plain socket we later upgrade via STARTTLS. */
      const openSocket = (): Promise<SmtpSocket> =>
        new Promise<SmtpSocket>((resolve, reject) => {
          if (secure) {
            const s = tls.connect({ host: config.host, port })
            s.once('secureConnect', () => resolve(s as unknown as SmtpSocket))
            s.once('error', reject)
          } else {
            const s = net.connect({ host: config.host, port })
            s.once('connect', () => resolve(s as unknown as SmtpSocket))
            s.once('error', reject)
          }
        })

      let socket = await openSocket()
      try {
        let dialog = createDialog(socket)
        expect(await dialog.read(), [220], 'greeting')
        expect(await dialog.send(`EHLO ${config.host}`), [250], 'EHLO')

        if (!secure) {
          // Upgrade the plain connection to TLS, then re-EHLO over the secure channel.
          expect(await dialog.send('STARTTLS'), [220], 'STARTTLS')
          socket.removeAllListeners('data')
          const upgraded = await new Promise<SmtpSocket>((resolve, reject) => {
            const s = tls.connect({ socket: socket as unknown as import('node:net').Socket })
            s.once('secureConnect', () => resolve(s as unknown as SmtpSocket))
            s.once('error', reject)
          })
          socket = upgraded
          dialog = createDialog(socket)
          expect(await dialog.send(`EHLO ${config.host}`), [250], 'EHLO (TLS)')
        }

        if (config.auth) {
          expect(await dialog.send('AUTH LOGIN'), [334], 'AUTH LOGIN')
          expect(await dialog.send(b64(config.auth.user)), [334], 'AUTH user')
          expect(await dialog.send(b64(config.auth.pass)), [235], 'AUTH pass')
        }

        expect(await dialog.send(`MAIL FROM:<${from}>`), [250], 'MAIL FROM')
        for (const rcpt of recipients) {
          expect(await dialog.send(`RCPT TO:<${rcpt}>`), [250, 251], 'RCPT TO')
        }
        expect(await dialog.send('DATA'), [354], 'DATA')
        const dataReply = await dialog.send(`${buildMime(normalized, from)}\r\n.`)
        expect(dataReply, [250], 'message body')
        try {
          await dialog.send('QUIT')
        } catch {
          // Server may close before replying to QUIT; the message is already accepted.
        }

        const result: SendResult = { accepted: recipients, raw: dataReply.text }
        const id = extractQueuedId(dataReply.text)
        if (id !== undefined) result.id = id
        return result
      } finally {
        socket.destroy()
      }
    },
  }
}
