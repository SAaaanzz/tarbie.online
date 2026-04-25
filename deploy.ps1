Write-Host "=== Deploy Tarbie Sagaty ===" -ForegroundColor Cyan

# 1. Build shared
Write-Host "`n[1/4] Building shared..." -ForegroundColor Yellow
pnpm --filter @tarbie/shared build
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED" -ForegroundColor Red; exit 1 }

# 2. Build frontend
Write-Host "`n[2/4] Building frontend..." -ForegroundColor Yellow
pnpm --filter @tarbie/web build
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED" -ForegroundColor Red; exit 1 }

# 3. Deploy worker (backend)
Write-Host "`n[3/4] Deploying API worker..." -ForegroundColor Yellow
Push-Location apps/worker
npx wrangler deploy
Pop-Location
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED" -ForegroundColor Red; exit 1 }

# 4. Deploy frontend
Write-Host "`n[4/4] Deploying frontend..." -ForegroundColor Yellow
Push-Location apps/web
npx wrangler pages deploy dist --project-name=tarbie-sagaty --commit-dirty=true --branch=main
Pop-Location

Write-Host "`n=== Done! ===" -ForegroundColor Green
