CREATE TABLE IF NOT EXISTS ad_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  adsense_client_id TEXT,
  enabled INTEGER NOT NULL DEFAULT 0,
  hide_ads_for_premium INTEGER NOT NULL DEFAULT 1,
  excluded_placements_json TEXT NOT NULL DEFAULT '[]',
  placements_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO ad_settings (
  id,
  adsense_client_id,
  enabled,
  hide_ads_for_premium,
  excluded_placements_json,
  placements_json,
  updated_at
)
VALUES (
  1,
  '',
  0,
  1,
  '["home","premium"]',
  '{"onboarding":{"slot":"","format":"auto"},"streak":{"slot":"","format":"auto"},"cards":{"slot":"","format":"auto"},"knowledge":{"slot":"","format":"auto"},"footer":{"slot":"","format":"horizontal"}}',
  datetime('now')
)
ON CONFLICT(id) DO NOTHING;
