"""
SENCE Bot Scheduler - Ejecuta el sync cada hora automáticamente

Uso:
    python scripts/sence_bot_scheduler.py          # Inicia el scheduler
    python scripts/sence_bot_scheduler.py --once   # Ejecuta una sola vez (para testing)

Requisitos:
    - El servidor de la API debe estar corriendo en localhost:8000
    - pip install schedule
"""

import os
import sys
import time
import schedule
import subprocess
import argparse
from datetime import datetime

# Configuración
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SYNC_SCRIPT = os.path.join(SCRIPT_DIR, 'sence_bot_sync.py')
API_SERVER_SCRIPT = os.path.join(
    os.path.dirname(os.path.dirname(SCRIPT_DIR)),
    'sence_api', 'api_reporteria-main', 'api_reporteria-main', 'app', 'run_sence_real.py'
)

# Intervalo de ejecución (en horas)
INTERVAL_HOURS = 1

# Log file
LOG_FILE = os.path.join(SCRIPT_DIR, 'sence_bot_scheduler.log')


def log(message: str):
    """Escribe al log y a consola."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_line = f"[{timestamp}] {message}"
    print(log_line)
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(log_line + '\n')


def check_api_server() -> bool:
    """Verifica si el servidor de la API está corriendo."""
    import requests
    try:
        response = requests.get('http://localhost:8000/', timeout=5)
        return response.status_code == 200
    except:
        return False


def run_sync():
    """Ejecuta el script de sincronización."""
    log("=" * 60)
    log("Iniciando sincronización SENCE Bot...")

    # Verificar API
    if not check_api_server():
        log("ERROR: El servidor de la API no está corriendo en localhost:8000")
        log("Ejecuta primero: python api_reporteria-main/.../run_sence_real.py")
        return False

    try:
        # Ejecutar el script de sync
        result = subprocess.run(
            [sys.executable, SYNC_SCRIPT],
            capture_output=True,
            text=True,
            timeout=3600,  # 1 hora timeout
            cwd=os.path.dirname(SCRIPT_DIR)
        )

        # Log output
        if result.stdout:
            for line in result.stdout.split('\n'):
                if line.strip():
                    log(f"  {line}")

        if result.returncode != 0:
            log(f"ERROR: El script terminó con código {result.returncode}")
            if result.stderr:
                log(f"STDERR: {result.stderr}")
            return False

        log("Sincronización completada exitosamente")
        return True

    except subprocess.TimeoutExpired:
        log("ERROR: Timeout - la sincronización tardó más de 1 hora")
        return False
    except Exception as e:
        log(f"ERROR: {str(e)}")
        return False


def main():
    parser = argparse.ArgumentParser(description='SENCE Bot Scheduler')
    parser.add_argument('--once', action='store_true', help='Ejecutar una sola vez')
    parser.add_argument('--interval', type=int, default=INTERVAL_HOURS,
                        help=f'Intervalo en horas (default: {INTERVAL_HOURS})')

    args = parser.parse_args()

    log("=" * 60)
    log("SENCE Bot Scheduler iniciado")
    log(f"Intervalo: cada {args.interval} hora(s)")
    log(f"Log file: {LOG_FILE}")
    log("=" * 60)

    if args.once:
        # Ejecutar una sola vez
        log("Modo: ejecución única")
        run_sync()
        return

    # Programar ejecución periódica
    schedule.every(args.interval).hours.do(run_sync)

    # Ejecutar inmediatamente la primera vez
    log("Ejecutando primera sincronización...")
    run_sync()

    log(f"\nScheduler activo. Próxima ejecución en {args.interval} hora(s)")
    log("Presiona Ctrl+C para detener\n")

    # Loop principal
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check cada minuto
    except KeyboardInterrupt:
        log("\nScheduler detenido por el usuario")


if __name__ == '__main__':
    main()
