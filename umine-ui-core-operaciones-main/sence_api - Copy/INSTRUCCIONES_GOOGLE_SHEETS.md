# Sincronización SENCE Bot → Google Sheets

## Tu Google Sheet
- **URL**: https://docs.google.com/spreadsheets/d/1fgSHb3edW__d-JE7NX27-zFBNR17ZwbyFITWfwVjdWI
- **Hoja**: BBDD 2025
- **ID SENCE encontrado**: 6744840 (y otros que tengas)

---

## OPCIÓN A: Google Apps Script (Recomendada)
**Sin costo, se ejecuta cada 2 horas automáticamente**

### Paso 1: Abrir Apps Script
1. Abre tu Google Sheet "COPIA Tablero SENCE"
2. Ve a: **Extensiones → Apps Script**

### Paso 2: Pegar el código
1. Borra todo el contenido del editor
2. Copia el contenido del archivo `scripts/google_apps_script.js`
3. Pega en el editor

### Paso 3: Configurar API URL
En la línea 8 del script, reemplaza:
```javascript
const SENCE_API_URL = "https://TU_API_GATEWAY.execute-api.us-east-1.amazonaws.com/prod/sence/participants";
```

Con la URL de tu Lambda SENCE. Opciones:

**Si ya tienes API Gateway para `operaciones-core-internal-extract-data-user-sence`:**
```javascript
const SENCE_API_URL = "https://xxx.execute-api.us-east-1.amazonaws.com/prod/sence/participants";
```

**Si vas a desplegar `sence-sync-bot`:**
```javascript
const SENCE_API_URL = "https://xxx.execute-api.us-east-1.amazonaws.com/prod/sync";
```

### Paso 4: Guardar y autorizar
1. Click en 💾 (Guardar) o Ctrl+S
2. Click en ▶️ "Ejecutar" al lado de `sincronizarSENCE`
3. Aparecerá ventana de autorización → "Revisar permisos"
4. Selecciona tu cuenta Google
5. Click "Avanzado" → "Ir a SENCE Bot (no seguro)"
6. Click "Permitir"

### Paso 5: Configurar ejecución automática (cada 2h)
1. En Apps Script, click en ⏰ "Activadores" (menú izquierdo)
2. Click "+ Añadir activador"
3. Configurar:
   - Función: `sincronizarSENCE`
   - Fuente: Basado en tiempo
   - Tipo: Temporizador por horas
   - Intervalo: Cada 2 horas
4. Click "Guardar"

### Paso 6: Probar
1. Vuelve al código
2. Selecciona `sincronizarSENCE` en el dropdown
3. Click ▶️ "Ejecutar"
4. Ve los logs en "Ver → Registros de ejecución"

---

## OPCIÓN B: AWS Lambda + S3 CSV Import
**Si prefieres todo en AWS**

### Paso 1: Desplegar Lambda
```bash
cd lambda/sence_sync_bot
npm install -g serverless
npm install --save-dev serverless-python-requirements
serverless deploy --stage prod
```

### Paso 2: Configurar IDs SENCE
Edita `serverless.yml`, línea 55-58:
```yaml
id_sences:
  - "6744840"  # ID de tu spreadsheet
  - "6749253"
  - "6628203"
```

Redesplegar:
```bash
serverless deploy --stage prod
```

### Paso 3: Importar CSV a Google Sheets
La Lambda genera un CSV en S3 cada 2 horas:
- `s3://sence-sync-bot-prod-data/exports/sence_sync_latest.csv`

Para importar automáticamente a Google Sheets:
1. En Google Sheets, crear nueva hoja "SENCE_BOT_RESULTS"
2. En celda A1: `=IMPORTDATA("URL_PRESIGNADA_S3")`
3. O usar script de importación (ver `scripts/import_s3_csv.js`)

---

## OPCIÓN C: Híbrida (Lambda + Apps Script)
La Lambda procesa y guarda en DynamoDB/S3, y el Apps Script lee de ahí.

```javascript
// En Apps Script, función para leer de API Gateway
function sincronizarDesdeLambda() {
  const url = "https://xxx.execute-api.us-east-1.amazonaws.com/prod/sync";
  const payload = {
    id_sences: ["6744840", "6749253"]
  };

  const options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  // ... procesar respuesta
}
```

---

## Columnas que se agregan/actualizan

| Columna | Descripción |
|---------|-------------|
| CONEXBOT | Valor de conexión según API (0/1) |
| DJBOT | Valor de DJ según API (0/1) |
| ConexBOTStatus | TRUE si CONEX SENCE == CONEXBOT |
| DJBOTStatus | TRUE si DJ == DJBOT |
| BOT_PROCESSED | Timestamp del último procesamiento |
| BOT_NUM_SESIONES | Número de sesiones del participante |
| Actualizar_CONEX | 1 si API=1 y Excel=0 (DEBE actualizarse) |
| Actualizar_DJ | 1 si API=1 y Excel=0 (DEBE actualizarse) |

---

## Troubleshooting

### "Error: No se puede conectar a la API"
- Verifica que la URL de API Gateway sea correcta
- Verifica que la API permita CORS
- Verifica que la Lambda SENCE esté funcionando

### "Error: Hoja no encontrada"
- Verifica que la hoja se llame exactamente "BBDD 2025"

### "Error: Columna no encontrada"
- Verifica que exista la columna "ID SENCE" y "RUT"

### Los datos no se actualizan
- Revisa los logs en Apps Script (Ver → Registros de ejecución)
- Verifica que los IDs SENCE en el Sheet coincidan con los de la API
