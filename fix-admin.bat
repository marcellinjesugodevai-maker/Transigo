@echo off
setlocal

set "NODE_PATH=C:\Program Files\nodejs"
set "PATH=%NODE_PATH%;%PATH%"

cd /d "c:\Users\User\Desktop\TransiGo V01\apps\admin"

echo.
echo [1/2] Installation des dependances (Admin)...
echo.
if not exist node_modules (
    echo   - Installation rapide...
    call pnpm install
)

echo.
echo [2/2] Démarrage Dashboard Admin (Port 3001)...
echo.
echo ===========================================
echo   ACCES: http://localhost:3001
echo ===========================================
echo.

call pnpm dev

pause
