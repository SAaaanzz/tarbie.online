-- Recreate grades table: scale 0-10, attendance status (present/absent/makeup)
-- present = attended, grade 0-10
-- absent = Н, counts as 0 until makeup
-- makeup = Н(X), was absent but made it up, grade 0-10

DROP TABLE IF EXISTS grades;

CREATE TABLE grades (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'absent' CHECK(status IN ('present','absent','makeup')),
  grade INTEGER CHECK(grade IS NULL OR (grade BETWEEN 0 AND 10)),
  comment TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES tarbie_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE(session_id, student_id)
);

CREATE INDEX idx_grades_session_id ON grades(session_id);
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_grades_status ON grades(status);
