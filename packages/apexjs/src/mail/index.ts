// Public barrel for the mail subsystem. Re-export this from src/server.ts.

export {
  createHttpMailer,
  type FetchInit,
  type FetchLike,
  type FetchResponse,
  type HttpMailConfig,
  type PresetOptions,
  postmark,
  resend,
} from './httpDriver.js'
export {
  allRecipients,
  createMailer,
  createMemoryMailer,
  type MailConfig,
  type Mailer,
  type MailMessage,
  type MemoryMailer,
  type NormalizedMessage,
  normalizeMessage,
  type SendResult,
} from './mail.js'
export { createSmtpMailer, type SmtpMailConfig } from './smtpDriver.js'
export { escapeHtml, renderTemplate, type TemplateValue, type TemplateVars } from './template.js'
