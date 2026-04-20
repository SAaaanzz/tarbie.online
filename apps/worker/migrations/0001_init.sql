-- Тәрбие Сағаты Manager — D1 Migration
-- Complete schema with indexes and foreign keys

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bin TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_schools_city ON schools(city);
CREATE UNIQUE INDEX idx_schools_bin ON schools(bin);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','teacher','student','parent')),
  phone TEXT NOT NULL,
  telegram_chat_id TEXT,
  whatsapp_number TEXT,
  lang TEXT NOT NULL DEFAULT 'ru' CHECK(lang IN ('kz','ru')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_telegram_chat_id ON users(telegram_chat_id);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  name TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_classes_school_id ON classes(school_id);
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_classes_academic_year ON classes(academic_year);

CREATE TABLE IF NOT EXISTS class_students (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(class_id, student_id)
);

CREATE INDEX idx_class_students_class_id ON class_students(class_id);
CREATE INDEX idx_class_students_student_id ON class_students(student_id);

CREATE TABLE IF NOT EXISTS tarbie_sessions (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  planned_date TEXT NOT NULL,
  actual_date TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','completed','cancelled','rescheduled')),
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  notes TEXT,
  attachment_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_tarbie_sessions_class_id ON tarbie_sessions(class_id);
CREATE INDEX idx_tarbie_sessions_teacher_id ON tarbie_sessions(teacher_id);
CREATE INDEX idx_tarbie_sessions_planned_date ON tarbie_sessions(planned_date);
CREATE INDEX idx_tarbie_sessions_status ON tarbie_sessions(status);
CREATE INDEX idx_tarbie_sessions_class_date ON tarbie_sessions(class_id, planned_date);

CREATE TABLE IF NOT EXISTS session_attendance (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('present','absent','late','excused')),
  marked_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES tarbie_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(session_id, student_id)
);

CREATE INDEX idx_session_attendance_session_id ON session_attendance(session_id);
CREATE INDEX idx_session_attendance_student_id ON session_attendance(student_id);

CREATE TABLE IF NOT EXISTS notifications_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT,
  channel TEXT NOT NULL CHECK(channel IN ('telegram','whatsapp')),
  message_text TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('sent','failed','pending','dead_letter')),
  error_msg TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES tarbie_sessions(id) ON DELETE SET NULL
);

CREATE INDEX idx_notifications_log_user_id ON notifications_log(user_id);
CREATE INDEX idx_notifications_log_session_id ON notifications_log(session_id);
CREATE INDEX idx_notifications_log_status ON notifications_log(status);
CREATE INDEX idx_notifications_log_sent_at ON notifications_log(sent_at);

CREATE TABLE IF NOT EXISTS notification_templates (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN (
    'SESSION_PLANNED','SESSION_REMINDER','SESSION_COMPLETED',
    'SESSION_RESCHEDULED','ABSENCE_ALERT'
  )),
  lang TEXT NOT NULL CHECK(lang IN ('kz','ru')),
  template_text TEXT NOT NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  UNIQUE(school_id, event_type, lang)
);

CREATE INDEX idx_notification_templates_school_event ON notification_templates(school_id, event_type);

-- Seed default school for templates
INSERT INTO schools (id, name, bin, city) VALUES
  ('__default__', 'Default School', '000000000000', 'Default');

-- Seed default notification templates for a placeholder school
-- These will be copied when a new school is created

INSERT INTO notification_templates (id, school_id, event_type, lang, template_text) VALUES
  ('tpl-default-planned-kz', '__default__', 'SESSION_PLANNED', 'kz',
   '📅 Жаңа тәрбие сағаты жоспарланды!\n\nТақырып: {{topic}}\nКүні: {{date}}\nСынып: {{class_name}}\nМұғалім: {{teacher_name}}'),
  ('tpl-default-planned-ru', '__default__', 'SESSION_PLANNED', 'ru',
   '📅 Запланирован новый классный час!\n\nТема: {{topic}}\nДата: {{date}}\nКласс: {{class_name}}\nУчитель: {{teacher_name}}'),
  ('tpl-default-reminder-kz', '__default__', 'SESSION_REMINDER', 'kz',
   '⏰ Ескерту: ертең тәрбие сағаты!\n\nТақырып: {{topic}}\nКүні: {{date}}\nСынып: {{class_name}}'),
  ('tpl-default-reminder-ru', '__default__', 'SESSION_REMINDER', 'ru',
   '⏰ Напоминание: завтра классный час!\n\nТема: {{topic}}\nДата: {{date}}\nКласс: {{class_name}}'),
  ('tpl-default-completed-kz', '__default__', 'SESSION_COMPLETED', 'kz',
   '✅ Тәрбие сағаты аяқталды\n\nТақырып: {{topic}}\nСынып: {{class_name}}\nКелгендер: {{attendance_count}}/{{total_students}}'),
  ('tpl-default-completed-ru', '__default__', 'SESSION_COMPLETED', 'ru',
   '✅ Классный час завершён\n\nТема: {{topic}}\nКласс: {{class_name}}\nПрисутствовали: {{attendance_count}}/{{total_students}}'),
  ('tpl-default-rescheduled-kz', '__default__', 'SESSION_RESCHEDULED', 'kz',
   '🔄 Тәрбие сағаты ауыстырылды!\n\nТақырып: {{topic}}\nЕскі күн: {{old_date}}\nЖаңа күн: {{new_date}}\nСынып: {{class_name}}'),
  ('tpl-default-rescheduled-ru', '__default__', 'SESSION_RESCHEDULED', 'ru',
   '🔄 Классный час перенесён!\n\nТема: {{topic}}\nСтарая дата: {{old_date}}\nНовая дата: {{new_date}}\nКласс: {{class_name}}'),
  ('tpl-default-absence-kz', '__default__', 'ABSENCE_ALERT', 'kz',
   '⚠️ Қатысу ескертуі\n\n{{student_name}} соңғы 3 тәрбие сағатына қатыспады.\nСынып: {{class_name}}\nМұғалімге хабарласыңыз.'),
  ('tpl-default-absence-ru', '__default__', 'ABSENCE_ALERT', 'ru',
   '⚠️ Уведомление о посещаемости\n\n{{student_name}} пропустил(а) последние 3 классных часа.\nКласс: {{class_name}}\nСвяжитесь с классным руководителем.');
