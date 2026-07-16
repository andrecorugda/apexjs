// A small multi-channel notification subsystem (Laravel-notifications style): you `defineNotification`
// a descriptor whose `via()` picks channel names and whose `to<Channel>()` methods render the payload
// per channel, then a `createNotifier(...)` dispatches an instance to every registered channel.
//
// Channel-agnostic by design: channels are pluggable and registered by name, so this subsystem has NO
// dependency on any concrete transport (mail, sms, …). The built-in database channel lives in
// ./databaseChannel.ts; the mail channel is just a function slot the app supplies.
//
// On-device safe: this module has NO top-level `node:` import, so it runs on a bare JS engine
// (QuickJS et al.). The database channel likewise stays fs-free — it talks to a db handle the caller
// passes in. The factory + interface + config-object shape mirrors the cache/queue primitives.

/**
 * The target of a notification (a user, team, endpoint, …). `id` scopes stored records to a
 * recipient; extra fields (email, phone, locale, …) are free-form and read by whichever channel
 * needs them — keeping this subsystem agnostic to any concrete transport.
 */
export interface Notifiable {
  id: string | number
  [key: string]: unknown
}

/** What every render method and `via()` receives: the recipient plus the notification's payload. */
export interface NotificationContext<T> {
  notifiable: Notifiable
  payload: T
}

/**
 * A notification descriptor: `via()` selects the channel names for a given context, and each optional
 * `to<Channel>()` renders the payload for that channel (`toDatabase`, `toMail`, or a custom
 * `to<Name>`). The open index signature is the ONE place `unknown`-typed render methods are allowed,
 * so apps can add channels without changing this type.
 */
export interface NotificationDescriptor<T> {
  /** The channel names this notification should be delivered on for the given context. */
  via(ctx: NotificationContext<T>): string[]
  /** Render the payload for the built-in database channel (persisted as JSON). */
  toDatabase?(ctx: NotificationContext<T>): Record<string, unknown>
  /** Render the payload for the mail channel (shape is whatever the app's mail slot expects). */
  toMail?(ctx: NotificationContext<T>): unknown
  /** Custom `to<Channel>()` renderers — e.g. `toSlack`, `toSms`. Absent ⇒ the raw payload is sent. */
  [channel: string]: ((ctx: NotificationContext<T>) => unknown) | undefined
}

/**
 * A ready-to-send notification: the descriptor paired with a concrete payload. Produced by calling
 * the {@link NotificationFactory} returned from {@link defineNotification}.
 */
export interface BoundNotification<T> {
  readonly descriptor: NotificationDescriptor<T>
  readonly payload: T
}

/**
 * The callable returned by {@link defineNotification}. Invoke it with a payload to get a
 * {@link BoundNotification} you pass to {@link Notifier.send}; `.descriptor` exposes the raw config.
 */
export interface NotificationFactory<T> {
  (payload: T): BoundNotification<T>
  readonly descriptor: NotificationDescriptor<T>
}

/**
 * A delivery channel. `send` receives the recipient and the value the notification's `to<Channel>()`
 * method rendered (or the raw payload when no render method exists). Implement this to add a transport.
 */
export interface Channel {
  send(notifiable: Notifiable, rendered: unknown): Promise<void>
}

/**
 * What a channel slot in {@link NotifierConfig.channels} may be: a full {@link Channel}, or a plain
 * function that just receives the rendered message (the mail slot's shape — the app wraps its mailer).
 */
export type ChannelInput = Channel | ((rendered: unknown) => Promise<void>)

/** The registered channels, keyed by the names {@link NotificationDescriptor.via} returns. */
export interface NotifierChannels {
  /** The built-in database channel (see {@link import('./databaseChannel.js').databaseChannel}). */
  database?: Channel
  /** The mail slot — a function the app supplies wrapping its mail subsystem. */
  mail?: (rendered: unknown) => Promise<void>
  /** Any custom channel by name. */
  [name: string]: ChannelInput | undefined
}

/** Config for {@link createNotifier}. `warn` overrides the default `console.warn` for skipped channels. */
export interface NotifierConfig {
  channels: NotifierChannels
  warn?: (message: string) => void
}

/** Dispatches a {@link BoundNotification} to every channel {@link NotificationDescriptor.via} selects. */
export interface Notifier {
  /**
   * Resolve `via()`, render per channel via the descriptor's `to<Channel>()` method (falling back to
   * the raw payload), and dispatch to each registered channel. A selected channel that isn't
   * registered is skipped with a warning — never thrown.
   */
  send<T>(notifiable: Notifiable, notification: BoundNotification<T>): Promise<void>
}

/**
 * Define a notification from its {@link NotificationDescriptor}. Returns a {@link NotificationFactory}:
 * call it with a payload to bind an instance for {@link Notifier.send} (Laravel's `new InvoicePaid($x)`).
 */
export function defineNotification<T = void>(
  descriptor: NotificationDescriptor<T>,
): NotificationFactory<T> {
  const factory = (payload: T): BoundNotification<T> => ({ descriptor, payload })
  return Object.assign(factory, { descriptor }) as NotificationFactory<T>
}

/** The `to<Channel>` render-method name for a channel — `database` ⇒ `toDatabase`, `slack` ⇒ `toSlack`. */
function rendererName(channel: string): string {
  return `to${channel.charAt(0).toUpperCase()}${channel.slice(1)}`
}

/** Normalize a {@link ChannelInput} to a {@link Channel}: a bare function becomes a rendered-only sink. */
function toChannel(input: ChannelInput): Channel {
  return typeof input === 'function' ? { send: (_notifiable, rendered) => input(rendered) } : input
}

/**
 * Create a {@link Notifier} over the registered channels. Unknown channel names selected by a
 * notification's `via()` are skipped with a warning (default `console.warn`), so one missing transport
 * never breaks delivery on the others.
 */
export function createNotifier(config: NotifierConfig): Notifier {
  const warn =
    config.warn ??
    ((message: string) => {
      if (typeof console !== 'undefined') console.warn(message)
    })

  const registry = new Map<string, Channel>()
  for (const [name, input] of Object.entries(config.channels)) {
    if (input !== undefined) registry.set(name, toChannel(input))
  }

  return {
    async send<T>(notifiable: Notifiable, notification: BoundNotification<T>): Promise<void> {
      const { descriptor, payload } = notification
      const ctx: NotificationContext<T> = { notifiable, payload }
      for (const name of descriptor.via(ctx)) {
        const channel = registry.get(name)
        if (!channel) {
          warn(`notifier: no channel registered for "${name}", skipping`)
          continue
        }
        const render = descriptor[rendererName(name)]
        const rendered = render ? render(ctx) : payload
        await channel.send(notifiable, rendered)
      }
    },
  }
}
