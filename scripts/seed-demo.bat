@echo off
echo Seeding SmartSignal AI Demo Data
echo =================================
cd /d D:\internalhackthon\backend
call venv\Scripts\activate.bat
python seed.py
echo Done. Demo data seeded.
pause
