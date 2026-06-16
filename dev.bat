@echo off
cd /d "%~dp0"
"C:\Program Files\nodejs\node.exe" node_modules\nodemon\bin\nodemon.js server.js
