-- Ad settings (shared pattern)
CREATE TABLE IF NOT EXISTS ad_settings (
  id INTEGER PRIMARY KEY,
  adsense_client_id TEXT,
  enabled INTEGER DEFAULT 0,
  hide_ads_for_premium INTEGER DEFAULT 1,
  excluded_placements TEXT DEFAULT '["home","premium"]',
  placements TEXT DEFAULT '{}',
  updated_at TEXT
);

INSERT OR IGNORE INTO ad_settings (id, adsense_client_id, enabled, hide_ads_for_premium, excluded_placements, placements, updated_at)
VALUES (1, '', 0, 1, '["home","premium"]', '{}', datetime('now'));

-- Saason-specific analytics
CREATE TABLE IF NOT EXISTS saason_analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  cta_id TEXT,
  form_id TEXT,
  path TEXT,
  session_id TEXT,
  visitor_id TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);