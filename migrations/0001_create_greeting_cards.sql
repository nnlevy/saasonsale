CREATE TABLE IF NOT EXISTS greeting_cards (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_greeting_cards_created_at ON greeting_cards(created_at);
