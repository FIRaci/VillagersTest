@echo off
title Villagers Digital Host
echo =============================================================
echo   🏰 KHOI DONG HE THONG GAME VILLAGERS DIGITAL (GLEAM HOST)
echo =============================================================
echo.

:: Tu dong giai phong port 3000 neu dang bi chiem dung
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :3000 ^| findstr LISTENING') do (
    echo [+] Dang dong tien trinh cu tren port 3000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

cd /d "%~dp0\server"
node src\server.mjs
pause
