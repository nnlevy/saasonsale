ALTER TABLE greeting_cards ADD COLUMN visitor_id TEXT;
CREATE INDEX IF NOT EXISTS idx_greeting_cards_visitor_id ON greeting_cards(visitor_id);
