# Инструкция по настройке проекта

## 1. Создание Cloudflare ресурсов

### D1 Database
```bash
npx wrangler d1 create tarbie-db
```
Скопируйте `database_id` из вывода и вставьте в `apps/worker/wrangler.toml` (строка 9).

### KV Namespace
```bash
npx wrangler kv namespace create TARBIE_KV
```
Скопируйте `id` и вставьте в `apps/worker/wrangler.toml` (строка 13).

### Queue
```bash
npx wrangler queues create tarbie-notifications
```

### Обновите wrangler.toml для bot-worker
```bash
npx wrangler kv namespace create TARBIE_KV
```
Скопируйте `id` и вставьте в `apps/bot-worker/wrangler.toml`.

## 2. Применение миграций D1

```bash
cd apps/worker
npx wrangler d1 migrations apply tarbie-db --remote
```

## 3. Настройка секретов в Cloudflare

### Для API Worker (apps/worker)
```bash
cd apps/worker

# JWT секрет (минимум 32 символа)
npx wrangler secret put JWT_SECRET
# Введите: любую случайную строку длиной 32+ символов

# OTP секрет (минимум 32 символа)
npx wrangler secret put OTP_SECRET
# Введите: другую случайную строку длиной 32+ символов
```

### Для Bot Worker (apps/bot-worker)
```bash
cd apps/bot-worker

# Telegram Bot Token (получите у @BotFather)
npx wrangler secret put TELEGRAM_BOT_TOKEN
# Введите токен вида: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Webhook Secret (любая случайная строка)
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
# Введите: случайную строку для защиты webhook

# WhatsApp токен (если используете)
npx wrangler secret put WHATSAPP_TOKEN
npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID
```

## 4. Настройка локальной разработки

### Создайте .dev.vars файлы (они в .gitignore)

**apps/worker/.dev.vars:**
```
JWT_SECRET=local-dev-jwt-secret-min-32-chars
OTP_SECRET=local-dev-otp-secret-min-32-chars
```

**apps/bot-worker/.dev.vars:**
```
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
TELEGRAM_WEBHOOK_SECRET=local-webhook-secret
WHATSAPP_TOKEN=optional
WHATSAPP_PHONE_NUMBER_ID=optional
```

**apps/web/.env.local:**
```
VITE_API_URL=http://localhost:8787
VITE_TELEGRAM_BOT_USERNAME=YourBotUsername
```

## 5. Деплой Worker'ов

```bash
# Деплой API Worker
cd apps/worker
npx wrangler deploy

# Деплой Bot Worker
cd apps/bot-worker
npx wrangler deploy
```

## 6. Настройка Telegram Webhook

После деплоя bot-worker выполните:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://tarbie-bot.bahtyarsanzhar.workers.dev/telegram/webhook",
    "secret_token": "<YOUR_WEBHOOK_SECRET>"
  }'
```

## 7. Деплой Frontend

```bash
cd apps/web

# Создайте .env.production
echo "VITE_API_URL=https://dprabota.bahtyarsanzhar.workers.dev" > .env.production
echo "VITE_TELEGRAM_BOT_USERNAME=YourBotUsername" >> .env.production

# Соберите
pnpm build

# Задеплойте на Cloudflare Pages
npx wrangler pages deploy dist --project-name=tarbie-sagaty
```

## 8. Запуск локально

Откройте 3 терминала:

**Терминал 1:**
```bash
cd apps/worker
pnpm dev
```

**Терминал 2:**
```bash
cd apps/bot-worker
pnpm dev
```

**Терминал 3:**
```bash
cd apps/web
pnpm dev
```

Откройте http://localhost:5173

## Проверка работы

1. Откройте http://localhost:5173
2. Введите номер телефона (например: +77001234567)
3. Проверьте консоль worker'а — должен появиться OTP код
4. Введите код и войдите в систему

## Создание первого пользователя-администратора

Выполните SQL напрямую в D1:

```bash
npx wrangler d1 execute tarbie-db --remote --command \
  "INSERT INTO users (id, phone, full_name, role, lang) 
   VALUES ('admin-1', '+77001234567', 'Администратор', 'admin', 'ru')"
```

Теперь можете войти с этим номером телефона.
