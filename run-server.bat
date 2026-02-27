@echo off
REM Start a local web server for the AI Face Emotion Detector
REM This ensures the app works properly

echo.
echo ===========================================
echo   AI Face Emotion Detector - Local Server
echo ===========================================
echo.

cd frontend

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting server with Python...
    echo.
    echo OPEN YOUR BROWSER: http://localhost:8000
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    python -m http.server 8000
) else (
    REM Check if Node.js http-server is available
    npx http-server --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo Starting server with Node.js...
        echo.
        echo OPEN YOUR BROWSER: http://localhost:8000
        echo.
        echo Press Ctrl+C to stop the server
        echo.
        http-server -p 8000
    ) else (
        echo.
        echo ERROR: Neither Python nor Node.js http-server found!
        echo.
        echo SOLUTION 1: Use Python
        echo   - Python should be installed (comes with Windows)
        echo   - Make sure it's in PATH: python --version
        echo.
        echo SOLUTION 2: Use Node.js
        echo   - Install Node.js from https://nodejs.org
        echo   - Then run: npm install -g http-server
        echo.
        echo MANUAL SOLUTION: Open index.html directly
        echo   - Double-click: frontend\index.html
        echo   - Or drag index.html into browser
        echo.
        pause
    )
)
