@echo off
echo ========================================
echo  Subreddit Content Studio - Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version
echo.

REM Check if .env file exists
if not exist "backend\.env" (
    echo [WARNING] Backend .env file not found!
    echo Creating .env from example file...
    copy "backend\.env.example" "backend\.env" >nul
    echo.
    echo [ACTION REQUIRED] Please edit backend\.env with your API credentials
    echo Press any key to open .env file in notepad...
    pause >nul
    notepad "backend\.env"
    echo.
    echo After saving your API keys, press any key to continue...
    pause >nul
)

REM Check if node_modules exists in root
if not exist "node_modules\" (
    echo [SETUP] Installing root dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install root dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Check if backend node_modules exists
if not exist "backend\node_modules\" (
    echo [SETUP] Installing backend dependencies...
    cd backend
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install backend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo.
)

REM Check if frontend node_modules exists
if not exist "frontend\node_modules\" (
    echo [SETUP] Installing frontend dependencies...
    cd frontend
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo.
)

REM Check if database exists
if not exist "backend\data\app.db" (
    echo [SETUP] Initializing database...
    cd backend
    call npm run init-db
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to initialize database
        pause
        exit /b 1
    )
    cd ..
    echo.
)

echo ========================================
echo  Starting Application
echo ========================================
echo.
echo Frontend will be available at: http://localhost:5173
echo Backend API will be available at: http://localhost:3001
echo.
echo Press Ctrl+C to stop the application
echo.

REM Run the application
call npm run dev

pause
