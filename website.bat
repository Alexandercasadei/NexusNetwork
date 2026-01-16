@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

title Nexus Network - Server Manager
color 0b

REM === LOGGING SETUP ===
if not exist "logs" mkdir "logs"
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set "datestamp=%%c%%a%%b")
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set "timestamp=%%a%%b")
set "LOG_FILE=logs\server_%datestamp%_%timestamp%.log"

REM === CONFIGURATION ===
set "DOMAIN=nexus-network.it"
set "PORT=3000"
set "HTTPS_PORT=3001"
set "FORCE_COLOR=1"
set "HOSTS_FILE=%SystemRoot%\System32\drivers\etc\hosts"

cls
echo ===================================================
echo    NEXUS NETWORK - SERVER MANAGER
echo ===================================================
echo.
echo  [1] Development Mode (Live Reload + CSS Watch)
echo  [2] Production Preview (Build CSS + GitHub Pages Sim)
echo.
set /p "MODE=Select Mode (1/2): "

if "%MODE%"=="2" (
    set "NODE_ENV=production"
    title Nexus Network - Production Preview
) else (
    set "NODE_ENV=development"
    title Nexus Network - Dev Server
)

echo.
echo [*] Starting system checks...
echo [*] Timestamp: %date% %time% >> "%LOG_FILE%"

REM === CHECK NODE.JS ===
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not installed. Visit: https://nodejs.org
    echo [ERROR] Node.js not found >> "%LOG_FILE%"
    timeout /t 3 /nobreak
    exit /b 1
)

REM === CHECK NPM ===
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found
    timeout /t 3 /nobreak
    exit /b 1
)

echo.
echo [*] Checking dependencies...

REM === BROWSER-SYNC ===
where browser-sync >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] browser-sync missing. Installing...
    npm install -g browser-sync
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install browser-sync
        timeout /t 3 /nobreak
        exit /b 1
    )
)

REM === LOCAL MODULES ===
if not exist "node_modules" (
    echo [!] Installing local modules...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] npm install failed
        timeout /t 3 /nobreak
        exit /b 1
    )
)

REM === CSS BUILD/WATCH ===
if "%NODE_ENV%"=="production" (
    echo.
    echo [*] Building Production CSS...
    if exist "css\output.css" del "css\output.css"
    call npm run build:css
    if !errorlevel! neq 0 (
        echo [ERROR] CSS Build failed!
        echo [ERROR] CSS Build failed >> "%LOG_FILE%"
        pause
        exit /b 1
    )
    echo [OK] CSS Built successfully.
) else (
    echo.
    echo [*] Starting Tailwind Watcher...
    start "Tailwind Watcher" /min npm run watch:css
)

REM === HOSTS FILE SETUP ===
echo.
echo [*] Configuring hosts file for %DOMAIN%...
findstr /i "127.0.0.1 %DOMAIN%" "%HOSTS_FILE%" >nul
if %errorlevel% neq 0 (
    echo [!] Adding %DOMAIN% to hosts file...
    echo [*] You may be prompted for administrator privileges
    powershell -NoProfile -Command "Add-Content -Path '%HOSTS_FILE%' -Value '`n127.0.0.1 %DOMAIN%' -Encoding ASCII" >nul 2>&1
    if !errorlevel! neq 0 (
        echo [!] WARNING: Could not update hosts file - trying alternative method
        echo. >> "%HOSTS_FILE%"
        echo 127.0.0.1 %DOMAIN% >> "%HOSTS_FILE%"
    )
    echo [OK] Hosts file updated
) else (
    echo [OK] %DOMAIN% already in hosts file
)

REM === PORT CHECK ===
echo.
echo [*] Checking port %PORT%...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":%PORT%"') do set "PROCESS_ID=%%a"
if defined PROCESS_ID (
    echo [!] Port %PORT% in use (PID: %PROCESS_ID%)
    echo [*] Attempting to use port 3001 instead
    set "PORT=3001"
)

REM === STARTUP ===
echo.
echo ===================================================
echo    LAUNCHING NEXUS NETWORK SERVER
echo ===================================================
echo.
echo [+] Environment: %NODE_ENV%
echo [+] Domain: http://%DOMAIN%:%PORT%
echo [+] Logs: %LOG_FILE%
echo [+] Press Ctrl+C to stop
echo.
echo Starting server... >> "%LOG_FILE%"

REM === START SERVER ===
if "%NODE_ENV%"=="production" (
    echo [*] Starting browser-sync in Production Mode...
    REM Force GitHub Pages emulation for production preview
    call npx browser-sync start --server --files "**/*.{html,css,js}" --extensions "html" --port %PORT% --host %DOMAIN% --no-notify 2>> "%LOG_FILE%"
) else (
    if exist "bs-config.js" (
        echo [*] Starting browser-sync with custom config...
        call npx browser-sync start --config bs-config.js --port %PORT% --host %DOMAIN% --no-notify 2>> "%LOG_FILE%"
    ) else (
        echo [*] Starting browser-sync with default config...
        call npx browser-sync start --server --files "**/*.{html,css,js}" --extensions "html" --port %PORT% --host %DOMAIN% --no-notify 2>> "%LOG_FILE%"
    )
)

REM === SERVER MAINTENANCE LOOP ===
:server_loop
timeout /t 5 /nobreak >nul
tasklist /FI "IMAGENAME eq node.exe" 2>nul | findstr /I "node.exe" >nul
if %errorlevel% equ 0 (
    goto server_loop
) else (
    echo [*] Server process ended >> "%LOG_FILE%"
    goto shutdown
)

REM === SHUTDOWN ===
:shutdown
echo.
echo [*] Shutdown signal received >> "%LOG_FILE%"
taskkill /F /IM node.exe 2>nul
taskkill /F /IM browser-sync.exe 2>nul
echo [OK] Server stopped - Logs: %LOG_FILE%
echo.
pause
endlocal
exit /b 0
