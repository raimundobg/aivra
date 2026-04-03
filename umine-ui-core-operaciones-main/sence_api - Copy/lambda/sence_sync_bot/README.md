# SENCE Sync Bot - AWS Lambda (100% AWS)

Lambda que sincroniza datos de SENCE cada 2 horas. Sin Google Cloud.

## Arquitectura

```
EventBridge (cada 2h)
       │
       ▼
┌──────────────────┐     ┌─────────────────────────────────────┐
│  sence-sync-bot  │────▶│ operaciones-core-internal-extract-  │
│                  │     │      data-user-sence                │
└──────────────────┘     └─────────────────────────────────────┘
       │
       ├──▶ DynamoDB (resultados en tiempo real)
       └──▶ S3 (CSV descargable para Google Sheets/Excel)
```

## Despliegue Rápido

```bash
# 1. Instalar Serverless
npm install -g serverless
cd lambda/sence_sync_bot
npm init -y
npm install --save-dev serverless-python-requirements

# 2. Configurar AWS (si no lo has hecho)
aws configure

# 3. Desplegar
serverless deploy --stage prod
```

## Configurar IDs SENCE a Sincronizar

Editar `serverless.yml`:

```yaml
events:
  - schedule:
      rate: rate(2 hours)
      input:
        id_sences:
          - "6749253"
          - "6628203"
          - "6659418"
          # Agregar todos los IDs aquí
```

## Uso

### Ejecutar manualmente
```bash
# Un ID
aws lambda invoke \
  --function-name sence-sync-bot-prod-syncBot \
  --payload '{"id_sence": "6749253"}' \
  response.json

cat response.json
```

### Descargar CSV para Google Sheets
Cada ejecución genera un CSV en S3. La respuesta incluye `csv_download_url`:

```json
{
  "success": true,
  "csv_download_url": "https://s3.amazonaws.com/...",
  "stats": {
    "processed": 1,
    "total_participants": 7,
    "flags_conex": 4,
    "flags_dj": 4
  }
}
```

**Importar a Google Sheets:**
1. Descargar el CSV desde la URL
2. Google Sheets > Archivo > Importar > Subir > Seleccionar CSV
3. O usar la URL directamente: Archivo > Importar > URL

### Ver Logs
```bash
serverless logs -f syncBot --stage prod --tail
```

## Estructura del CSV Exportado

| Columna | Descripción |
|---------|-------------|
| id_sence | ID del curso |
| rut | RUT del participante |
| nombre | Nombre completo |
| conexbot | 1 si conectado según API |
| djbot | 1 si DJ firmada según API |
| num_sesiones | Número de sesiones |
| actualizar_conex | **1 si hay que actualizar CONEX** |
| actualizar_dj | **1 si hay que actualizar DJ** |
| updated_at | Timestamp |

## Costos AWS

| Servicio | Costo/mes |
|----------|-----------|
| Lambda | ~$0.20 |
| DynamoDB | ~$0 (on-demand) |
| S3 | ~$0.01 |
| EventBridge | Gratis |
| **Total** | **~$0.25/mes** |

## Alternativa: Actualizar Google Sheets Automáticamente

Si quieres que el CSV se importe automáticamente a Google Sheets:

1. Crear un Google Apps Script en tu Sheet:
```javascript
function importFromS3() {
  var url = "TU_CSV_URL_DE_S3";
  var response = UrlFetchApp.fetch(url);
  var csv = response.getContentText();
  var data = Utilities.parseCsv(csv);

  var sheet = SpreadsheetApp.getActiveSheet();
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
}
```

2. Configurar trigger cada 2 horas en Apps Script
(Apps Script no requiere tarjeta de Google Cloud)
