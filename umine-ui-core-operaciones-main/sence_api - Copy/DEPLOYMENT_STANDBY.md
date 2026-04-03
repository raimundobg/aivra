# SENCE Bot - Deployment Stand By

**Fecha**: 2026-02-04
**Estado**: En progreso - API Gateway pendiente de configurar

---

## Resumen del Proyecto

Sincronización automática de datos SENCE con Google Sheets cada 2 horas.

### Componentes

1. **Lambda SENCE** (existente): `operaciones-core-internal-extract-data-user-sence`
2. **Google Sheet**: https://docs.google.com/spreadsheets/d/1fgSHb3edW__d-JE7NX27-zFBNR17ZwbyFITWfwVjdWI
3. **Google Apps Script**: Listo en `scripts/google_apps_script.js`

---

## Estado Actual

### Lambda SENCE
- **Nombre**: `operaciones-core-internal-extract-data-user-sence`
- **Región**: us-east-2 (Ohio)
- **ARN**: `arn:aws:lambda:us-east-2:891377298400:function:operaciones-core-internal-extract-data-user-sence`
- **Handler**: Funciona correctamente (probado)

### API Gateway (PENDIENTE)
- **API creada**: `sence-api`
- **URL actual**: `https://pue1oa58el.execute-api.us-east-2.amazonaws.com/`
- **Estado**: NO FUNCIONA - rutas mal configuradas

### Problema Actual
La Lambda recibe el path incorrecto: `/default/operaciones-core-internal-extract-data-user-sence`
Debería recibir: `/` o `/participants/{sence_code}`

---

## Pasos Pendientes para Completar

### 1. Configurar API Gateway correctamente

En **AWS Console > API Gateway > sence-api > Routes**:

1. Eliminar rutas existentes que no funcionan

2. Crear estas rutas:
   ```
   GET /                           → Lambda
   GET /health                     → Lambda
   GET /participants/{sence_code}  → Lambda
   ```

3. O crear ruta catch-all:
   ```
   $default → Lambda
   ```

4. Verificar que funcione:
   ```
   https://pue1oa58el.execute-api.us-east-2.amazonaws.com/
   https://pue1oa58el.execute-api.us-east-2.amazonaws.com/participants/6744840
   ```

### 2. Actualizar Google Apps Script

Una vez que la API funcione, actualizar la URL en `scripts/google_apps_script.js`:

```javascript
const SENCE_API_URL = "https://pue1oa58el.execute-api.us-east-2.amazonaws.com/participants";
```

### 3. Instalar Apps Script en Google Sheets

1. Abrir Google Sheet → Extensiones → Apps Script
2. Pegar código de `scripts/google_apps_script.js`
3. Ejecutar `sincronizarSENCE`
4. Autorizar permisos
5. Ejecutar `configurarTriggerCada2Horas` para auto-sync

---

## Lambda Handler (Referencia)

La Lambda espera estas rutas:

```python
# GET / - Página de prueba HTML
if path == '/' or path == '':
    return HTML

# GET /health - Health check
if path == '/health':
    return {'status': 'healthy'}

# GET /participants/{sence_code} - Obtener participantes
if path.startswith('/participants/'):
    sence_code = path.split('/participants/')[-1]
    # Llama a SENCE WS y retorna participantes
```

---

## Google Sheet Info

- **ID**: `1fgSHb3edW__d-JE7NX27-zFBNR17ZwbyFITWfwVjdWI`
- **Hoja**: `BBDD 2025`
- **IDs SENCE encontrados**: 6744840, 6749253, 6628203, y ~800 más
- **Columnas clave**: ID SENCE, RUT, CONEX SENCE, DJ

### Columnas que se agregarán:
- CONEXBOT
- DJBOT
- ConexBOTStatus
- DJBOTStatus
- BOT_PROCESSED
- BOT_NUM_SESIONES
- Actualizar_CONEX
- Actualizar_DJ

---

## Archivos del Proyecto

```
sence_api/
├── scripts/
│   ├── google_apps_script.js      # Script para Google Sheets (LISTO)
│   ├── sence_bot_sync.py          # Script local para Excel
│   └── sence_bot_gsheets.py       # Versión con gspread
├── lambda/
│   └── sence_sync_bot/
│       ├── handler.py             # Lambda secundaria (opcional)
│       ├── serverless.yml         # Configuración serverless
│       └── requirements.txt
├── INSTRUCCIONES_GOOGLE_SHEETS.md
└── DEPLOYMENT_STANDBY.md          # Este archivo
```

---

## URLs de Referencia

- **AWS Console Lambda**: https://us-east-2.console.aws.amazon.com/lambda/home?region=us-east-2#/functions/operaciones-core-internal-extract-data-user-sence
- **AWS Console API Gateway**: https://us-east-2.console.aws.amazon.com/apigateway/main/apis?region=us-east-2
- **Google Sheet**: https://docs.google.com/spreadsheets/d/1fgSHb3edW__d-JE7NX27-zFBNR17ZwbyFITWfwVjdWI/edit

---

## Notas Técnicas

### Por qué falla el API Gateway actual

Cuando se crea API Gateway desde Lambda console, crea una ruta con el nombre de la función:
```
/default/operaciones-core-internal-extract-data-user-sence
```

Pero la Lambda espera paths simples como `/` o `/participants/123`.

### Solución

Crear rutas correctas en API Gateway que mapeen directamente a la Lambda sin incluir el nombre de la función en el path.

---

## Contacto

- **Usuario IAM**: raimundo-burchardt
- **Account ID**: 891377298400
- **Región**: us-east-2

---

*Documento generado el 2026-02-04. Retomar configuración de API Gateway cuando sea posible.*
