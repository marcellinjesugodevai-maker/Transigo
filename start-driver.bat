@echo off
echo ========================================
echo   TransiGo Driver - Demarrage Expo
echo ========================================
echo.

REM Ajouter Node.js au PATH
set PATH=C:\Program Files\nodejs;%PATH%

REM Aller dans le dossier driver
cd /d "c:\Users\User\Desktop\TransiGo V01\apps\driver"

echo Demarrage d'Expo...
echo.

REM Lancer Expo
call npx expo start

pause
