# Тәрбие Сағаты Manager

Электронная система управления классными часами для школ Казахстана. Построена на Cloudflare Workers, D1, KV, Queues с React SPA фронтендом.

## Архитектура

```
├── packages/shared     — Общие типы, Zod-схемы, утилиты
├── apps/worker         — API Worker (Hono + D1 + KV + Queues)
├── apps/bot-worker     — Telegram/WhatsApp бот + Queue Consumer
├── apps/web            — React SPA (Vite + Tailwind)
└── .github/workflows   — CI/CD pipeline
```

## Требования

- Node.js 20+
- pnpm 9+
- Cloudflare account с доступом к Workers, D1, KV, Queues

## Быстрый старт

### 1. Установка зависимостей

```bash
pnpm install
```

### 2. Создание ресурсов Cloudflare

```bash
# D1 Database
npx wrangler d1 create tarbie-db

# KV Namespace
npx wrangler kv namespace create TARBIE_KV

# Queue
npx wrangler queues create tarbie-notifications
```

Обновите `wrangler.toml` файлы с полученными ID.

### 3. Запуск миграций D1

```bash
cd apps/worker
npx wrangler d1 migrations apply tarbie-db --local    # локально
npx wrangler d1 migrations apply tarbie-db --remote   # продакшн
```

### 4. Настройка секретов

```bash
cd apps/worker
npx wrangler secret put JWT_SECRET
npx wrangler secret put OTP_SECRET

cd ../bot-worker
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put WHATSAPP_TOKEN
npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID
```

### 5. Настройка Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://tarbie-bot.<your-subdomain>.workers.dev/telegram/webhook",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"
  }'
```

### 6. Локальная разработка

```bash
# Терминал 1: API Worker
cd apps/worker
pnpm dev

# Терминал 2: Bot Worker
cd apps/bot-worker
pnpm dev

# Терминал 3: Frontend
cd apps/web
pnpm dev
```

Frontend доступен на `http://localhost:5173`, API на `http://localhost:8787`.

## Деплой

### Автоматический (GitHub Actions)

Добавьте секреты в GitHub:
- `CF_API_TOKEN` — Cloudflare API Token
- `CF_ACCOUNT_ID` — Cloudflare Account ID
- `API_URL` — URL API Worker (например `https://tarbie-api.your-subdomain.workers.dev`)
- `TELEGRAM_BOT_USERNAME` — Username Telegram бота

Push в `main` запускает деплой всех компонентов.

### Ручной

```bash
# Shared
pnpm --filter @tarbie/shared build

# Workers
cd apps/worker && npx wrangler deploy
cd apps/bot-worker && npx wrangler deploy

# Frontend
cd apps/web && pnpm build
npx wrangler pages deploy dist --project-name=tarbie-sagaty
```

## API Эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/login` | Запрос OTP по номеру телефона |
| POST | `/api/auth/verify` | Верификация OTP, получение JWT |
| GET | `/api/auth/me` | Текущий пользователь |
| GET | `/api/sessions` | Список тәрбие сағаттары |
| POST | `/api/sessions` | Создание сессии |
| PUT | `/api/sessions/:id` | Обновление сессии |
| PATCH | `/api/sessions/:id/complete` | Завершение сессии |
| DELETE | `/api/sessions/:id` | Удаление сессии |
| POST | `/api/attendance/:sessionId` | Отметка посещаемости |
| GET | `/api/attendance/:sessionId` | Получение посещаемости |
| POST | `/api/notifications/send` | Ручная отправка уведомления |
| GET | `/api/notifications/logs` | Логи уведомлений |
| GET | `/api/admin/users` | Список пользователей |
| POST | `/api/admin/users` | Создание пользователя |
| GET | `/api/admin/classes` | Список классов |
| POST | `/api/admin/classes` | Создание класса |
| POST | `/api/admin/classes/:id/students` | Добавление ученика в класс |
| GET | `/api/reports/monthly` | Месячный отчёт по классу |

## Telegram бот команды

| Команда | Описание |
|---------|----------|
| `/start` | Начало работы / привязка аккаунта |
| `/my_sessions` | Предстоящие классные часы |
| `/confirm <id>` | Отметить сессию как завершённую |

## Стек технологий

- **Backend**: Cloudflare Workers, Hono, D1 (SQLite), KV, Queues
- **Frontend**: React 18, Vite, Tailwind CSS, Zustand, Recharts, Lucide
- **Боты**: Telegram Bot API, WhatsApp Business Cloud API
- **Auth**: JWT на Workers Crypto API (без внешних библиотек)
- **Валидация**: Zod (shared между фронтом и бэком)
- **CI/CD**: GitHub Actions + Wrangler
- **Языки**: Казахский (kz) / Русский (ru)

## Лицензия

MIT
