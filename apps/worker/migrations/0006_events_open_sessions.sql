-- Events: admin/teacher-created events with capacity limits
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL,
  event_time TEXT,
  location TEXT,
  capacity INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming','ongoing','completed','cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_events_school_id ON events(school_id);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);

-- Event registrations: students sign up for events
CREATE TABLE IF NOT EXISTS event_registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  registered_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(event_id, student_id)
);

CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_student_id ON event_registrations(student_id);

-- Open sessions: teacher-created sessions any student can join
CREATE TABLE IF NOT EXISTS open_sessions (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  session_date TEXT NOT NULL,
  session_time TEXT,
  location TEXT,
  max_students INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed','completed','cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_open_sessions_school_id ON open_sessions(school_id);
CREATE INDEX idx_open_sessions_teacher_id ON open_sessions(teacher_id);
CREATE INDEX idx_open_sessions_session_date ON open_sessions(session_date);

-- Open session registrations
CREATE TABLE IF NOT EXISTS open_session_registrations (
  id TEXT PRIMARY KEY,
  open_session_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  registered_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (open_session_id) REFERENCES open_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(open_session_id, student_id)
);

CREATE INDEX idx_open_session_regs_session_id ON open_session_registrations(open_session_id);
CREATE INDEX idx_open_session_regs_student_id ON open_session_registrations(student_id);
