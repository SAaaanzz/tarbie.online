#!/bin/bash

echo "🚀 Настройка Cloudflare ресурсов для Тәрбие Сағаты Manager"
echo ""

# D1 Database
echo "📊 Создание D1 базы данных..."
wrangler d1 create tarbie-db

echo ""
echo "⚠️  Скопируйте database_id из вывода выше и вставьте в apps/worker/wrangler.toml (строка 9)"
read -p "Нажмите Enter после обновления wrangler.toml..."

# KV Namespace для Worker
echo ""
echo "🗄️  Создание KV namespace для API Worker..."
wrangler kv namespace create TARBIE_KV

echo ""
echo "⚠️  Скопируйте id из вывода выше и вставьте в apps/worker/wrangler.toml (строка 13)"
read -p "Нажмите Enter после обновления wrangler.toml..."

# KV Namespace для Bot Worker
echo ""
echo "🗄️  Создание KV namespace для Bot Worker..."
wrangler kv namespace create TARBIE_KV

echo ""
echo "⚠️  Скопируйте id из вывода выше и вставьте в apps/bot-worker/wrangler.toml"
read -p "Нажмите Enter после обновления wrangler.toml..."

# Queue
echo ""
echo "📬 Создание Queue..."
wrangler queues create tarbie-notifications

echo ""
echo "✅ Все ресурсы созданы!"
echo ""
echo "📝 Следующие шаги:"
echo "1. Примените миграции: cd apps/worker && wrangler d1 migrations apply tarbie-db --remote"
echo "2. Настройте секреты (см. SETUP.md)"
echo "3. Задеплойте workers: wrangler deploy"
