@echo off
echo ===================================================
echo      SmartSignal AI - Starting Full System
echo ===================================================
echo.

echo [1/4] Starting AI Model Service (Port 8001)...
start "SmartSignal - AI Model (8001)" cmd /k "cd /d D:\internalhackthon\ai-model && (if exist venv\Scripts\activate.bat call venv\Scripts\activate.bat) && python -m uvicorn app.main:app --port 8001 --reload"

timeout /t 3 /nobreak >nul

echo [2/4] Starting Backend API ^& Simulation Engine (Port 8000)...
start "SmartSignal - Backend (8000)" cmd /k "cd /d D:\internalhackthon\backend && (if exist venv\Scripts\activate.bat call venv\Scripts\activate.bat) && python -m uvicorn app.main:app --port 8000 --reload"

timeout /t 4 /nobreak >nul

echo [3/4] Starting Admin Controller Dashboard (Port 5173)...
start "SmartSignal - Admin Dashboard (5173)" cmd /k "cd /d D:\internalhackthon\admin && npm run dev"

timeout /t 2 /nobreak >nul

echo [4/4] Starting Emergency Vehicle Driver App (Port 5174)...
start "SmartSignal - Emergency Vehicle App (5174)" cmd /k "cd /d D:\internalhackthon\emgvechile && npm run dev -- --port 5174"

echo.
echo ===================================================
echo   All 4 services launched successfully!
echo ===================================================
echo.
echo   - Admin Controller Dashboard:  http://localhost:5173
echo   - Emergency Driver PWA:        http://localhost:5174
echo   - Backend API Docs (Swagger):  http://localhost:8000/docs
echo   - AI Model Service:            http://localhost:8001
echo.
echo   Demo Credentials:
echo     Admin:    admin@demo.com    / Admin@123
echo     Operator: operator@demo.com / Operator@123
echo     Driver:   ambulance@demo.com / Driver@123
echo.
pause
