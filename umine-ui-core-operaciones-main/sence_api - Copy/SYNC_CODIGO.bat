@echo off
echo ============================================================
echo SENCE Bot - Sincronizar Codigo Especifico
echo ============================================================
echo.

if "%1"=="" (
    set /p CODIGO="Ingresa el ID SENCE a sincronizar: "
) else (
    set CODIGO=%1
)

echo.
echo Sincronizando ID SENCE: %CODIGO%
echo.

cd /d %~dp0
python scripts\sence_bot_sync.py --codigo %CODIGO%

echo.
pause
