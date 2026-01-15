@echo off
echo ========================================
echo   TransiGo Passenger - Demarrage Expo
echo ========================================
echo.

REM Ajouter Node.js au PATH
set PATH=C:\Program Files\nodejs;%PATH%

REM Aller dans le dossier passenger
cd /d "c:\Users\User\Desktop\TransiGo V01\apps\passenger"

echo Demarrage d'Expo...
echo.

REM Lancer Expo
call npx expo start

pause
