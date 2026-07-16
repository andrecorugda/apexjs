// Public barrel for the notifications subsystem. Re-export this from src/server.ts.

export type {
  DatabaseChannel,
  DatabaseChannelConfig,
  NotificationDbHandle,
  SqlValue,
  StoredNotification,
} from './databaseChannel.js'
export { buildMigrationSql, databaseChannel } from './databaseChannel.js'
export type {
  BoundNotification,
  Channel,
  ChannelInput,
  Notifiable,
  NotificationContext,
  NotificationDescriptor,
  NotificationFactory,
  Notifier,
  NotifierChannels,
  NotifierConfig,
} from './notifications.js'
export { createNotifier, defineNotification } from './notifications.js'
