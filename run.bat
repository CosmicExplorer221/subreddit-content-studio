@echo off
echo ========================================
echo  Quick Start - Subreddit Content Studio
echo ========================================
echo.

REM Just run the app (assumes setup is done)
if not exist "backend\.env" (
    echo [ERROR] Setup not complete! Please run setup.bat first.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [ERROR] Dependencies not installed! Please run setup.bat first.
    pause
    exit /b 1
)

echo Starting application...
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
echo.
echo Press Ctrl+C to stop
echo.

call npm run dev

pause
