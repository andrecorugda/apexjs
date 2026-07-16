---
"@apex-stack/core": minor
---

Wire the new subsystems into the server: the API error path now honors a thrown error's
`httpStatus` (so `@apex-stack/data`'s `ModelNotFoundException` → 404 with its domain message,
while plain failures stay a masked 500 and only 5xx are logged as failures). The Cache and
Storage subsystems are exported from `@apex-stack/core/server` (`createCache`, `createStorage`
+ local/S3 drivers, signed URLs).
