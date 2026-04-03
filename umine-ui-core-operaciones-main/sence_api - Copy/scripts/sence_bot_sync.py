"""
SENCE Bot Sync - Automatización de actualización de Tablero SENCE
Ejecuta scraping de la API SENCE y actualiza el Excel con validaciones.

Columnas que crea/actualiza:
- CONEXBOT: Resultado del scraping (0 o 1)
- DJBOT: Resultado del scraping (0 o 1)
- ConexBOTStatus: True si CONEX SENCE == CONEXBOT
- DJBOTStatus: True si DJ == DJBOT
- BOT_PROCESSED: Timestamp de cuando se procesó (evita reprocesar)

Uso:
    python scripts/sence_bot_sync.py
    python scripts/sence_bot_sync.py --dry-run  # Solo muestra cambios sin guardar
    python scripts/sence_bot_sync.py --codigo 1238044802  # Procesa solo un código
"""

import os
import sys
import requests
import pandas as pd
import argparse
from datetime import datetime
from typing import Optional, Dict, List, Tuple
import re

# Configuración
EXCEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'TABLERO SENCE 2025_api_fill.xlsx')
SHEET_NAME = 'BBDD 2025'
SENCE_API_URL = "http://localhost:8000/sence/participants"

# Columnas a eliminar (vacías o duplicadas)
COLUMNS_TO_DROP = [' ', ' .1', ' .2', ' .3', ' .4', ' .5', ' .6', ' .7', ' .8', ' .9', ' .10', ' .11']

# Columnas del Excel
# IMPORTANTE: La API SENCE usa ID SENCE (IdAccion), NO el COD SENCE
COL_ID_SENCE = 'ID SENCE'  # Este es el que usa la API (ej: 6749253)
COL_COD_SENCE = 'COD SENCE'  # Este es el código SENCE oficial (ej: 1238087803)
COL_RUT = 'RUT'
COL_NOMBRES = 'NOMBRES'
COL_APELLIDOS = 'APELLIDOS'
COL_CONEX_SENCE = 'CONEX SENCE'
COL_DJ = 'DJ'

# Nuevas columnas de validación
COL_CONEXBOT = 'CONEXBOT'
COL_DJBOT = 'DJBOT'
COL_CONEXBOT_STATUS = 'ConexBOTStatus'
COL_DJBOT_STATUS = 'DJBOTStatus'
COL_BOT_PROCESSED = 'BOT_PROCESSED'  # Timestamp de procesamiento
COL_BOT_NUM_SESIONES = 'BOT_NUM_SESIONES'
COL_BOT_ID_PROCESSED = 'BOT_ID_PROCESSED'  # ID SENCE que fue procesado (evita reprocesar)

# Columnas FLAG para actualización (valor oficial de la API)
COL_FLAG_CONEX = 'Actualizar_CONEX'  # 1 si API dice conectado pero Excel dice 0
COL_FLAG_DJ = 'Actualizar_DJ'  # 1 si API dice DJ pero Excel dice 0


def normalize_rut(rut: str) -> str:
    """Normaliza RUT: quita puntos, mantiene guión, uppercase."""
    if pd.isna(rut) or not rut:
        return ''
    rut_str = str(rut).strip().upper()
    # Quitar puntos
    rut_str = rut_str.replace('.', '')
    # Asegurar formato con guión
    if '-' not in rut_str and len(rut_str) > 1:
        rut_str = rut_str[:-1] + '-' + rut_str[-1]
    return rut_str


def normalize_name(name: str) -> str:
    """Normaliza nombre: uppercase, sin acentos extras, trim."""
    if pd.isna(name) or not name:
        return ''
    return str(name).strip().upper()


def fetch_sence_participants(cod_sence: str) -> Tuple[Optional[List[Dict]], Optional[str]]:
    """
    Llama a la API de SENCE para obtener participantes.
    Returns: (lista de participantes, error)
    """
    try:
        url = f"{SENCE_API_URL}/{cod_sence}"
        response = requests.get(url, timeout=45)
        data = response.json()

        if data.get('success'):
            return data.get('participants', []), None
        else:
            return None, data.get('error', 'Error desconocido')
    except requests.exceptions.ConnectionError:
        return None, "No se pudo conectar a la API. ¿Está corriendo el servidor en localhost:8000?"
    except Exception as e:
        return None, str(e)


def match_participant(excel_rut: str, excel_nombres: str, excel_apellidos: str,
                     api_participants: List[Dict]) -> Optional[Dict]:
    """
    Busca un participante de la API que coincida con el registro del Excel.
    Primero intenta match por RUT, luego por nombre si no encuentra.
    """
    excel_rut_norm = normalize_rut(excel_rut)
    excel_nombre_full = normalize_name(f"{excel_nombres} {excel_apellidos}".strip())

    for p in api_participants:
        api_rut = normalize_rut(p.get('rut', ''))

        # Match por RUT (prioritario)
        if excel_rut_norm and api_rut and excel_rut_norm == api_rut:
            return p

    # Si no matchea por RUT, intentar por nombre
    for p in api_participants:
        api_nombre = normalize_name(p.get('nombre_completo', ''))

        # Match parcial de nombre (al menos 80% similar)
        if excel_nombre_full and api_nombre:
            # Comparar palabras en común
            excel_words = set(excel_nombre_full.split())
            api_words = set(api_nombre.split())
            common = excel_words & api_words

            if len(common) >= 2:  # Al menos 2 palabras en común
                return p

    return None


def process_excel(dry_run: bool = False, single_codigo: Optional[str] = None,
                  force_reprocess: bool = False) -> Dict:
    """
    Procesa el Excel completo y actualiza con datos de la API.

    Args:
        dry_run: Si True, solo muestra cambios sin guardar
        single_codigo: Si se especifica, solo procesa ese código SENCE
        force_reprocess: Si True, reprocesa aunque ya esté marcado

    Returns:
        Estadísticas del procesamiento
    """
    print(f"\n{'='*60}")
    print("SENCE Bot Sync")
    print(f"{'='*60}")
    print(f"Archivo: {EXCEL_PATH}")
    print(f"Hoja: {SHEET_NAME}")
    print(f"Modo: {'DRY RUN (sin guardar)' if dry_run else 'ACTUALIZACIÓN'}")
    print(f"{'='*60}\n")

    # Leer Excel
    print("Leyendo Excel...")
    df = pd.read_excel(EXCEL_PATH, sheet_name=SHEET_NAME, header=0)
    original_len = len(df)
    print(f"Total registros: {original_len}")

    # Eliminar columnas vacías/problemáticas
    cols_to_drop = [c for c in df.columns if c in COLUMNS_TO_DROP or
                    (isinstance(c, str) and (c.startswith('Unnamed') or c.strip() == ''))]
    if cols_to_drop:
        print(f"Eliminando {len(cols_to_drop)} columnas vacias: {cols_to_drop[:5]}...")
        df = df.drop(columns=cols_to_drop, errors='ignore')

    # Asegurar que existan las columnas de validación
    for col in [COL_CONEXBOT, COL_DJBOT, COL_CONEXBOT_STATUS, COL_DJBOT_STATUS,
                COL_BOT_PROCESSED, COL_BOT_NUM_SESIONES, COL_BOT_ID_PROCESSED,
                COL_FLAG_CONEX, COL_FLAG_DJ]:
        if col not in df.columns:
            df[col] = None

    # Obtener ID SENCE únicos (la API usa ID SENCE, no COD SENCE)
    codigos_sence = df[COL_ID_SENCE].dropna().unique()
    print(f"ID SENCE únicos: {len(codigos_sence)}")

    if single_codigo:
        codigos_sence = [c for c in codigos_sence if str(c) == str(single_codigo)]
        if not codigos_sence:
            print(f"ERROR: Código {single_codigo} no encontrado en el Excel")
            return {}
        print(f"Procesando solo código: {single_codigo}")

    # Estadísticas
    stats = {
        'codigos_procesados': 0,
        'codigos_error': 0,
        'registros_actualizados': 0,
        'registros_sin_match': 0,
        'registros_ya_procesados': 0,
        'cambios_conex': 0,
        'cambios_dj': 0,
    }

    # Procesar cada ID SENCE
    for id_sence in codigos_sence:
        id_sence_str = str(int(id_sence)) if not pd.isna(id_sence) else ''
        if not id_sence_str:
            continue

        print(f"\n--- Procesando ID SENCE: {id_sence_str} ---")

        # Filtrar registros de este ID SENCE
        mask = df[COL_ID_SENCE] == id_sence
        registros = df[mask]
        print(f"Registros en Excel: {len(registros)}")

        # Verificar si ya fue procesado para ESTE ID SENCE específico
        if not force_reprocess:
            # Un registro se considera procesado si BOT_ID_PROCESSED == id_sence actual
            already_processed_mask = registros[COL_BOT_ID_PROCESSED].astype(str) == id_sence_str
            all_processed = already_processed_mask.all()
            if all_processed and len(registros) > 0:
                print(f"  → Ya procesado anteriormente para este ID SENCE, saltando (use --force para reprocesar)")
                stats['registros_ya_procesados'] += len(registros)
                continue

        # Llamar API con ID SENCE
        participants, error = fetch_sence_participants(id_sence_str)

        if error:
            print(f"  ERROR API: {error}")
            stats['codigos_error'] += 1
            continue

        print(f"Participantes API: {len(participants)}")
        stats['codigos_procesados'] += 1

        # Procesar cada registro del Excel para este código
        for idx in registros.index:
            excel_rut = df.at[idx, COL_RUT]
            excel_nombres = df.at[idx, COL_NOMBRES]
            excel_apellidos = df.at[idx, COL_APELLIDOS]

            # Buscar match en API
            match = match_participant(excel_rut, excel_nombres, excel_apellidos, participants)

            if match:
                # Obtener valores de la API
                api_conectado = 1 if match.get('conectado', False) else 0
                api_dj = 1 if match.get('declaracion_jurada', False) else 0
                api_sesiones = match.get('num_sesiones', 0)

                # Valores actuales del Excel
                excel_conex = df.at[idx, COL_CONEX_SENCE]
                excel_dj = df.at[idx, COL_DJ]

                # Normalizar valores del Excel para comparación
                excel_conex_norm = 1 if excel_conex == 1 else 0
                excel_dj_norm = 1 if excel_dj == 1 else 0

                # Actualizar columnas BOT
                df.at[idx, COL_CONEXBOT] = api_conectado
                df.at[idx, COL_DJBOT] = api_dj
                df.at[idx, COL_BOT_NUM_SESIONES] = api_sesiones
                df.at[idx, COL_BOT_PROCESSED] = datetime.now().isoformat()
                df.at[idx, COL_BOT_ID_PROCESSED] = id_sence_str  # Marcar qué ID fue procesado

                # Calcular status de validación
                df.at[idx, COL_CONEXBOT_STATUS] = (excel_conex_norm == api_conectado)
                df.at[idx, COL_DJBOT_STATUS] = (excel_dj_norm == api_dj)

                # FLAG de actualización: 1 si API dice SÍ pero Excel dice NO
                # Estos son los valores OFICIALES que deberían estar en el Excel
                flag_conex = 1 if (api_conectado == 1 and excel_conex_norm == 0) else 0
                flag_dj = 1 if (api_dj == 1 and excel_dj_norm == 0) else 0
                df.at[idx, COL_FLAG_CONEX] = flag_conex
                df.at[idx, COL_FLAG_DJ] = flag_dj

                # Contar cambios
                if excel_conex_norm != api_conectado:
                    stats['cambios_conex'] += 1
                if excel_dj_norm != api_dj:
                    stats['cambios_dj'] += 1

                stats['registros_actualizados'] += 1

                rut_display = normalize_rut(excel_rut)
                print(f"  [OK] {rut_display}: CONEX={api_conectado}, DJ={api_dj}, Sesiones={api_sesiones}")
            else:
                stats['registros_sin_match'] += 1
                rut_display = normalize_rut(excel_rut)
                print(f"  [--] {rut_display}: No encontrado en API")

    # Guardar Excel
    if not dry_run and stats['registros_actualizados'] > 0:
        print(f"\n{'='*60}")
        print("Guardando cambios...")

        # Intentar guardar en el archivo original, si falla guardar en uno nuevo
        output_path = EXCEL_PATH

        try:
            # Leer todas las hojas para preservarlas
            with pd.ExcelFile(EXCEL_PATH) as xls:
                all_sheets = {sheet: pd.read_excel(xls, sheet_name=sheet) for sheet in xls.sheet_names}

            # Actualizar solo la hoja BBDD 2025
            all_sheets[SHEET_NAME] = df

            # Guardar
            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                for sheet_name, sheet_df in all_sheets.items():
                    sheet_df.to_excel(writer, sheet_name=sheet_name, index=False)

            print(f"[OK] Archivo guardado: {output_path}")

        except PermissionError:
            # Si el archivo está abierto, guardar en uno nuevo
            output_path = EXCEL_PATH.replace('.xlsx', f'_BOT_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx')
            print(f"[WARN] Archivo original bloqueado, guardando en: {output_path}")

            with pd.ExcelFile(EXCEL_PATH) as xls:
                all_sheets = {sheet: pd.read_excel(xls, sheet_name=sheet) for sheet in xls.sheet_names}

            all_sheets[SHEET_NAME] = df

            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                for sheet_name, sheet_df in all_sheets.items():
                    sheet_df.to_excel(writer, sheet_name=sheet_name, index=False)

            print(f"[OK] Archivo guardado: {output_path}")

    # Mostrar resumen
    print(f"\n{'='*60}")
    print("RESUMEN")
    print(f"{'='*60}")
    print(f"Códigos SENCE procesados: {stats['codigos_procesados']}")
    print(f"Códigos con error: {stats['codigos_error']}")
    print(f"Registros actualizados: {stats['registros_actualizados']}")
    print(f"Registros sin match en API: {stats['registros_sin_match']}")
    print(f"Registros ya procesados (saltados): {stats['registros_ya_procesados']}")
    print(f"Discrepancias CONEX: {stats['cambios_conex']}")
    print(f"Discrepancias DJ: {stats['cambios_dj']}")
    print(f"{'='*60}\n")

    return stats


def main():
    parser = argparse.ArgumentParser(description='SENCE Bot Sync - Actualiza Tablero SENCE desde API')
    parser.add_argument('--dry-run', action='store_true', help='Solo mostrar cambios sin guardar')
    parser.add_argument('--codigo', type=str, help='Procesar solo un código SENCE específico')
    parser.add_argument('--force', action='store_true', help='Forzar reprocesamiento aunque ya esté procesado')

    args = parser.parse_args()

    # Verificar que el Excel existe
    if not os.path.exists(EXCEL_PATH):
        print(f"ERROR: No se encontró el archivo: {EXCEL_PATH}")
        sys.exit(1)

    # Ejecutar
    process_excel(
        dry_run=args.dry_run,
        single_codigo=args.codigo,
        force_reprocess=args.force
    )


if __name__ == '__main__':
    main()
