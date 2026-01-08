@echo off
setlocal
echo ========================================
echo   LANCEMENT AVEC IP FORCEE (192.168.1.64)
echo ========================================
echo.

set "NODE_PATH=C:\Program Files\nodejs"
set "PATH=%NODE_PATH%;%PATH%"

cd /d "c:\Users\User\Desktop\TransiGo V01\apps\driver"

REM Force l'IP detectee
set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.64
set EXPO_DEVTOOLS_LISTEN_ADDRESS=192.168.1.64

echo [1/2] Verification des dependances...
if not exist node_modules (
    cd ..\..
    call pnpm install
    cd apps\driver
)

echo.
echo [2/2] Démarrage...
echo.
echo ===========================================
echo   SCANNEZ LE QR CODE AVEC EXPO GO
echo   IP: 192.168.1.64
echo ===========================================
echo.

REM On force l'IP avec la variable d'environnement ET --host lan
call pnpm exec expo start -c --host lan

pause
