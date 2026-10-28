@echo off
set PATH=C:\neha\nodejs\node-v20.18.0-win-x64;%PATH%
cd /d "%~dp0"
echo ========================================================
echo   THE UNRELIABLE ART CRITIC
echo   Starting local development server...
echo ========================================================
start http://127.0.0.1:5173
npm run dev -- --host 127.0.0.1 --port 5173
pause
