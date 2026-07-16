-- Create the messages table. Applied automatically on first boot (db/index.ts runs
-- `applyMigrations`), or on demand with `apex migrate` (reverse with `apex migrate --rollback`).
-- SQLite / libSQL — the default local driver:
CREATE TABLE IF NOT EXISTS "messages" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "created_at" TEXT,
  "updated_at" TEXT,
  "author" TEXT NOT NULL,
  "body" TEXT NOT NULL
);

-- Postgres — uncomment this block instead when you deploy to Supabase / Neon / any Postgres:
-- CREATE TABLE IF NOT EXISTS "messages" (
--   "id" SERIAL PRIMARY KEY,
--   "created_at" TIMESTAMP,
--   "updated_at" TIMESTAMP,
--   "author" TEXT NOT NULL,
--   "body" TEXT NOT NULL
-- );

-- @down
DROP TABLE IF EXISTS "messages";
