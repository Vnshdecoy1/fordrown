@echo off
cd /d "%~dp0"

echo === Crypto.com Automation Launcher ===
echo.

REM 1. Kill any leftover processes
echo [1/5] Cleaning up old processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im chrome.exe >nul 2>&1
timeout /t 3 /nobreak >nul

REM 2. Clean Chrome lock files
del /f /q "browser-profile\SingletonLock" >nul 2>&1
del /f /q "browser-profile\SingletonCookie" >nul 2>&1  
del /f /q "browser-profile\SingletonSocket" >nul 2>&1

REM 3. Reset state
echo {"step":"login"}> "clone-site\data\step.json"
echo.> "clone-site\data\submissions.jsonl"
del /f /q "passkey-vault\auto-passkey.done" >nul 2>&1
del /f /q "passkey-vault\auto-withdraw.done" >nul 2>&1

REM 4. Start dev server
echo [2/5] Starting dev server...
start "DevServer" cmd /c "cd /d %~dp0clone-site && npm run dev"

echo Waiting for dev server...
:wait_dev
timeout /t 3 /nobreak >nul
powershell -Command "try { $r = Invoke-RestMethod -Uri 'http://localhost:3000/api/step' -TimeoutSec 2; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 goto wait_dev
echo Dev server ready.

REM 5. Start python login automation
echo [3/5] Starting Python login automation...
start "PythonLogin" cmd /c "cd /d %~dp0 && python login_automation.py --auto --keep-open"

REM Wait for Chrome CDP
echo Waiting for Chrome...
:wait_chrome
timeout /t 2 /nobreak >nul
powershell -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:9222/json' -TimeoutSec 2; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 goto wait_chrome
echo Chrome ready.

REM 6. Start auto-passkey.js (handles passkey creation + auto withdraw)
echo [4/5] Starting auto-passkey.js...
start "PasskeyCreator" cmd /c "cd /d %~dp0passkey-vault && node auto-passkey.js"

echo [5/5] All processes running!
echo.
echo === Open http://localhost:3000/login to begin ===
echo.
pause
