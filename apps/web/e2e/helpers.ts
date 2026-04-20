import { Page } from '@playwright/test';

/** Fake admin user returned by /api/auth/me */
export const ADMIN_USER = {
  id: 'u_admin_001',
  full_name: 'Тест Админ',
  phone: '+77001234567',
  role: 'admin',
  school_id: 's_001',
  class_id: null,
  lang: 'ru',
  avatar_url: null,
  premium: true,
  premium_frame: null,
  premium_name_color: null,
  created_at: '2024-01-01T00:00:00Z',
};

export const TEACHER_USER = {
  ...ADMIN_USER,
  id: 'u_teacher_001',
  full_name: 'Тест Учитель',
  role: 'teacher',
  premium: false,
};

export const STUDENT_USER = {
  ...ADMIN_USER,
  id: 'u_student_001',
  full_name: 'Тест Студент',
  role: 'student',
  premium: false,
};

const FAKE_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1X2FkbWluXzAwMSJ9.fake';

/** Sample data returned by mocked API endpoints */
export const MOCK = {
  sessions: {
    data: [
      {
        id: 's_001', class_id: 'c_001', teacher_id: 'u_teacher_001', topic: 'Патриотизм',
        planned_date: '2025-04-20', time_slot: '08:00-08:30', room: '301',
        status: 'planned', duration_minutes: 30, class_name: 'ИТ-21', teacher_name: 'Тест Учитель',
        created_at: '2025-01-01T00:00:00Z', completed_at: null, cancelled_reason: null,
      },
      {
        id: 's_002', class_id: 'c_001', teacher_id: 'u_teacher_001', topic: 'Экология',
        planned_date: '2025-04-15', time_slot: '08:30-09:00', room: '205',
        status: 'completed', duration_minutes: 30, class_name: 'ИТ-21', teacher_name: 'Тест Учитель',
        created_at: '2025-01-01T00:00:00Z', completed_at: '2025-04-15T09:00:00Z', cancelled_reason: null,
      },
    ],
    total: 2,
  },
  classes: [
    { id: 'c_001', name: 'ИТ-21', school_id: 's_001', teacher_id: 'u_teacher_001', created_at: '2024-01-01' },
    { id: 'c_002', name: 'ИТ-22', school_id: 's_001', teacher_id: 'u_teacher_001', created_at: '2024-01-01' },
  ],
  users: [
    { ...ADMIN_USER },
    { ...TEACHER_USER },
    { ...STUDENT_USER },
  ],
  grades: [
    { student_id: 'u_student_001', student_name: 'Тест Студент', status: 'present', grade: 8, comment: '', student_avatar_url: null, student_premium_frame: null, student_premium_name_color: null },
  ],
  events: [
    { id: 'ev_001', title: 'День Знаний', description: 'Праздник', event_date: '2025-09-01', event_time: '10:00', location: 'Актовый зал', capacity: 200, registered_count: 50, creator_id: 'u_admin_001', creator_name: 'Тест Админ', is_registered: false, created_at: '2025-01-01' },
  ],
  openSessions: [
    { id: 'os_001', title: 'Открытый урок по физике', description: 'Демонстрация', session_date: '2025-04-25', session_time: '10:00', location: 'Лаб. 101', max_students: 30, registered_count: 5, teacher_id: 'u_teacher_001', teacher_name: 'Тест Учитель', is_registered: false, created_at: '2025-01-01' },
  ],
  courses: [
    {
      id: 'crs_001', title: 'Основы программирования', description: 'Введение в Python', teacher_id: 'u_teacher_001',
      category_id: 'cat_001', price: 0, status: 'published', cover_url: null, lang: 'ru',
      created_at: '2025-01-01', teacher_name: 'Тест Учитель', teacher_avatar_url: null,
      category_name: 'Программирование', enrolled_count: 10, avg_rating: 4.5, modules_count: 2, lessons_count: 4,
    },
  ],
  courseDetail: {
    course: {
      id: 'crs_001', title: 'Основы программирования', description: 'Введение в Python',
      teacher_id: 'u_teacher_001', price: 0, status: 'published', cover_url: null,
      created_at: '2025-01-01', teacher_name: 'Тест Учитель', teacher_avatar_url: null,
      category_name: 'Программирование', enrolled_count: 10, avg_rating: 4.5, modules_count: 2, lessons_count: 4,
    },
    modules: [
      {
        id: 'mod_001', title: 'Модуль 1: Основы', sort_order: 0,
        lessons: [
          { id: 'les_001', module_id: 'mod_001', title: 'Введение', type: 'text', duration_minutes: 15, sort_order: 0 },
          { id: 'les_002', module_id: 'mod_001', title: 'Переменные', type: 'video', duration_minutes: 20, sort_order: 1 },
        ],
      },
      {
        id: 'mod_002', title: 'Модуль 2: Циклы', sort_order: 1,
        lessons: [
          { id: 'les_003', module_id: 'mod_002', title: 'For цикл', type: 'text', duration_minutes: 10, sort_order: 0 },
          { id: 'les_004', module_id: 'mod_002', title: 'While цикл', type: 'live', duration_minutes: 30, sort_order: 1 },
        ],
      },
    ],
    enrollment: { id: 'enr_001', status: 'active' },
    progress: { total_lessons: 4, completed_lessons: 1, progress_percent: 25 },
    reviews: [
      { id: 'rev_001', user_id: 'u_student_001', rating: 5, text: 'Отличный курс!', created_at: '2025-03-01', user_name: 'Тест Студент', user_avatar_url: null },
    ],
  },
  lessonDetail: {
    lesson: { id: 'les_001', module_id: 'mod_001', title: 'Введение', type: 'text', content: 'Добро пожаловать в мир программирования!\n\nЗдесь вы изучите основы Python.', video_url: null, duration_minutes: 15, sort_order: 0 },
    progress: { id: 'lp_001', status: 'in_progress', completed_at: null },
  },
  categories: [
    { id: 'cat_001', name: 'Программирование', slug: 'programming' },
    { id: 'cat_002', name: 'Математика', slug: 'math' },
    { id: 'cat_003', name: 'Языки', slug: 'languages' },
  ],
  supportTickets: [
    { id: 't_001', user_id: 'u_student_001', user_name: 'Тест Студент', subject: 'Проблема с входом', status: 'open', created_at: '2025-04-10', last_message_at: '2025-04-10' },
  ],
  supportMessages: [
    { id: 'msg_001', ticket_id: 't_001', sender_id: 'u_student_001', sender_name: 'Тест Студент', text: 'Не могу войти в систему', created_at: '2025-04-10T10:00:00Z' },
  ],
  ratings: [
    { teacher_id: 'u_teacher_001', teacher_name: 'Тест Учитель', avg_rating: 8.5, sessions_count: 20, completed_count: 18, completion_rate: 90, avatar_url: null, premium_frame: null, premium_name_color: null },
  ],
  reports: {
    summary: { total_sessions: 50, completed_sessions: 40, completion_rate: 80, total_classes: 5 },
    teachers: [{ teacher_id: 'u_teacher_001', teacher_name: 'Тест Учитель', total: 20, completed: 18, rate: 90 }],
  },
  bookedRooms: [] as { room: string; time_slot: string }[],
  notifications: [] as unknown[],
};

/**
 * Set up all API route mocks so the SPA can render fully.
 * Also injects auth token + user into localStorage.
 * The Zustand persist store key is 'tarbie-auth' and only persists {token, lang}.
 * On rehydration it calls fetchMe() which hits /api/auth/me — our mock returns the user.
 */
export async function setupMocks(page: Page, user = ADMIN_USER) {
  const API = '**/api/**';

  // Inject auth into localStorage BEFORE loading the page
  await page.addInitScript((u) => {
    const state = {
      state: {
        token: 'fake_jwt_token',
        lang: u.lang,
      },
      version: 0,
    };
    localStorage.setItem('tarbie-auth', JSON.stringify(state));
  }, user);

  // Intercept ALL API calls
  await page.route(API, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    // Auth
    if (path === '/api/auth/me' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: user } });
    }
    if (path === '/api/auth/login' && method === 'POST') {
      return route.fulfill({ json: { success: true, data: { message: 'OTP sent', expires_in: 300 } } });
    }
    if (path === '/api/auth/verify' && method === 'POST') {
      return route.fulfill({ json: { success: true, data: { token: FAKE_TOKEN, user } } });
    }
    if (path === '/api/auth/me' && method === 'PUT') {
      return route.fulfill({ json: { success: true, data: user } });
    }
    if (path === '/api/auth/me/avatar' && method === 'POST') {
      return route.fulfill({ json: { success: true, data: { avatar_url: '/avatars/test.jpg' } } });
    }

    // Sessions
    if (path === '/api/sessions' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.sessions } });
    }
    if (path === '/api/sessions' && method === 'POST') {
      return route.fulfill({ status: 201, json: { success: true, data: { id: 's_new_001' } } });
    }
    if (path === '/api/sessions/classes' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.classes.map(c => ({ id: c.id, name: c.name })) } });
    }
    if (path === '/api/sessions/booked-rooms') {
      return route.fulfill({ json: { success: true, data: MOCK.bookedRooms } });
    }
    if (path.match(/\/api\/sessions\/[^/]+$/) && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.sessions.data[0] } });
    }
    if (path.match(/\/api\/sessions\/[^/]+\/complete/) && method === 'POST') {
      return route.fulfill({ json: { success: true, data: { ...MOCK.sessions.data[0], status: 'completed' } } });
    }
    if (path.match(/\/api\/sessions\/[^/]+\/cancel/) && method === 'POST') {
      return route.fulfill({ json: { success: true, data: { ...MOCK.sessions.data[0], status: 'cancelled' } } });
    }

    // Grades
    if (path.match(/\/api\/grades\/sessions\/[^/]+\/init/) && method === 'POST') {
      return route.fulfill({ json: { success: true, data: {} } });
    }
    if (path.match(/\/api\/grades\/sessions\/[^/]+\/grades/) && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.grades } });
    }
    if (path.match(/\/api\/grades\/sessions\/[^/]+\/grades/) && method === 'PUT') {
      return route.fulfill({ json: { success: true, data: {} } });
    }
    if (path === '/api/grades' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.sessions.data } });
    }

    // Events
    if (path === '/api/events' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.events } });
    }
    if (path === '/api/events' && method === 'POST') {
      return route.fulfill({ status: 201, json: { success: true, data: { id: 'ev_new' } } });
    }
    if (path.match(/\/api\/events\/[^/]+\/register/) && method === 'POST') {
      return route.fulfill({ json: { success: true, data: {} } });
    }
    if (path.match(/\/api\/events\/[^/]+$/) && method === 'DELETE') {
      return route.fulfill({ json: { success: true, data: {} } });
    }

    // Open sessions
    if (path === '/api/open-sessions' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.openSessions } });
    }
    if (path === '/api/open-sessions' && method === 'POST') {
      return route.fulfill({ status: 201, json: { success: true, data: { id: 'os_new' } } });
    }
    if (path.match(/\/api\/open-sessions\/[^/]+\/register/) && method === 'POST') {
      return route.fulfill({ json: { success: true, data: {} } });
    }

    // Courses
    if (path === '/api/courses/categories' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.categories } });
    }
    if (path === '/api/courses' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.courses } });
    }
    if (path === '/api/courses' && method === 'POST') {
      return route.fulfill({ status: 201, json: { success: true, data: { id: 'crs_new_001' } } });
    }
    if (path === '/api/courses/my/enrolled' && method === 'GET') {
      return route.fulfill({
        json: {
          success: true, data: [{
            id: 'crs_001', title: 'Основы программирования', description: 'Введение в Python',
            cover_url: null, teacher_name: 'Тест Учитель', teacher_avatar_url: null,
            category_name: 'Программирование', lessons_count: 4, completed_lessons: 1,
            enrollment_status: 'active', enrolled_at: '2025-03-01',
          }],
        },
      });
    }
    if (path.match(/\/api\/courses\/[^/]+\/lessons\/[^/]+\/progress/) && method === 'POST') {
      return route.fulfill({ json: { success: true, data: {} } });
    }
    if (path.match(/\/api\/courses\/[^/]+\/lessons\/[^/]+$/) && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.lessonDetail } });
    }
    if (path.match(/\/api\/courses\/[^/]+\/enroll/) && method === 'POST') {
      return route.fulfill({ json: { success: true, data: { id: 'enr_new' } } });
    }
    if (path.match(/\/api\/courses\/[^/]+\/reviews/) && method === 'POST') {
      return route.fulfill({ json: { success: true, data: { id: 'rev_new' } } });
    }
    if (path.match(/\/api\/courses\/[^/]+\/modules\/[^/]+\/lessons\/[^/]+$/) && (method === 'PUT' || method === 'DELETE')) {
      return route.fulfill({ json: { success: true, data: {} } });
    }
    if (path.match(/\/api\/courses\/[^/]+\/modules\/[^/]+\/lessons/) && method === 'POST') {
      return route.fulfill({ status: 201, json: { success: true, data: { id: 'les_new' } } });
    }
    if (path.match(/\/api\/courses\/[^/]+\/modules\/[^/]+$/) && (method === 'PUT' || method === 'DELETE')) {
      return route.fulfill({ json: { success: true, data: {} } });
    }
    if (path.match(/\/api\/courses\/[^/]+\/modules/) && method === 'POST') {
      return route.fulfill({ status: 201, json: { success: true, data: { id: 'mod_new' } } });
    }
    if (path.match(/\/api\/courses\/[^/]+$/) && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.courseDetail } });
    }
    if (path.match(/\/api\/courses\/[^/]+$/) && method === 'PUT') {
      return route.fulfill({ json: { success: true, data: {} } });
    }

    // Admin
    if (path === '/api/admin/users' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.users } });
    }
    if (path === '/api/admin/users' && method === 'POST') {
      return route.fulfill({ status: 201, json: { success: true, data: { id: 'u_new' } } });
    }
    if (path.match(/\/api\/admin\/users\/[^/]+$/) && method === 'PUT') {
      return route.fulfill({ json: { success: true, data: {} } });
    }
    if (path.match(/\/api\/admin\/users\/[^/]+$/) && method === 'DELETE') {
      return route.fulfill({ json: { success: true, data: {} } });
    }
    if (path === '/api/admin/users/import' && method === 'POST') {
      return route.fulfill({ json: { success: true, data: { created: 3, skipped: 0, errors: [] } } });
    }
    if (path === '/api/admin/classes' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.classes } });
    }
    if (path === '/api/admin/classes' && method === 'POST') {
      return route.fulfill({ status: 201, json: { success: true, data: { id: 'c_new' } } });
    }
    if (path.match(/\/api\/admin\/classes\/[^/]+$/) && method === 'DELETE') {
      return route.fulfill({ json: { success: true, data: {} } });
    }
    if (path.match(/\/api\/admin\/classes\/[^/]+\/students/) && method === 'GET') {
      return route.fulfill({ json: { success: true, data: [STUDENT_USER] } });
    }
    if (path.match(/\/api\/admin\/sessions\/auto-assign/) && method === 'POST') {
      return route.fulfill({ json: { success: true, data: { created: 5, duplicates: 0, errors: 0, log: [{ group: 'ИТ-21', pair: 1, status: 'created' }] } } });
    }
    if (path.match(/\/api\/admin\/sessions\/import/) && method === 'POST') {
      return route.fulfill({ json: { success: true, data: { created: 3, duplicates: 0, errors: 0, log: [{ group: 'ИТ-21', topic: 'Тема', date: '2025-09-02', status: 'created' }] } } });
    }
    if (path.match(/\/api\/admin\/settings/) && (method === 'GET' || method === 'PUT' || method === 'POST')) {
      return route.fulfill({ json: { success: true, data: { support_chat_id: '', result: { ok: true } } } });
    }

    // Reports
    if (path === '/api/reports' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.reports } });
    }
    if (path.match(/\/api\/reports\/monthly/) && method === 'GET') {
      return route.fulfill({
        json: {
          success: true,
          data: {
            class_name: 'ИТ-21',
            month: '2025-04',
            total_planned: 10,
            total_completed: 8,
            total_cancelled: 1,
            total_rescheduled: 1,
            completion_rate: 80,
            attendance_rate: 90,
            total_students: 25,
            sessions: MOCK.sessions.data,
          },
        },
      });
    }
    if (path.match(/\/api\/reports\//) && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.reports } });
    }

    // Ratings
    if (path === '/api/ratings' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.ratings } });
    }
    if (path === '/api/ratings/teachers' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.ratings } });
    }

    // Support
    if (path === '/api/support/tickets' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.supportTickets } });
    }
    if (path === '/api/support/tickets' && method === 'POST') {
      return route.fulfill({ status: 201, json: { success: true, data: { id: 't_new' } } });
    }
    if (path === '/api/support' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.supportTickets } });
    }
    if (path === '/api/support' && method === 'POST') {
      return route.fulfill({ status: 201, json: { success: true, data: { id: 't_new' } } });
    }
    if (path.match(/\/api\/support\/tickets\/[^/]+$/) && method === 'GET') {
      return route.fulfill({ json: { success: true, data: { ticket: MOCK.supportTickets[0], messages: MOCK.supportMessages } } });
    }
    if (path.match(/\/api\/support\/[^/]+\/messages/) && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.supportMessages } });
    }
    if (path.match(/\/api\/support\/[^/]+\/messages/) && method === 'POST') {
      return route.fulfill({ json: { success: true, data: { id: 'msg_new' } } });
    }
    if (path.match(/\/api\/support\/phone-change/)) {
      return route.fulfill({ json: { success: true, data: {} } });
    }

    // Notifications
    if (path === '/api/notifications' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.notifications } });
    }

    // Admin settings / changelog
    if (path === '/api/admin/changelog' && method === 'GET') {
      return route.fulfill({ json: { success: true, data: [] } });
    }

    // Grades — class-specific endpoints
    if (path.match(/\/api\/grades\/classes\/[^/]+\/monthly/) && method === 'GET') {
      return route.fulfill({ json: { success: true, data: [] } });
    }
    if (path.match(/\/api\/grades\/classes\/[^/]+\/sessions/) && method === 'GET') {
      return route.fulfill({ json: { success: true, data: MOCK.sessions.data } });
    }

    // Health
    if (path === '/api/health') {
      return route.fulfill({ json: { success: true, data: { status: 'ok' } } });
    }

    // Catch-all
    console.log(`[MOCK] Unhandled: ${method} ${path}`);
    return route.fulfill({ json: { success: true, data: {} } });
  });
}

/** Navigate to a page after mocks are set up */
export async function goTo(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  // Wait for React to render and auth to rehydrate
  await page.waitForTimeout(1500);
}
