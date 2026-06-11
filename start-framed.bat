@echo off
REM Launches the framed web app in dev mode and opens it in the default browser.
cd /d "%~dp0web"
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)
start "framed dev server" cmd /k "npm run dev"
echo Waiting for dev server to boot...
timeout /t 6 /nobreak >nul
start "" http://localhost:3000/
exit
