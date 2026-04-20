
## 1. Общее описание проекта

Ты — senior full-stack архитектор. Спроектируй и реализуй образовательную онлайн-платформу для проведения уроков в реальном времени и в записи. Платформа должна поддерживать множество ролей, интерактивные уроки, систему оценок, аналитику и командную разработку.

---

## 2. Роли пользователей и их права

| Роль | Права |
|---|---|
| **Ученик (Student)** | Просмотр курсов, запись на уроки, прохождение тестов, отправка домашних заданий, просмотр своего прогресса, чат с преподавателем |
| **Преподаватель (Teacher)** | Создание/редактирование курсов и уроков, проведение онлайн-уроков (видео/аудио), проверка заданий, выставление оценок, просмотр аналитики по ученикам |
| **Администратор (Admin)** | Управление пользователями, модерация контента, настройка платформы, доступ к полной аналитике, управление платежами и подписками |
| **Модератор (Moderator)** | Модерация чатов и комментариев, обработка жалоб, блокировка нарушителей |
| **Родитель (Parent)** *(опционально)* | Просмотр прогресса ученика, получение уведомлений, связь с преподавателем |

---

## 3. Структура сайта — разделы и функции

### 3.1. Публичная часть (без авторизации)
- **Главная страница** — описание платформы, преимущества, отзывы, CTA
- **Каталог курсов** — фильтрация по категориям, уровням, рейтингу, цене
- **Страница курса** — описание, программа, преподаватель, отзывы, кнопка записи
- **Регистрация / Вход** — email, OAuth (Google, GitHub), двухфакторная аутентификация
- **Блог / База знаний** — статьи, новости, FAQ

### 3.2. Личный кабинет ученика
- **Dashboard** — текущие курсы, ближайшие уроки, прогресс
- **Мои курсы** — список записанных курсов с прогресс-баром
- **Урок** — видеоплеер / вебинарная комната, материалы, заметки, чат
- **Задания** — список заданий, загрузка ответов, статус проверки
- **Тесты / Квизы** — интерактивные тесты с таймером, результаты
- **Сертификаты** — выданные сертификаты в PDF
- **Настройки профиля** — аватар, данные, уведомления, язык

### 3.3. Панель преподавателя
- **Dashboard** — статистика курсов, активные ученики, ближайшие уроки
- **Конструктор курсов** — drag-and-drop редактор модулей и уроков
- **Проведение урока** — запуск видеозвонка, демонстрация экрана, интерактивная доска
- **Проверка заданий** — очередь заданий, комментарии, оценки
- **Аналитика** — вовлеченность, средний балл, отсев

### 3.4. Панель администратора
- **Управление пользователями** — CRUD, роли, блокировка
- **Управление курсами** — модерация, публикация, удаление
- **Финансы** — платежи, подписки, возвраты, отчёты
- **Системные настройки** — email-шаблоны, интеграции, лимиты
- **Аналитика платформы** — DAU/MAU, конверсии, доход, популярные курсы

### 3.5. Общие функции
- **Уведомления** — in-app, email, push (напоминания об уроках, новые оценки)
- **Чат / Мессенджер** — личные сообщения, групповые чаты курса
- **Поиск** — полнотекстовый поиск по курсам, урокам, преподавателям
- **Мультиязычность** — i18n (русский, английский как минимум)

---

## 4. Командная работа — распределение ролей и процессы

### 4.1. Состав команды

| Роль в команде | Зона ответственности |
|---|---|
| **Project Manager (PM)** | Планирование спринтов, приоритизация бэклога, координация, риск-менеджмент, демо |
| **UI/UX Designer** | Wireframes, дизайн-система, прототипы (Figma), user research, accessibility |
| **Frontend Developer** | Реализация UI, интеграция с API, responsive, анимации, SSR |
| **Backend Developer** | API, бизнес-логика, база данных, авторизация, WebSocket, очереди |
| **QA Engineer** | Тест-планы, ручное и автоматическое тестирование, баг-репорты, регрессия |
| **DevOps / Support** | CI/CD, мониторинг, деплой, логирование, инфраструктура, анализ инцидентов |

### 4.2. Рабочий процесс (Workflow)

```
1. PM создаёт задачу в трекере (Jira / Linear / GitHub Issues)
2. Designer готовит макеты → ревью с PM и командой
3. Developer берёт задачу в спринт:
   a. Создаёт feature-branch от develop
   b. Реализует функционал
   c. Пишет unit/integration тесты
   d. Создаёт Pull Request
4. Code Review — минимум 1 апрув от другого разработчика
5. QA тестирует на staging-окружении
6. PM принимает задачу (acceptance)
7. Merge в develop → автодеплой на staging
8. Release: develop → main → автодеплой на production
```

### 4.3. Спринты и ритуалы

- **Спринт** — 2 недели
- **Daily standup** — 15 мин, асинхронный (Slack/Discord бот) или синхронный
- **Sprint Planning** — начало спринта, оценка задач (story points)
- **Sprint Review / Demo** — конец спринта, показ результата
- **Retrospective** — что улучшить, что сработало

---

## 5. Система контроля качества

### 5.1. Code Review
- Каждый PR проходит ревью минимум 1 разработчиком
- Чеклист ревью: читаемость, безопасность, покрытие тестами, соответствие архитектуре
- Автоматические проверки: линтер (ESLint/Prettier), типизация (TypeScript strict), сборка

### 5.2. Тестирование

| Уровень | Инструменты | Покрытие |
|---|---|---|
| **Unit-тесты** | Vitest / Jest | Бизнес-логика, утилиты, хуки — coverage ≥ 80% |
| **Integration-тесты** | Supertest, Testing Library | API endpoints, компоненты с состоянием |
| **E2E-тесты** | Playwright / Cypress | Критические пользовательские сценарии (регистрация, оплата, прохождение урока) |
| **Visual regression** | Chromatic / Percy | UI-компоненты, дизайн-система |
| **Performance** | Lighthouse CI, k6 | Время загрузки < 3с, API latency < 200ms (p95) |
| **Security** | OWASP ZAP, npm audit | XSS, CSRF, SQL injection, зависимости |

### 5.3. CI/CD Pipeline

```yaml
# Триггер: push в любую ветку / PR
stages:
  - lint        # ESLint, Prettier, TypeScript check
  - test        # Unit + Integration тесты
  - build       # Сборка приложения
  - e2e         # E2E тесты (только для PR в develop/main)
  - deploy      # Автодеплой: develop → staging, main → production
  - notify      # Уведомление в Slack/Discord
```

### 5.4. Метрики качества
- **Code coverage** ≥ 80%
- **0 critical/high bugs** на production
- **Lighthouse score** ≥ 90 (Performance, Accessibility, SEO)
- **Uptime** ≥ 99.9%
- **Mean Time To Recovery (MTTR)** < 1 час

---

## 6. Технологический стек

### 6.1. Frontend
- **Framework:** Next.js 14+ (App Router, SSR/SSG)
- **Язык:** TypeScript (strict mode)
- **Стили:** Tailwind CSS + shadcn/ui
- **Состояние:** Zustand / TanStack Query (серверное состояние)
- **Формы:** React Hook Form + Zod (валидация)
- **Видео:** WebRTC (LiveKit / Daily.co SDK) для вебинаров
- **Редактор контента:** TipTap / BlockNote (для создания уроков)
- **Иконки:** Lucide React

### 6.2. Backend
- **Runtime:** Node.js 20+
- **Framework:** Fastify или NestJS
- **ORM:** Prisma / Drizzle ORM
- **БД:** PostgreSQL (основная), Redis (кэш, сессии, очереди)
- **Аутентификация:** NextAuth.js / Lucia + JWT + OAuth 2.0
- **Файлы:** S3-совместимое хранилище (MinIO / AWS S3)
- **Real-time:** WebSocket (Socket.IO) для чата и уведомлений
- **Очереди:** BullMQ (отправка email, генерация сертификатов, обработка видео)

### 6.3. Инфраструктура
- **Хостинг:** Vercel (frontend) + Railway / Fly.io (backend) или VPS
- **CI/CD:** GitHub Actions
- **Мониторинг:** Sentry (ошибки), Grafana + Prometheus (метрики)
- **Логирование:** Pino → Loki или Betterstack
- **CDN:** Cloudflare
- **Email:** Resend / Postmark

### 6.4. Инструменты команды
- **Трекер задач:** Linear / Jira / GitHub Projects
- **Дизайн:** Figma
- **Документация:** Notion / Confluence
- **Коммуникация:** Slack / Discord
- **Репозиторий:** GitHub (monorepo, Turborepo)

---

## 7. Архитектура базы данных (ключевые сущности)

```
User (id, email, passwordHash, role, name, avatar, createdAt)
Course (id, title, description, teacherId, categoryId, price, status, createdAt)
Module (id, courseId, title, order)
Lesson (id, moduleId, title, type[video|text|live], content, duration, order)
Enrollment (id, userId, courseId, status, enrolledAt, completedAt)
Progress (id, userId, lessonId, status[not_started|in_progress|completed], completedAt)
Assignment (id, lessonId, title, description, dueDate)
Submission (id, assignmentId, userId, content, fileUrl, grade, feedback, submittedAt)
Quiz (id, lessonId, title, timeLimit)
Question (id, quizId, text, type[single|multiple|text], options, correctAnswer, points)
QuizAttempt (id, quizId, userId, score, answers, startedAt, finishedAt)
Certificate (id, userId, courseId, issuedAt, fileUrl)
Chat (id, type[private|group], courseId?)
Message (id, chatId, senderId, text, createdAt)
Notification (id, userId, type, title, body, read, createdAt)
Payment (id, userId, courseId, amount, currency, status, provider, createdAt)
Review (id, userId, courseId, rating, text, createdAt)
Category (id, name, slug, parentId?)
```

---

## 8. API — ключевые эндпоинты

```
AUTH
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/logout
  POST   /api/auth/refresh
  GET    /api/auth/me

COURSES
  GET    /api/courses                  # каталог (фильтрация, пагинация)
  GET    /api/courses/:id              # детали курса
  POST   /api/courses                  # создание (teacher/admin)
  PUT    /api/courses/:id              # редактирование
  DELETE /api/courses/:id              # удаление
  POST   /api/courses/:id/enroll       # запись на курс

LESSONS
  GET    /api/courses/:courseId/lessons
  GET    /api/lessons/:id
  POST   /api/lessons/:id/progress     # отметка прогресса

ASSIGNMENTS
  GET    /api/lessons/:lessonId/assignments
  POST   /api/assignments/:id/submit   # отправка работы
  PUT    /api/submissions/:id/grade    # оценка (teacher)

QUIZZES
  GET    /api/lessons/:lessonId/quiz
  POST   /api/quizzes/:id/attempt      # начать попытку
  PUT    /api/quiz-attempts/:id/submit # завершить

USERS
  GET    /api/users                    # список (admin)
  GET    /api/users/:id
  PUT    /api/users/:id
  GET    /api/users/:id/progress       # прогресс ученика

CHAT
  GET    /api/chats
  POST   /api/chats
  GET    /api/chats/:id/messages
  POST   /api/chats/:id/messages       # + WebSocket для real-time

PAYMENTS
  POST   /api/payments/checkout        # создание платежа
  POST   /api/payments/webhook         # callback от провайдера

ANALYTICS (admin/teacher)
  GET    /api/analytics/dashboard
  GET    /api/analytics/courses/:id
```

---

## 9. Инструкции для AI-генерации

При использовании этого промпта для генерации кода или архитектуры, придерживайся следующих правил:

1. **Генерация кода** — всегда используй TypeScript strict mode, пиши типобезопасный код
2. **Компоненты** — создавай переиспользуемые компоненты с понятными props-интерфейсами
3. **API** — используй REST с чёткой структурой ответов: `{ data, error, meta }`
4. **Ошибки** — обрабатывай все ошибки, используй кастомные error-классы
5. **Безопасность** — валидируй все входные данные (Zod), используй RBAC для авторизации
6. **Масштабируемость** — проектируй с учётом роста: пагинация, кэширование, индексы в БД
7. **Доступность (a11y)** — соблюдай WCAG 2.1 AA: семантический HTML, ARIA, контрасты
8. **Стиль кода** — следуй существующим паттернам проекта, не добавляй комментарии без запроса

---

## 10. Порядок реализации (MVP → Full)

### MVP (4–6 недель)
1. Авторизация (email + OAuth)
2. Каталог курсов и страница курса
3. Конструктор курсов (teacher)
4. Прохождение уроков (видео + текст)
5. Базовый прогресс ученика
6. Панель администратора (управление пользователями)

### V1.0 (+ 4–6 недель)
7. Задания и проверка
8. Тесты / квизы
9. Чат (teacher ↔ student)
10. Уведомления (in-app + email)
11. Платежи и подписки

### V2.0 (+ 4–6 недель)
12. Вебинары (live video)
13. Сертификаты (PDF)
14. Расширенная аналитика
15. Мультиязычность
16. Мобильная адаптация / PWA
17. Родительский кабинет
