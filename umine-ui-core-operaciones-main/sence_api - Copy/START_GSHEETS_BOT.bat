@echo off
echo ============================================================
echo SENCE Bot - Google Sheets (cada 2 horas)
echo ============================================================
echo.

if "%1"=="" (
    echo ERROR: Debes proporcionar el ID del Google Sheet
    echo.
    echo Uso: START_GSHEETS_BOT.bat SHEET_ID
    echo.
    echo El SHEET_ID esta en la URL:
    echo https://docs.google.com/spreadsheets/d/SHEET_ID/edit
    echo.
    pause
    exit /b 1
)

set SHEET_ID=%1

echo Sheet ID: %SHEET_ID%
echo.

REM Iniciar servidor API
echo Iniciando servidor API SENCE...
start "SENCE API" /min cmd /c "cd /d %~dp0..\sence_api\api_reporteria-main\api_reporteria-main\app && python run_sence_real.py"

timeout /t 5 /nobreak >nul

echo Iniciando SENCE Bot para Google Sheets...
echo Intervalo: cada 2 horas
echo.
echo Presiona Ctrl+C para detener
echo ============================================================

cd /d %~dp0scripts
python sence_bot_gsheets.py --sheet-id %SHEET_ID% --interval 2

pause
