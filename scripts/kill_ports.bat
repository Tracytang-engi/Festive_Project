@echo off
echo ==========================================
echo   清理占用端口的进程
echo ==========================================
echo.

echo 查找占用 3000 和 3001 端口的进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    echo 终止 PID %%a (端口 3000)
    taskkill /F /PID %%a 2>nul
)

echo.
echo 查找占用 3001 端口的进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 " ^| findstr "LISTENING"') do (
    echo 终止 PID %%a (端口 3001)
    taskkill /F /PID %%a 2>nul
)

echo.
echo 查找占用 5173 端口的进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo 终止 PID %%a (端口 5173)
    taskkill /F /PID %%a 2>nul
)

echo.
echo 完成！
pause
