import type { DecoratedMessage, Message } from '../shared/types.js'

/** Business logic for the guestbook — pure, testable, reused by loaders + routes. */
export class GuestbookService {
  initials(author: string): string {
    return author
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('')
  }

  ago(iso: string, now: number = Date.now()): string {
    const secs = Math.max(
      0,
      Math.floor((now - new Date(`${iso.replace(' ', 'T')}Z`).getTime()) / 1000),
    )
    if (secs < 60) return 'just now'
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
    return `${Math.floor(secs / 86400)}d ago`
  }

  decorate(m: Message): DecoratedMessage {
    return { ...m, initials: this.initials(m.author), ago: this.ago(m.createdAt) }
  }
}
