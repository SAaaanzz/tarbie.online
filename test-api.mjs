// Comprehensive API Test Script for Tarbie Sagaty
// Tests: auth, admin CRUD, sessions (room/time_slot), conflict detection, grades, booked-rooms

const BASE = "https://dprabota.bahtyarsanzhar.workers.dev";
const TOKEN = process.argv[2] || process.env.TOKEN || "";
if (!TOKEN) { console.error("Usage: node test-api.mjs <JWT_TOKEN>"); process.exit(1); }

const HEADERS = { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" };

let pass = 0, fail = 0;
const errors = [];

async function api(method, path, body) {
  const opts = { method, headers: HEADERS };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json };
}

async function test(name, method, path, body, expectCode, expectField, expectValue) {
  try {
    const { status, json } = await api(method, path, body);
    let passed = true;
    let detail = "";

    if (expectCode && status !== expectCode) {
      passed = false;
      detail += ` expected_code=${expectCode} got=${status}`;
    }
    if (expectField && json) {
      let val = json;
      for (const p of expectField.split(".")) val = val?.[p];
      if (expectValue !== undefined && String(val) !== String(expectValue)) {
        passed = false;
        detail += ` expected ${expectField}=${expectValue} got=${val}`;
      }
    }

    if (passed) {
      console.log(`  \x1b[32mPASS\x1b[0m: ${name} (HTTP ${status})`);
      pass++;
    } else {
      console.log(`  \x1b[31mFAIL\x1b[0m: ${name} (HTTP ${status})${detail}`);
      fail++;
      errors.push(`${name}: ${detail} body=${JSON.stringify(json)}`);
    }
    return json;
  } catch (e) {
    console.log(`  \x1b[31mFAIL\x1b[0m: ${name} - Exception: ${e.message}`);
    fail++;
    errors.push(`${name}: Exception ${e.message}`);
    return null;
  }
}

async function run() {
  console.log("\n========================================");
  console.log("  TARBIE SAGATY - FULL API TEST SUITE");
  console.log("========================================\n");

  // --- 1. HEALTH ---
  console.log("--- 1. HEALTH CHECK ---");
  await test("Health check", "GET", "/api/health", null, 200, "data.status", "ok");

  // --- 2. AUTH ---
  console.log("\n--- 2. AUTH ---");
  await test("Auth /me with valid token", "GET", "/api/auth/me", null, 200, "data.role", "admin");

  const oldAuth = HEADERS.Authorization;
  HEADERS.Authorization = "Bearer bad_token";
  await test("Auth /me with bad token (401)", "GET", "/api/auth/me", null, 401, "success", false);
  HEADERS.Authorization = oldAuth;

  // --- 3. CREATE TEACHERS ---
  console.log("\n--- 3. ADMIN: CREATE TEST TEACHERS ---");
  const t1 = await test("Create teacher: Иванов А.С.", "POST", "/api/admin/users",
    { full_name: "Иванов Алексей Сергеевич", role: "teacher", phone: "+77011111001", lang: "ru" },
    201, "success", true);
  const T1 = t1?.data?.id || "";

  const t2 = await test("Create teacher: Петрова М.К.", "POST", "/api/admin/users",
    { full_name: "Петрова Мария Константиновна", role: "teacher", phone: "+77011111002", lang: "ru" },
    201, "success", true);
  const T2 = t2?.data?.id || "";

  const t3 = await test("Create teacher: Касымов Б.Н.", "POST", "/api/admin/users",
    { full_name: "Касымов Бауыржан Нурланулы", role: "teacher", phone: "+77011111003", lang: "kz" },
    201, "success", true);
  const T3 = t3?.data?.id || "";

  await test("Duplicate phone (409)", "POST", "/api/admin/users",
    { full_name: "Дубль", role: "teacher", phone: "+77011111001", lang: "ru" },
    409, "success", false);

  // --- 4. CREATE STUDENTS ---
  console.log("\n--- 4. ADMIN: CREATE TEST STUDENTS ---");
  const studentNames = [
    "Ахметов Данияр", "Бекова Айгуль", "Сериков Арман", "Турсынова Дана", "Жанабаев Ерлан",
    "Кенжебаева Асель", "Муратов Нурсултан", "Оспанова Камила", "Рахимов Тимур", "Шукирова Мадина"
  ];
  const studentIds = [];
  for (let i = 0; i < studentNames.length; i++) {
    const ph = `+770222200${String(i + 1).padStart(2, "0")}`;
    const s = await test(`Create student: ${studentNames[i]}`, "POST", "/api/admin/users",
      { full_name: studentNames[i], role: "student", phone: ph, lang: i % 2 === 0 ? "kz" : "ru" },
      201, "success", true);
    if (s?.data?.id) studentIds.push(s.data.id);
  }

  // --- 5. CREATE GROUPS ---
  console.log("\n--- 5. ADMIN: CREATE TEST GROUPS ---");
  const c1 = await test("Create group: ИТ-21", "POST", "/api/admin/classes",
    { name: "ИТ-21", teacher_id: T1, academic_year: "2025-2026" }, 201, "success", true);
  const C1 = c1?.data?.id || "";

  const c2 = await test("Create group: ФИН-31", "POST", "/api/admin/classes",
    { name: "ФИН-31", teacher_id: T2, academic_year: "2025-2026" }, 201, "success", true);
  const C2 = c2?.data?.id || "";

  const c3 = await test("Create group: ПР-12", "POST", "/api/admin/classes",
    { name: "ПР-12", teacher_id: T3, academic_year: "2025-2026" }, 201, "success", true);
  const C3 = c3?.data?.id || "";

  // --- 6. ADD STUDENTS TO GROUPS ---
  console.log("\n--- 6. ADMIN: ADD STUDENTS TO GROUPS ---");
  if (studentIds.length >= 5 && C1) {
    await test("Add 5 students to ИТ-21", "POST", `/api/admin/classes/${C1}/students`,
      { student_ids: studentIds.slice(0, 5) }, 201, "success", true);
  }
  if (studentIds.length >= 10 && C2) {
    await test("Add 5 students to ФИН-31", "POST", `/api/admin/classes/${C2}/students`,
      { student_ids: studentIds.slice(5, 10) }, 201, "success", true);
  }
  if (studentIds.length >= 3 && C3) {
    await test("Add 3 students to ПР-12", "POST", `/api/admin/classes/${C3}/students`,
      { student_ids: studentIds.slice(0, 3) }, 201, "success", true);
  }

  await test("Get students of ИТ-21", "GET", `/api/admin/classes/${C1}/students`, null, 200, "success", true);

  // --- 7. SESSIONS: CREATE WITH ROOM + TIME ---
  console.log("\n--- 7. SESSIONS: CREATE WITH ROOM + TIME ---");
  const DATE = "2026-03-20";

  const s1 = await test("Session: ИТ-21, 08:00, ГК 409", "POST", "/api/sessions",
    { class_id: C1, topic: "Информатика основ", planned_date: DATE, duration_minutes: 30, time_slot: "08:00", room: "ГК 409" },
    201, "success", true);
  const S1 = s1?.data?.id || "";

  const s2 = await test("Session: ФИН-31, 09:40, МК 131", "POST", "/api/sessions",
    { class_id: C2, topic: "Финансовая грамотность", planned_date: DATE, duration_minutes: 30, time_slot: "09:40", room: "МК 131" },
    201, "success", true);
  const S2 = s2?.data?.id || "";

  const s3 = await test("Session: ПР-12, 11:25, IT 124", "POST", "/api/sessions",
    { class_id: C3, topic: "Правоведение", planned_date: DATE, duration_minutes: 30, time_slot: "11:25", room: "IT 124" },
    201, "success", true);
  const S3 = s3?.data?.id || "";

  const s4 = await test("Session: ИТ-21, 13:25, спорт зал", "POST", "/api/sessions",
    { class_id: C1, topic: "Физическая культура", planned_date: DATE, duration_minutes: 30, time_slot: "13:25", room: "спорт зал" },
    201, "success", true);
  const S4 = s4?.data?.id || "";

  const DATE2 = "2026-03-21";
  await test("Session: ИТ-21, 08:30, ГК 300а", "POST", "/api/sessions",
    { class_id: C1, topic: "Алгоритмизация", planned_date: DATE2, duration_minutes: 30, time_slot: "08:30", room: "ГК 300а" },
    201, "success", true);

  await test("Session: ФИН-31, 15:05, ГК 202", "POST", "/api/sessions",
    { class_id: C2, topic: "Бухгалтерский учёт", planned_date: DATE2, duration_minutes: 30, time_slot: "15:05", room: "ГК 202" },
    201, "success", true);

  // --- 8. ROOM CONFLICT DETECTION ---
  console.log("\n--- 8. SESSIONS: ROOM CONFLICT DETECTION ---");
  await test("CONFLICT: same room+date+time (ГК 409 @ 08:00)", "POST", "/api/sessions",
    { class_id: C2, topic: "Conflict test", planned_date: DATE, duration_minutes: 30, time_slot: "08:00", room: "ГК 409" },
    409, "code", "ROOM_CONFLICT");

  await test("NO conflict: same room, diff time", "POST", "/api/sessions",
    { class_id: C2, topic: "Diff time", planned_date: DATE, duration_minutes: 30, time_slot: "08:30", room: "ГК 409" },
    201, "success", true);

  await test("NO conflict: same time, diff room", "POST", "/api/sessions",
    { class_id: C2, topic: "Diff room", planned_date: DATE, duration_minutes: 30, time_slot: "08:00", room: "ГК 202" },
    201, "success", true);

  await test("NO conflict: same room+time, diff date", "POST", "/api/sessions",
    { class_id: C2, topic: "Diff date", planned_date: "2026-03-22", duration_minutes: 30, time_slot: "08:00", room: "ГК 409" },
    201, "success", true);

  // --- 9. VALIDATION ERRORS ---
  console.log("\n--- 9. SESSIONS: VALIDATION ERRORS ---");
  await test("INVALID: missing room", "POST", "/api/sessions",
    { class_id: C1, topic: "No room", planned_date: DATE, duration_minutes: 30, time_slot: "08:00" },
    400, "success", false);

  await test("INVALID: missing time_slot", "POST", "/api/sessions",
    { class_id: C1, topic: "No time", planned_date: DATE, duration_minutes: 30, room: "ГК 409" },
    400, "success", false);

  await test("INVALID: bad time_slot 07:15", "POST", "/api/sessions",
    { class_id: C1, topic: "Bad time", planned_date: DATE, duration_minutes: 30, time_slot: "07:15", room: "ГК 409" },
    400, "success", false);

  await test("INVALID: bad room name", "POST", "/api/sessions",
    { class_id: C1, topic: "Bad room", planned_date: DATE, duration_minutes: 30, time_slot: "08:00", room: "ZZZ 999" },
    400, "success", false);

  await test("INVALID: missing topic", "POST", "/api/sessions",
    { class_id: C1, planned_date: DATE, duration_minutes: 30, time_slot: "08:00", room: "ГК 409" },
    400, "success", false);

  await test("INVALID: missing class_id", "POST", "/api/sessions",
    { topic: "No class", planned_date: DATE, duration_minutes: 30, time_slot: "08:00", room: "ГК 409" },
    400, "success", false);

  await test("INVALID: empty topic", "POST", "/api/sessions",
    { class_id: C1, topic: "", planned_date: DATE, duration_minutes: 30, time_slot: "08:00", room: "ГК 100" },
    400, "success", false);

  // --- 10. BOOKED ROOMS ---
  console.log("\n--- 10. BOOKED ROOMS ENDPOINT ---");
  const booked = await test("Booked rooms for " + DATE, "GET", `/api/sessions/booked-rooms?date=${DATE}`, null, 200);
  if (booked) {
    const data = Array.isArray(booked) ? booked : (booked.data || []);
    console.log(`    -> Found ${Array.isArray(data) ? data.length : '?'} booked slots`);
  }

  await test("Booked rooms for " + DATE2, "GET", `/api/sessions/booked-rooms?date=${DATE2}`, null, 200);
  await test("Booked rooms: missing date param", "GET", "/api/sessions/booked-rooms", null, 400);

  // --- 11. SESSION LIST ---
  console.log("\n--- 11. SESSION LIST ---");
  const list = await test("List all sessions", "GET", "/api/sessions", null, 200, "success", true);
  if (list?.data) {
    const arr = Array.isArray(list.data) ? list.data : [];
    console.log(`    -> Found ${arr.length} sessions`);
    // Check that sessions have room and time_slot fields
    const withRoom = arr.filter(s => s.room);
    const withTime = arr.filter(s => s.time_slot);
    console.log(`    -> ${withRoom.length} have room, ${withTime.length} have time_slot`);
  }

  // --- 12. SESSION UPDATE ---
  console.log("\n--- 12. SESSION UPDATE ---");
  if (S1) {
    await test("Update session topic", "PUT", `/api/sessions/${S1}`,
      { topic: "Информатика - обновлённая тема" }, 200, "success", true);

    await test("Update session room+time", "PUT", `/api/sessions/${S1}`,
      { time_slot: "09:00", room: "ГК 400" }, 200, "success", true);

    // Conflict on update: S2 is at 09:40, МК 131
    await test("Update to conflicting room+time (409)", "PUT", `/api/sessions/${S1}`,
      { time_slot: "09:40", room: "МК 131" }, 409, "code", "ROOM_CONFLICT");
  }

  // --- 13. SESSION COMPLETE ---
  console.log("\n--- 13. SESSION COMPLETE ---");
  if (S2) {
    await test("Complete session ФИН-31", "PATCH", `/api/sessions/${S2}/complete`, {}, 200, "success", true);
  }

  // --- 14. SESSION DELETE ---
  console.log("\n--- 14. SESSION DELETE ---");
  if (S4) {
    await test("Delete session (спорт зал)", "DELETE", `/api/sessions/${S4}`, null, 200, "success", true);
    await test("Delete already deleted (404)", "DELETE", `/api/sessions/${S4}`, null, 404, "success", false);
  }

  // --- 15. GRADES ---
  console.log("\n--- 15. GRADES ---");
  if (S3 && studentIds.length >= 3) {
    const gr = await test("Add grades to session ПР-12", "POST", `/api/grades/sessions/${S3}/grades`,
      { grades: [
        { student_id: studentIds[0], score: 5, status: "present", comment: "Отлично" },
        { student_id: studentIds[1], score: 4, status: "present", comment: "Хорошо" },
        { student_id: studentIds[2], score: 0, status: "absent", comment: "Не пришёл" },
      ]}, null);

    if (studentIds[0]) {
      await test("Get grades for student", "GET", `/api/grades/students/${studentIds[0]}/grades`, null, 200, "success", true);
    }
  }

  // --- 16. ADMIN LIST/EDIT ---
  console.log("\n--- 16. ADMIN: LIST/EDIT ---");
  const users = await test("List all users", "GET", "/api/admin/users", null, 200, "success", true);
  if (users?.data) console.log(`    -> ${users.data.length} users total`);

  const classes = await test("List all classes", "GET", "/api/admin/classes", null, 200, "success", true);
  if (classes?.data) console.log(`    -> ${classes.data.length} classes total`);

  if (T3) {
    await test("Edit teacher name", "PUT", `/api/admin/users/${T3}`,
      { full_name: "Касымов Б.Н. (обновлено)" }, 200, "success", true);
  }
  if (C3) {
    await test("Edit class name", "PUT", `/api/admin/classes/${C3}`,
      { name: "ПР-12 (обновлено)" }, 200, "success", true);
  }

  // --- 17. EDGE CASES ---
  console.log("\n--- 17. EDGE CASES ---");
  await test("Session for nonexistent class (validation err)", "POST", "/api/sessions",
    { class_id: "nonexistent-id", topic: "Test", planned_date: DATE, duration_minutes: 30, time_slot: "08:00", room: "ГК 409" },
    400, "success", false);

  await test("Delete nonexistent user", "DELETE", "/api/admin/users/fake-user", null, 404, "success", false);
  await test("Delete nonexistent class", "DELETE", "/api/admin/classes/fake-class", null, 404, "success", false);

  await test("Add students with empty array", "POST", `/api/admin/classes/${C1}/students`,
    { student_ids: [] }, 400, "success", false);

  await test("Create user with invalid role", "POST", "/api/admin/users",
    { full_name: "Bad Role", role: "superadmin", phone: "+77099999999", lang: "ru" }, 400, "success", false);

  // --- 18. ALL 21 VALID TIME SLOTS ---
  console.log("\n--- 18. ALL 21 VALID TIME SLOTS ---");
  const ALL_SLOTS = ["08:00","08:30","09:00","09:40","10:10","10:40","11:25","11:55","12:25",
                      "13:25","13:55","14:25","15:05","15:35","16:05","16:50","17:20","17:50",
                      "18:30","19:00","19:30"];
  const VALID_ROOMS = ["ГК 100","ГК 101","ГК 102","ГК 103","ГК 104","ГК 105","ГК 106","ГК 107","ГК 108",
                        "ГК 202","ГК 203","ГК 204","ГК 205","ГК 206","ГК 207","ГК 208","ГК 209","ГК 210",
                        "ГК 211","ГК 300а","ГК 301"];
  const SLOT_DATE = "2026-04-01";
  for (let i = 0; i < ALL_SLOTS.length; i++) {
    const room = VALID_ROOMS[i % VALID_ROOMS.length];
    await test(`Slot ${ALL_SLOTS[i]} in ${room}`, "POST", "/api/sessions",
      { class_id: C1, topic: `Слот ${ALL_SLOTS[i]}`, planned_date: SLOT_DATE, duration_minutes: 30, time_slot: ALL_SLOTS[i], room },
      201, "success", true);
  }

  // --- 19. REMOVE STUDENT, DELETE CLASS ---
  console.log("\n--- 19. REMOVE STUDENT / DELETE CLASS ---");
  if (C3 && studentIds[0]) {
    await test("Remove student from ПР-12", "DELETE", `/api/admin/classes/${C3}/students/${studentIds[0]}`,
      null, 200, "success", true);
  }

  // ============================================================
  // RESULTS
  // ============================================================
  console.log("\n========================================");
  console.log("  TEST RESULTS");
  console.log("========================================");
  console.log(`  \x1b[32mPASSED: ${pass}\x1b[0m`);
  console.log(`  \x1b[${fail > 0 ? 31 : 32}mFAILED: ${fail}\x1b[0m`);
  console.log(`  TOTAL:  ${pass + fail}`);

  if (errors.length > 0) {
    console.log("\n--- FAILURES ---");
    for (const e of errors) console.log(`  \x1b[31m- ${e}\x1b[0m`);
  }
  console.log("");

  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
