Write-Host "===================================================" -ForegroundColor Green
Write-Host "     SmartSignal AI - Starting Full System" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""

# 1. AI Model Service (port 8001)
Write-Host "[1/4] Starting AI Model Service (Port 8001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\internalhackthon\ai-model'; if (Test-Path 'venv\Scripts\Activate.ps1') { .\venv\Scripts\Activate.ps1 }; python -m uvicorn app.main:app --port 8001 --reload"

Start-Sleep -Seconds 3

# 2. Backend & Simulation Engine (port 8000)
Write-Host "[2/4] Starting Backend API & Simulation Engine (Port 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\internalhackthon\backend'; if (Test-Path 'venv\Scripts\Activate.ps1') { .\venv\Scripts\Activate.ps1 }; python -m uvicorn app.main:app --port 8000 --reload"

Start-Sleep -Seconds 4

# 3. Admin Controller Dashboard (port 5173)
Write-Host "[3/4] Starting Admin Controller Dashboard (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\internalhackthon\admin'; npm run dev"

Start-Sleep -Seconds 2

# 4. Emergency Vehicle Driver App (port 5174)
Write-Host "[4/4] Starting Emergency Vehicle Driver App (Port 5174)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\internalhackthon\emgvechile'; npm run dev -- --port 5174"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  All 4 services launched in separate windows!" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  - Admin Controller Dashboard:  http://localhost:5173" -ForegroundColor Yellow
Write-Host "  - Emergency Driver PWA:        http://localhost:5174" -ForegroundColor Yellow
Write-Host "  - Backend API Docs (Swagger):  http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "  - AI Model Service:            http://localhost:8001" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Demo Credentials:" -ForegroundColor White
Write-Host "    Admin:    admin@demo.com    / Admin@123" -ForegroundColor White
Write-Host "    Operator: operator@demo.com / Operator@123" -ForegroundColor White
Write-Host "    Driver:   ambulance@demo.com / Driver@123" -ForegroundColor White
Write-Host ""
