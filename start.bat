@echo off
:: This line forces the terminal to stay in the project folder
cd /d "%~dp0"

echo ==========================================
echo Starting Cynapse Enterprise Servers...
echo ==========================================

:: Start the Python AI Backend in a new terminal window
echo Starting FastAPI Backend...
start "Cynapse AI Core" cmd /k "cd backend && call .venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: Start the React Frontend in a new terminal window
echo Starting React Frontend...
start "Cynapse UI" cmd /k "npm run dev"

exit