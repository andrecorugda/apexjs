/** Shared shapes used by backend (routes/services) and frontend. */
export interface Message {
  id: number
  author: string
  body: string
  createdAt: string
}
export interface DecoratedMessage extends Message {
  initials: string
  ago: string
}
