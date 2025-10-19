@echo off
setlocal
REM Run from this folder:
cd /d "%~dp0"

REM Open the browser (optional — comment this line out if you don't want it)
start "" "http://127.0.0.1:3000/"

REM Start Vite on 127.0.0.1:3000 using the CMD shim (bypasses PS execution policy)
npm.cmd run dev -- --host 127.0.0.1 --port 3000

REM Keep the window open after you stop the server (Ctrl+C)
echo.
echo Dev server stopped. Press any key to close...
pause >nul
