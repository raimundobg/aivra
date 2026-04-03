@echo off
echo ============================================================
echo SENCE Bot - Sistema de Sincronizacion Automatica
echo ============================================================
echo.

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no esta instalado o no esta en el PATH
    pause
    exit /b 1
)

echo Iniciando servidor de API SENCE en background...
start "SENCE API Server" /min cmd /c "cd /d %~dp0..\sence_api\api_reporteria-main\api_reporteria-main\app && python run_sence_real.py"

echo Esperando que el servidor inicie...
timeout /t 5 /nobreak >nul

echo.
echo Iniciando SENCE Bot Scheduler...
echo (El bot sincronizara el Excel cada hora)
echo.
echo Presiona Ctrl+C para detener
echo ============================================================
echo.

cd /d %~dp0
python scripts\sence_bot_scheduler.py

pause
