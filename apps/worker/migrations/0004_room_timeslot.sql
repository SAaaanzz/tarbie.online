-- Add room and time_slot fields to tarbie_sessions
-- room format: "ГК 409", "МК 131", "IT 124", "спорт зал"
-- time_slot format: "08:00" (start time of 30-min slot within a pair)

ALTER TABLE tarbie_sessions ADD COLUMN room TEXT;
ALTER TABLE tarbie_sessions ADD COLUMN time_slot TEXT;

-- Index for room conflict checks
CREATE INDEX idx_sessions_date_timeslot_room ON tarbie_sessions(planned_date, time_slot, room);
