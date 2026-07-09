-- Generated from models/Message.ts (Message.migrationSql('sqlite')).
-- Regenerate after changing the model; apply with the migration runner on boot.
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT,
  updated_at TEXT,
  author TEXT NOT NULL,
  body TEXT NOT NULL
);
