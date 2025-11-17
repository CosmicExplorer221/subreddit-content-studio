@echo off
echo ========================================
echo  First-Time Setup
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detected:
node --version
echo.

REM Create .env from example
if not exist "backend\.env" (
    echo [1/5] Creating .env file...
    copy "backend\.env.example" "backend\.env" >nul
    echo       Created backend\.env
    echo.
    echo ========================================
    echo  IMPORTANT: Configure API Keys
    echo ========================================
    echo.
    echo Opening .env file in notepad...
    echo Please add your API credentials:
    echo   - Reddit: Client ID and Secret
    echo   - Gemini: API Key
    echo   - Notion: API Key and Database ID (optional)
    echo.
    pause
    notepad "backend\.env"
    echo.
) else (
    echo [1/5] .env file already exists
    echo.
)

REM Install root dependencies
echo [2/5] Installing root dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install root dependencies
    pause
    exit /b 1
)
echo.

REM Install backend dependencies
echo [3/5] Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..
echo.

REM Install frontend dependencies
echo [4/5] Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..
echo.

REM Initialize database
echo [5/5] Initializing database...
cd backend
call npm run init-db
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to initialize database
    pause
    exit /b 1
)
cd ..
echo.

echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo You can now run the application using:
echo   - start.bat (automatic setup + run)
echo   - run.bat (quick start)
echo.
echo Or manually with: npm run dev
echo.
pause
