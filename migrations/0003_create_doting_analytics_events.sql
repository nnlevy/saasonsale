CREATE TABLE IF NOT EXISTS doting_analytics_events (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	event_name TEXT NOT NULL,
	cta_id TEXT,
	form_id TEXT,
	path TEXT NOT NULL,
	visitor_id TEXT,
	session_id TEXT,
	referrer_host TEXT,
	country TEXT,
	metadata_json TEXT NOT NULL DEFAULT '{}',
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_doting_analytics_events_created_at
	ON doting_analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_doting_analytics_events_event_name_created_at
	ON doting_analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_doting_analytics_events_form_id_created_at
	ON doting_analytics_events (form_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_doting_analytics_events_cta_id_created_at
	ON doting_analytics_events (cta_id, created_at DESC);
