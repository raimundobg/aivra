"""
SENCE Bot - Google Sheets Sync
Actualiza Google Sheets en tiempo real cada 2 horas.

SETUP:
1. Ir a https://console.cloud.google.com/
2. Crear proyecto o usar existente
3. Habilitar "Google Sheets API" y "Google Drive API"
4. Crear credenciales > Cuenta de servicio
5. Descargar JSON y guardarlo como 'credentials.json' en esta carpeta
6. Compartir el Google Sheet con el email de la cuenta de servicio

Uso:
    python scripts/sence_bot_gsheets.py --sheet-id TU_SHEET_ID
    python scripts/sence_bot_gsheets.py --sheet-id TU_SHEET_ID --once
    python scripts/sence_bot_gsheets.py --sheet-id TU_SHEET_ID --interval 2
"""

import os
import sys
import time
import json
import requests
import argparse
from datetime import datetime
from typing import Optional, Dict, List, Tuple

# Google Sheets
import gspread
from google.oauth2.service_account import Credentials

# Configuración
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_FILE = os.path.join(SCRIPT_DIR, 'credentials.json')
SENCE_API_URL = "http://localhost:8000/sence/participants"
SHEET_NAME = 'BBDD 2025'

# Scopes necesarios para Google Sheets
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]

# Columnas del Google Sheet (índices basados en 1)
COLUMNS = {
    'ID_SENCE': 8,        # Columna H
    'COD_SENCE': 9,       # Columna I
    'RUT': 21,            # Columna U
    'NOMBRES': 23,        # Columna W
    'APELLIDOS': 24,      # Columna X
    'CONEX_SENCE': 26,    # Columna Z
    'DJ': 29,             # Columna AC
}

# Nuevas columnas BOT (se agregarán al final)
BOT_COLUMNS = [
    'CONEXBOT',
    'DJBOT',
    'ConexBOTStatus',
    'DJBOTStatus',
    'Actualizar_CONEX',
    'Actualizar_DJ',
    'BOT_NUM_SESIONES',
    'BOT_PROCESSED',
    'BOT_ID_PROCESSED'
]


def log(message: str):
    """Log con timestamp."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] {message}")


def normalize_rut(rut: str) -> str:
    """Normaliza RUT."""
    if not rut:
        return ''
    rut_str = str(rut).strip().upper().replace('.', '')
    if '-' not in rut_str and len(rut_str) > 1:
        rut_str = rut_str[:-1] + '-' + rut_str[-1]
    return rut_str


def get_google_sheet(sheet_id: str):
    """Conecta a Google Sheets."""
    if not os.path.exists(CREDENTIALS_FILE):
        raise FileNotFoundError(
            f"No se encontró {CREDENTIALS_FILE}\n"
            "Descarga las credenciales de Google Cloud Console y guárdalas como 'credentials.json'"
        )

    creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
    client = gspread.authorize(creds)

    try:
        spreadsheet = client.open_by_key(sheet_id)
        worksheet = spreadsheet.worksheet(SHEET_NAME)
        return worksheet
    except gspread.SpreadsheetNotFound:
        raise Exception(
            f"No se encontró el Google Sheet. Asegúrate de:\n"
            f"1. El ID '{sheet_id}' es correcto\n"
            f"2. Compartiste el sheet con la cuenta de servicio"
        )


def fetch_sence_participants(id_sence: str) -> Tuple[Optional[List[Dict]], Optional[str]]:
    """Llama a la API de SENCE."""
    try:
        response = requests.get(f"{SENCE_API_URL}/{id_sence}", timeout=45)
        data = response.json()
        if data.get('success'):
            return data.get('participants', []), None
        return None, data.get('error', 'Error desconocido')
    except requests.exceptions.ConnectionError:
        return None, "API no disponible en localhost:8000"
    except Exception as e:
        return None, str(e)


def match_participant(rut: str, api_participants: List[Dict]) -> Optional[Dict]:
    """Busca participante por RUT."""
    rut_norm = normalize_rut(rut)
    for p in api_participants:
        if normalize_rut(p.get('rut', '')) == rut_norm:
            return p
    return None


def find_or_create_bot_columns(worksheet, header_row: List) -> Dict[str, int]:
    """Encuentra o crea las columnas BOT."""
    bot_col_indices = {}
    last_col = len(header_row)

    for col_name in BOT_COLUMNS:
        if col_name in header_row:
            bot_col_indices[col_name] = header_row.index(col_name) + 1
        else:
            # Agregar nueva columna
            last_col += 1
            bot_col_indices[col_name] = last_col
            worksheet.update_cell(1, last_col, col_name)
            log(f"  Columna '{col_name}' creada en posicion {last_col}")

    return bot_col_indices


def sync_google_sheet(sheet_id: str, single_id: Optional[str] = None,
                      max_ids: int = 50) -> Dict:
    """
    Sincroniza Google Sheet con datos de SENCE API.

    Args:
        sheet_id: ID del Google Sheet
        single_id: Procesar solo este ID SENCE (opcional)
        max_ids: Máximo de IDs a procesar por ejecución
    """
    log("=" * 60)
    log("SENCE Bot - Google Sheets Sync")
    log("=" * 60)

    stats = {
        'ids_procesados': 0,
        'ids_error': 0,
        'registros_actualizados': 0,
        'registros_sin_match': 0,
        'flags_conex': 0,
        'flags_dj': 0,
    }

    # Conectar a Google Sheets
    log("Conectando a Google Sheets...")
    worksheet = get_google_sheet(sheet_id)
    log(f"Conectado a: {worksheet.title}")

    # Obtener todos los datos
    log("Descargando datos...")
    all_data = worksheet.get_all_values()
    header_row = all_data[0]
    data_rows = all_data[1:]
    log(f"Total filas: {len(data_rows)}")

    # Encontrar índices de columnas
    def find_col(name: str, alternatives: List[str] = []) -> int:
        names_to_try = [name] + alternatives
        for n in names_to_try:
            if n in header_row:
                return header_row.index(n)
        return -1

    col_id_sence = find_col('ID SENCE', ['ID_SENCE'])
    col_rut = find_col('RUT')
    col_conex = find_col('CONEX SENCE', ['CONEX_SENCE'])
    col_dj = find_col('DJ')

    if col_id_sence < 0 or col_rut < 0:
        raise Exception("No se encontraron las columnas ID SENCE o RUT")

    log(f"Columnas: ID_SENCE={col_id_sence+1}, RUT={col_rut+1}, CONEX={col_conex+1}, DJ={col_dj+1}")

    # Crear/encontrar columnas BOT
    bot_cols = find_or_create_bot_columns(worksheet, header_row)

    # Obtener IDs SENCE únicos
    id_sences = list(set([
        row[col_id_sence] for row in data_rows
        if len(row) > col_id_sence and row[col_id_sence]
    ]))

    if single_id:
        id_sences = [id for id in id_sences if str(id) == str(single_id)]

    id_sences = id_sences[:max_ids]  # Limitar para no exceder cuotas
    log(f"IDs SENCE a procesar: {len(id_sences)}")

    # Preparar batch de actualizaciones
    updates = []

    # Procesar cada ID SENCE
    for id_sence in id_sences:
        if not id_sence:
            continue

        log(f"\n--- ID SENCE: {id_sence} ---")

        # Llamar API
        participants, error = fetch_sence_participants(str(id_sence))

        if error:
            log(f"  ERROR: {error}")
            stats['ids_error'] += 1
            continue

        log(f"  Participantes API: {len(participants)}")
        stats['ids_procesados'] += 1

        # Buscar filas con este ID SENCE
        for row_idx, row in enumerate(data_rows):
            if len(row) <= col_id_sence or row[col_id_sence] != id_sence:
                continue

            excel_row = row_idx + 2  # +2 por header y índice 0
            rut = row[col_rut] if len(row) > col_rut else ''

            # Buscar en API
            match = match_participant(rut, participants)

            if match:
                api_conex = 1 if match.get('conectado', False) else 0
                api_dj = 1 if match.get('declaracion_jurada', False) else 0
                api_sesiones = match.get('num_sesiones', 0)

                # Valores actuales
                excel_conex = 1 if (len(row) > col_conex and row[col_conex] == '1') else 0
                excel_dj = 1 if (len(row) > col_dj and row[col_dj] == '1') else 0

                # Calcular flags
                flag_conex = 1 if (api_conex == 1 and excel_conex == 0) else 0
                flag_dj = 1 if (api_dj == 1 and excel_dj == 0) else 0

                if flag_conex:
                    stats['flags_conex'] += 1
                if flag_dj:
                    stats['flags_dj'] += 1

                # Preparar actualizaciones
                timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

                updates.append({'range': f"{gspread.utils.rowcol_to_a1(excel_row, bot_cols['CONEXBOT'])}", 'values': [[api_conex]]})
                updates.append({'range': f"{gspread.utils.rowcol_to_a1(excel_row, bot_cols['DJBOT'])}", 'values': [[api_dj]]})
                updates.append({'range': f"{gspread.utils.rowcol_to_a1(excel_row, bot_cols['ConexBOTStatus'])}", 'values': [[excel_conex == api_conex]]})
                updates.append({'range': f"{gspread.utils.rowcol_to_a1(excel_row, bot_cols['DJBOTStatus'])}", 'values': [[excel_dj == api_dj]]})
                updates.append({'range': f"{gspread.utils.rowcol_to_a1(excel_row, bot_cols['Actualizar_CONEX'])}", 'values': [[flag_conex]]})
                updates.append({'range': f"{gspread.utils.rowcol_to_a1(excel_row, bot_cols['Actualizar_DJ'])}", 'values': [[flag_dj]]})
                updates.append({'range': f"{gspread.utils.rowcol_to_a1(excel_row, bot_cols['BOT_NUM_SESIONES'])}", 'values': [[api_sesiones]]})
                updates.append({'range': f"{gspread.utils.rowcol_to_a1(excel_row, bot_cols['BOT_PROCESSED'])}", 'values': [[timestamp]]})
                updates.append({'range': f"{gspread.utils.rowcol_to_a1(excel_row, bot_cols['BOT_ID_PROCESSED'])}", 'values': [[id_sence]]})

                stats['registros_actualizados'] += 1
                log(f"  [OK] {normalize_rut(rut)}: CONEX={api_conex}, DJ={api_dj}")
            else:
                stats['registros_sin_match'] += 1

    # Aplicar actualizaciones en batch
    if updates:
        log(f"\nAplicando {len(updates)} actualizaciones...")
        worksheet.batch_update(updates)
        log("Actualizaciones aplicadas!")

    # Resumen
    log("\n" + "=" * 60)
    log("RESUMEN")
    log("=" * 60)
    log(f"IDs procesados: {stats['ids_procesados']}")
    log(f"IDs con error: {stats['ids_error']}")
    log(f"Registros actualizados: {stats['registros_actualizados']}")
    log(f"Registros sin match: {stats['registros_sin_match']}")
    log(f"FLAGS Actualizar_CONEX: {stats['flags_conex']}")
    log(f"FLAGS Actualizar_DJ: {stats['flags_dj']}")
    log("=" * 60)

    return stats


def run_scheduler(sheet_id: str, interval_hours: int = 2):
    """Ejecuta el sync cada N horas."""
    import schedule

    log(f"Scheduler iniciado - Intervalo: {interval_hours} horas")
    log("Presiona Ctrl+C para detener\n")

    def job():
        try:
            sync_google_sheet(sheet_id)
        except Exception as e:
            log(f"ERROR en sync: {e}")

    # Ejecutar inmediatamente
    job()

    # Programar ejecución periódica
    schedule.every(interval_hours).hours.do(job)

    while True:
        schedule.run_pending()
        time.sleep(60)


def main():
    parser = argparse.ArgumentParser(description='SENCE Bot - Google Sheets Sync')
    parser.add_argument('--sheet-id', required=True, help='ID del Google Sheet')
    parser.add_argument('--once', action='store_true', help='Ejecutar solo una vez')
    parser.add_argument('--interval', type=int, default=2, help='Intervalo en horas (default: 2)')
    parser.add_argument('--id-sence', type=str, help='Procesar solo este ID SENCE')
    parser.add_argument('--max-ids', type=int, default=50, help='Max IDs por ejecución (default: 50)')

    args = parser.parse_args()

    if args.once:
        sync_google_sheet(args.sheet_id, args.id_sence, args.max_ids)
    else:
        run_scheduler(args.sheet_id, args.interval)


if __name__ == '__main__':
    main()
