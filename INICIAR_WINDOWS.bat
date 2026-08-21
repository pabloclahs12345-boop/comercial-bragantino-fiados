@echo off
title Comercial Bragantino - Controle de Fiados V2
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo.
 echo Node.js nao foi encontrado.
 echo Instale o Node.js e tente novamente.
 pause
 exit /b 1
)
echo Iniciando...
start "" "http://localhost:3090"
node server.js
pause
