@echo off
echo ==========================================
echo   Festive Interactive Web App - Launcher
echo ==========================================
echo.
echo Starting Backend Server (with mock login code)...
start "Festive Backend" cmd /k "cd server && set NODE_ENV=development && npm install && npm run mock-code && npm run dev"
echo Backend starting and mock code set. Waiting 5 seconds...
timeout /t 5

echo.
echo Starting Frontend Client...
start "Festive Frontend" cmd /k "cd client && npm run dev"
echo.
echo ==========================================
echo   App Started!
echo   Front-end: http://localhost:5173
echo   Back-end : http://localhost:3000
echo ==========================================
pause
