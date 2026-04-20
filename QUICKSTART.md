# Быстрый старт для dprabota.bahtyarsanzhar.workers.dev

## Шаг 1: Создание Cloudflare ресурсов

Выполните команды по очереди и сохраняйте полученные ID:

### 1.1 D1 Database
```bash
npx wrangler d1 create tarbie-db
```

**Результат будет примерно таким:**
```
✅ Successfully created DB 'tarbie-db'
database_id = "abc123-def456-ghi789"
```

Откройте `apps/worker/wrangler.toml` и замените строку 9:
```toml
database_id = "abc123-def456-ghi789"  # вставьте ваш ID
```

### 1.2 KV Namespace для API Worker
```bash
npx wrangler kv namespace create TARBIE_KV
```

**Результат:**
```
✅ Created namespace with id "xyz789abc123def456"
```

Откройте `apps/worker/wrangler.toml` и замените строку 13:
```toml
id = "xyz789abc123def456"  # вставьте ваш ID
```

### 1.3 KV Namespace для Bot Worker
```bash
npx wrangler kv namespace create TARBIE_KV
```

Откройте `apps/bot-worker/wrangler.toml` и вставьте полученный ID.

### 1.4 Queue
```bash
npx wrangler queues create tarbie-notifications
```

## Шаг 2: Применение миграций D1

```bash
cd apps/worker
npx wrangler d1 migrations apply tarbie-db --remote
```

## Шаг 3: Настройка секретов

### 3.1 Секреты для API Worker
```bash
cd apps/worker

# JWT секрет (минимум 32 символа, можно сгенерировать случайную строку)
npx wrangler secret put JWT_SECRET
# Введите: my-super-secret-jwt-key-32-chars-min

# OTP секрет
npx wrangler secret put OTP_SECRET
# Введите: my-super-secret-otp-key-32-chars-min
```

### 3.2 Секреты для Bot Worker

Сначала создайте Telegram бота:
1. Откройте https://t.me/BotFather
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Сохраните полученный токен

```bash
cd apps/bot-worker

# Telegram Bot Token
npx wrangler secret put TELEGRAM_BOT_TOKEN
# Введите токен от BotFather: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Webhook Secret (любая случайная строка)
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
# Введите: my-random-webhook-secret-123

# WhatsApp (опционально, можно пропустить)
# npx wrangler secret put WHATSAPP_TOKEN
# npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID
```

## Шаг 4: Деплой Workers

```bash
# API Worker
cd apps/worker
npx wrangler deploy

# Bot Worker
cd ../bot-worker
npx wrangler deploy
```

После деплоя вы увидите URL вашего bot-worker (например: `https://tarbie-bot-xxx.bahtyarsanzhar.workers.dev`)

## Шаг 5: Настройка Telegram Webhook

Замените `<BOT_TOKEN>` и `<WEBHOOK_SECRET>` на ваши значения:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" ^
  -H "Content-Type: application/json" ^
  -d "{\"url\": \"https://tarbie-bot-xxx.bahtyarsanzhar.workers.dev/telegram/webhook\", \"secret_token\": \"<WEBHOOK_SECRET>\"}"
```

## Шаг 6: Создание первого администратора

```bash
npx wrangler d1 execute tarbie-db --remote --command "INSERT INTO users (id, phone, full_name, role, lang) VALUES ('admin-1', '+77001234567', 'Admin', 'admin', 'ru')"
```

Замените `+77001234567` на ваш реальный номер телефона.

## Шаг 7: Деплой Frontend

```bash
cd apps/web

# Создайте .env.production
echo VITE_API_URL=https://dprabota.bahtyarsanzhar.workers.dev > .env.production
echo VITE_TELEGRAM_BOT_USERNAME=YourBotUsername >> .env.production

# Соберите проект
pnpm build

# Задеплойте на Cloudflare Pages
npx wrangler pages deploy dist --project-name=tarbie-sagaty
```

## Шаг 8: Проверка работы

1. Откройте URL вашего Cloudflare Pages сайта
2. Введите номер телефона администратора
3. Проверьте логи worker для получения OTP кода:
   ```bash
   npx wrangler tail dprabota
   ```
4. Введите код и войдите в систему

## Локальная разработка

Для локальной разработки создайте файлы:

**apps/worker/.dev.vars:**
```
JWT_SECRET=local-dev-jwt-secret-min-32-chars
OTP_SECRET=local-dev-otp-secret-min-32-chars
```

**apps/bot-worker/.dev.vars:**
```
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_SECRET=local-secret
```

**apps/web/.env.local:**
```
VITE_API_URL=http://localhost:8787
VITE_TELEGRAM_BOT_USERNAME=YourBotUsername
```

Затем запустите в 3 терминалах:
```bash
# Терминал 1
cd apps/worker && pnpm dev

# Терминал 2
cd apps/bot-worker && pnpm dev

# Терминал 3
cd apps/web && pnpm dev
```

Откройте http://localhost:5173

## Полезные команды

```bash
# Просмотр логов worker
npx wrangler tail dprabota

# Выполнение SQL запросов
npx wrangler d1 execute tarbie-db --remote --command "SELECT * FROM users"

# Просмотр данных в KV
npx wrangler kv:key list --namespace-id=YOUR_KV_ID

# Просмотр очереди
npx wrangler queues list
```
