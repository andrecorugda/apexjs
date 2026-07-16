---
"@apex-stack/core": minor
---

Platform pillars (1.1): four new subsystems exported from `@apex-stack/core/server`.

- **Mail** — `createMailer` with memory / http (Resend, Postmark presets) / smtp transports + a
  `{{ var }}` template helper.
- **Real-time** — SSE broadcasting: an in-memory pub/sub `createBroadcaster`, an h3 `sseHandler`
  (streams `event:`/`data:` frames, keep-alive, clean teardown), and a browser `apexRealtimeClient`.
- **Notifications** — channel-agnostic multi-channel notifications: `defineNotification` + `createNotifier`
  with a built-in `databaseChannel` (persist + `unread`/`markRead`) and pluggable mail/custom channels.
- **Authorization** — roles + permissions (Spatie-style `createAccessControl` + `permissionGate`),
  opaque API tokens (Sanctum-style `createTokenStore`: hashed at rest, timing-safe verify, abilities +
  `*` wildcard, revoke), and single-use password-reset / email-verify flow tokens (`createFlowTokens`).
  Token/flow secrets are SHA-256-hashed (never stored plaintext); flow `consume` claims tokens
  atomically (`used_at IS NULL … RETURNING`) so a concurrent double-use can't both win.
