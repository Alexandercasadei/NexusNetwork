@echo off
title Nexus Network - Local Server
color 0b
echo ==============================================
echo   AVVIO SERVER LOCALE (NEXUS NETWORK)
echo ==============================================
echo.
echo Sto avviando un server web locale per testare il sito.
echo Se ti chiede di installare 'serve', scrivi 'y' e premi invio.
@echo off
echo Avvio del server di sviluppo con Live Reload...
echo Il browser si aprira' automaticamente.
echo Premi Ctrl+C per fermare il server.
call npx browser-sync start --config bs-config.js
if %errorlevel% neq 0 (
    echo.
    echo Si e' verificato un errore. Assicurati di avere Node.js installato.
    pause
)
