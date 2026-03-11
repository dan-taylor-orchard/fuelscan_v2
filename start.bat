@echo off
setlocal enabledelayedexpansion
title FuelScan NSW

cd /d "%~dp0"

echo.
echo   FuelScan NSW - Fuel Price Checker
echo   ===================================
echo.

:: ── Check Node.js ─────────────────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo   ERROR: Node.js is not installed.
  echo.
  echo   Please install it from: https://nodejs.org
  echo   Download the LTS version, install it, then run this file again.
  echo.
  start https://nodejs.org
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo   OK: Node.js %NODE_VER% found

:: ── Check package.json exists (make sure they're in the right folder) ──────
if not exist "package.json" (
  echo.
  echo   ERROR: Cannot find package.json in this folder.
  echo   Current folder: %CD%
  echo.
  echo   Make sure you are running start.bat from INSIDE the fuelscan folder
  echo   i.e. the same folder that contains package.json
  echo.
  pause
  exit /b 1
)

echo   OK: Found package.json

:: ── Always reinstall if next.cmd is missing ────────────────────────────────
if not exist "node_modules\.bin\next.cmd" (
  echo.
  echo   Installing dependencies - please wait, this takes 1-2 minutes...
  echo.
  call npm install
  if %errorlevel% neq 0 (
    echo.
    echo   ERROR: npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
  echo.
  echo   OK: Dependencies installed successfully
)

echo   OK: node_modules ready

:: ── Kill anything on port 3000 ─────────────────────────────────────────────
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
  echo   Stopping previous instance on port 3000...
  taskkill /PID %%a /F >nul 2>&1
)

:: ── Start server in a new visible window ──────────────────────────────────
echo.
echo   Starting FuelScan server...
echo   A second window will open - keep it running while you use the app.
echo.

start "FuelScan Server" cmd /k "node_modules\.bin\next.cmd dev --port 3000"

:: ── Wait for server to be ready ────────────────────────────────────────────
echo   Waiting for server (first start takes ~30 seconds to compile)...
echo.

set /a attempts=0
:waitloop
timeout /t 2 /nobreak >nul
set /a attempts+=1
echo   Still waiting... (%attempts%/30)

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 goto :ready

if %attempts% lss 30 goto :waitloop

echo   Taking longer than usual - opening browser anyway...
goto :open

:ready
echo.
echo   ====================================
echo    FuelScan is ready!
echo    Opening http://localhost:3000 ...
echo   ====================================
echo.

:open
start http://localhost:3000

echo.
echo   TIP: Keep the "FuelScan Server" window open while using the app.
echo        Close it when you are done.
echo.
pause
