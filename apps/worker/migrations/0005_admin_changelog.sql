-- Admin change log for tracking session modifications
CREATE TABLE IF NOT EXISTS admin_change_log (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('session', 'user', 'class')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('create', 'update', 'delete', 'import', 'auto_assign')),
  changes TEXT, -- JSON string of field changes: { field: { old, new } }
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_change_log_school ON admin_change_log(school_id);
CREATE INDEX idx_admin_change_log_entity ON admin_change_log(entity_type, entity_id);
CREATE INDEX idx_admin_change_log_created ON admin_change_log(created_at);
CREATE INDEX idx_admin_change_log_user ON admin_change_log(user_id);

-- Add TOPIC_REMINDER to notification_templates event_type check
-- Note: SQLite doesn't support ALTER CHECK, so this is for documentation only.
-- The application code handles the new event type.
