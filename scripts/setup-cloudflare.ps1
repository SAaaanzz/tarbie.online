Write-Host "Setting up Cloudflare resources for Tarbie Sagaty Manager" -ForegroundColor Cyan
Write-Host ""

# D1 Database
Write-Host "Creating D1 database..." -ForegroundColor Yellow
npx wrangler d1 create tarbie-db

Write-Host ""
Write-Host "Copy database_id from output above and paste into apps/worker/wrangler.toml (line 9)" -ForegroundColor Red
Read-Host "Press Enter after updating wrangler.toml"

# KV Namespace for Worker
Write-Host ""
Write-Host "Creating KV namespace for API Worker..." -ForegroundColor Yellow
npx wrangler kv namespace create TARBIE_KV

Write-Host ""
Write-Host "Copy id from output above and paste into apps/worker/wrangler.toml (line 13)" -ForegroundColor Red
Read-Host "Press Enter after updating wrangler.toml"

# KV Namespace for Bot Worker
Write-Host ""
Write-Host "Creating KV namespace for Bot Worker..." -ForegroundColor Yellow
npx wrangler kv namespace create TARBIE_KV

Write-Host ""
Write-Host "Copy id from output above and paste into apps/bot-worker/wrangler.toml" -ForegroundColor Red
Read-Host "Press Enter after updating wrangler.toml"

# Queue
Write-Host ""
Write-Host "Creating Queue..." -ForegroundColor Yellow
npx wrangler queues create tarbie-notifications

Write-Host ""
Write-Host "All resources created!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Apply migrations: cd apps/worker && npx wrangler d1 migrations apply tarbie-db --remote"
Write-Host "2. Setup secrets (see SETUP.md)"
Write-Host "3. Deploy workers: npx wrangler deploy"
