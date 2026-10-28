@echo off
echo ========================================
echo    Windsurf Platform - Quick Start
echo ========================================
echo.

echo Starting Backend Server...
cd backend
start "Windsurf Backend" cmd /k "python start_simple.py"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
cd ..\frontend
start "Windsurf Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Platform is starting up!
echo ========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo   Health:   http://localhost:5000/health
echo ========================================
echo.
echo Press any key to close this window...
pause > nul
