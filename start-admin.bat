@echo off
set PATH=%PATH%;C:\Program Files\nodejs
cd /d "c:\Users\User\Desktop\TransiGo V01\apps\admin"
rmdir /s /q .next 2>nul
"C:\Program Files\nodejs\npm.cmd" run dev
pause
