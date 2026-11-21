@echo off
echo SmartSignal AI - Setup Script
echo ==============================
echo.

echo [1/5] Setting up AI Model Service...
cd /d D:\internalhackthon\ai-model
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
deactivate

echo [2/5] Setting up Backend...
cd /d D:\internalhackthon\backend
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
python seed.py
deactivate

echo [3/5] Setting up Admin Dashboard...
cd /d D:\internalhackthon\admin
npm install

echo [4/5] Setting up Emergency Vehicle App...
cd /d D:\internalhackthon\emgvechile
npm install

echo [5/5] Training AI Model...
cd /d D:\internalhackthon\ai-model
call venv\Scripts\activate.bat
python -c "from predictor.trainer import train_model; train_model()"
deactivate

echo.
echo Setup complete! Run scripts\start-all.bat to start all services.
pause
