@echo off
echo ===================================================
echo 🌿 Starting KAIROS (AI-Powered Agriculture Platform)
echo ===================================================
echo.

echo [1/2] Starting Flask Backend...
start "KAIROS Backend" cmd /k "cd /d %~dp0KAIROS\backend && venv\Scripts\activate && pip install -r requirements.txt && python run.py"

echo [2/2] Starting React Frontend...
start "KAIROS Frontend" cmd /k "cd /d %~dp0KAIROSfrontend && npm install && npm run dev"

echo.
echo ✅ Both services are starting in separate windows!
echo 🌐 The frontend window will display your local URL (e.g., http://localhost:5173).
echo.
pause
