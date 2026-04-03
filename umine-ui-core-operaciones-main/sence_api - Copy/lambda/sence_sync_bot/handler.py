"""
SENCE Sync Bot - AWS Lambda (100% AWS, sin Google)
Llama a la API SENCE existente y guarda en DynamoDB + S3.

Lambda existente: operaciones-core-internal-extract-data-user-sence
Trigger: EventBridge cada 2 horas

Variables de entorno:
- SENCE_API_FUNCTION: nombre de la Lambda de SENCE
- S3_BUCKET: bucket para datos y CSV exportable
- DYNAMODB_TABLE: tabla para resultados
"""

import os
import json
import csv
import io
import boto3
from datetime import datetime
from typing import Optional, Dict, List, Tuple

# AWS Clients
lambda_client = boto3.client('lambda')
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Configuración
SENCE_API_FUNCTION = os.environ.get('SENCE_API_FUNCTION', 'operaciones-core-internal-extract-data-user-sence')
S3_BUCKET = os.environ.get('S3_BUCKET', '')
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', 'sence-sync-results')


def normalize_rut(rut: str) -> str:
    """Normaliza RUT."""
    if not rut:
        return ''
    rut_str = str(rut).strip().upper().replace('.', '')
    if '-' not in rut_str and len(rut_str) > 1:
        rut_str = rut_str[:-1] + '-' + rut_str[-1]
    return rut_str


def call_sence_api(id_sence: str) -> Tuple[Optional[List[Dict]], Optional[str]]:
    """
    Llama a la Lambda de SENCE existente.
    """
    try:
        payload = {
            "pathParameters": {
                "sence_code": str(id_sence)
            }
        }

        response = lambda_client.invoke(
            FunctionName=SENCE_API_FUNCTION,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )

        response_payload = json.loads(response['Payload'].read().decode('utf-8'))

        # Parsear respuesta según estructura de tu Lambda
        if isinstance(response_payload, dict):
            body = response_payload.get('body')
            if isinstance(body, str):
                body = json.loads(body)

            if body and body.get('success'):
                return body.get('participants', []), None
            else:
                return None, body.get('error', 'Error desconocido') if body else 'Sin respuesta'

        return None, 'Respuesta inválida'

    except Exception as e:
        return None, str(e)


def save_to_dynamodb(results: List[Dict]):
    """Guarda resultados en DynamoDB."""
    try:
        table = dynamodb.Table(DYNAMODB_TABLE)
        timestamp = datetime.utcnow().isoformat()

        with table.batch_writer() as batch:
            for r in results:
                batch.put_item(Item={
                    'pk': f"SENCE#{r['id_sence']}",
                    'sk': f"RUT#{r['rut']}",
                    'conexbot': r['conexbot'],
                    'djbot': r['djbot'],
                    'num_sesiones': r['num_sesiones'],
                    'actualizar_conex': r['actualizar_conex'],
                    'actualizar_dj': r['actualizar_dj'],
                    'updated_at': timestamp
                })
        return True
    except Exception as e:
        print(f"Error guardando en DynamoDB: {e}")
        return False


def save_to_s3(results: List[Dict], id_sence: str):
    """Guarda resultados en S3 como JSON."""
    if not S3_BUCKET:
        return False

    try:
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        key = f"sence-sync/{id_sence}/{timestamp}.json"

        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=json.dumps(results, ensure_ascii=False, indent=2),
            ContentType='application/json'
        )
        return True
    except Exception as e:
        print(f"Error guardando en S3: {e}")
        return False


def export_csv_to_s3(results: List[Dict]) -> Optional[str]:
    """
    Exporta resultados a CSV en S3.
    Este CSV se puede importar a Google Sheets manualmente.
    """
    if not S3_BUCKET or not results:
        return None

    try:
        # Crear CSV en memoria
        output = io.StringIO()
        fieldnames = ['id_sence', 'rut', 'nombre', 'conexbot', 'djbot',
                      'num_sesiones', 'actualizar_conex', 'actualizar_dj', 'updated_at']
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        timestamp = datetime.utcnow().isoformat()
        for r in results:
            writer.writerow({
                'id_sence': r['id_sence'],
                'rut': r['rut'],
                'nombre': r['nombre'],
                'conexbot': r['conexbot'],
                'djbot': r['djbot'],
                'num_sesiones': r['num_sesiones'],
                'actualizar_conex': r['actualizar_conex'],
                'actualizar_dj': r['actualizar_dj'],
                'updated_at': timestamp
            })

        # Subir a S3
        csv_key = f"exports/sence_sync_latest.csv"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=csv_key,
            Body=output.getvalue().encode('utf-8'),
            ContentType='text/csv'
        )

        # También guardar con timestamp
        timestamp_key = f"exports/sence_sync_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=timestamp_key,
            Body=output.getvalue().encode('utf-8'),
            ContentType='text/csv'
        )

        # Generar URL pre-firmada (válida por 7 días)
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET, 'Key': csv_key},
            ExpiresIn=604800  # 7 días
        )

        print(f"CSV exportado: s3://{S3_BUCKET}/{csv_key}")
        return url

    except Exception as e:
        print(f"Error exportando CSV: {e}")
        return None


def process_id_sence(id_sence: str, excel_data: List[Dict] = None) -> Dict:
    """
    Procesa un ID SENCE: llama API y compara con datos existentes.
    """
    print(f"Procesando ID SENCE: {id_sence}")

    # Llamar API SENCE
    participants, error = call_sence_api(id_sence)

    if error:
        print(f"  Error API: {error}")
        return {'success': False, 'error': error, 'id_sence': id_sence}

    print(f"  Participantes: {len(participants)}")

    # Procesar resultados
    results = []
    for p in participants:
        api_conex = 1 if p.get('conectado', False) else 0
        api_dj = 1 if p.get('declaracion_jurada', False) else 0

        # Buscar en datos de Excel si están disponibles
        excel_conex = 0
        excel_dj = 0
        if excel_data:
            rut_norm = normalize_rut(p.get('rut', ''))
            for row in excel_data:
                if normalize_rut(row.get('rut', '')) == rut_norm:
                    excel_conex = int(row.get('conex_sence', 0) or 0)
                    excel_dj = int(row.get('dj', 0) or 0)
                    break

        results.append({
            'id_sence': id_sence,
            'rut': p.get('rut', ''),
            'nombre': p.get('nombre_completo', ''),
            'conexbot': api_conex,
            'djbot': api_dj,
            'num_sesiones': p.get('num_sesiones', 0),
            'excel_conex': excel_conex,
            'excel_dj': excel_dj,
            'actualizar_conex': 1 if (api_conex == 1 and excel_conex == 0) else 0,
            'actualizar_dj': 1 if (api_dj == 1 and excel_dj == 0) else 0,
        })

    return {
        'success': True,
        'id_sence': id_sence,
        'total': len(results),
        'results': results
    }


def handler(event, context):
    """
    Lambda handler principal.

    Event puede contener:
    - id_sence: procesar solo este ID
    - id_sences: lista de IDs a procesar
    - source: 'eventbridge' para ejecución programada
    """
    print(f"Event: {json.dumps(event)}")

    start_time = datetime.utcnow()

    # Determinar IDs a procesar
    id_sences = []

    if 'id_sence' in event:
        id_sences = [event['id_sence']]
    elif 'id_sences' in event:
        id_sences = event['id_sences']
    elif event.get('source') == 'aws.events':
        # EventBridge trigger - obtener IDs de DynamoDB o configuración
        # Por ahora usamos algunos IDs de ejemplo
        id_sences = event.get('detail', {}).get('id_sences', [])

    if not id_sences:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'No se especificaron IDs SENCE a procesar'})
        }

    # Procesar cada ID
    all_results = []
    stats = {
        'processed': 0,
        'errors': 0,
        'total_participants': 0,
        'flags_conex': 0,
        'flags_dj': 0
    }

    for id_sence in id_sences:
        result = process_id_sence(str(id_sence))

        if result['success']:
            stats['processed'] += 1
            stats['total_participants'] += result['total']

            for r in result['results']:
                if r['actualizar_conex']:
                    stats['flags_conex'] += 1
                if r['actualizar_dj']:
                    stats['flags_dj'] += 1

            all_results.extend(result['results'])

            # Guardar en S3
            save_to_s3(result['results'], str(id_sence))
        else:
            stats['errors'] += 1

    # Guardar en DynamoDB
    if all_results:
        save_to_dynamodb(all_results)

    # Exportar CSV a S3 (para importar a Google Sheets/Excel)
    csv_url = None
    if all_results:
        csv_url = export_csv_to_s3(all_results)

    # Resultado final
    duration = (datetime.utcnow() - start_time).total_seconds()

    response = {
        'statusCode': 200,
        'body': json.dumps({
            'success': True,
            'stats': stats,
            'csv_download_url': csv_url,
            'duration_seconds': duration,
            'timestamp': start_time.isoformat()
        })
    }

    print(f"Completado: {json.dumps(stats)}")
    return response


# Para testing local
if __name__ == '__main__':
    # Test con un ID SENCE
    test_event = {
        'id_sence': '6749253'
    }
    result = handler(test_event, None)
    print(json.dumps(result, indent=2))
