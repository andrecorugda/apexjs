CREATE TABLE IF NOT EXISTS features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  tag TEXT NOT NULL DEFAULT 'core'
);
INSERT INTO features (name, tag) VALUES
  ('Server-side rendering', 'core'),
  ('Islands — zero JS by default', 'light'),
  ('File-based routing', 'core'),
  ('REST + MCP from one route', 'ai');
