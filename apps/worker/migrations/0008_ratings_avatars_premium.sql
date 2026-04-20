-- Avatar, premium customization, lesson ratings & teacher reviews

ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN premium INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN premium_frame TEXT;
ALTER TABLE users ADD COLUMN premium_name_color TEXT;

-- Lesson ratings from students (after each session via Telegram)
CREATE TABLE IF NOT EXISTS session_ratings (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 10),
  reason TEXT,
  is_valid INTEGER NOT NULL DEFAULT 1,
  filter_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES tarbie_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(session_id, student_id)
);

CREATE INDEX idx_session_ratings_session_id ON session_ratings(session_id);
CREATE INDEX idx_session_ratings_teacher_id ON session_ratings(teacher_id);
CREATE INDEX idx_session_ratings_student_id ON session_ratings(student_id);
CREATE INDEX idx_session_ratings_is_valid ON session_ratings(is_valid);
