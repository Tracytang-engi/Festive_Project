@echo off
REM Free port 3000 (kill process listening on it) then start the server.
echo Checking port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Killing process %%a listening on port 3000...
    taskkill /PID %%a /F 2>nul
)
timeout /t 1 /nobreak >nul
echo Starting server on port 3000...
cd /d "%~dp0"
npm run dev
