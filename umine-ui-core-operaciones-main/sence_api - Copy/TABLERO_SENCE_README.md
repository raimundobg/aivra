# TABLERO SENCE - Sistema de Datos Operacionales

**Autor**: raioumine (Raimundo Burchardt)
**Fecha**: 2026-02-09
**Estado**: Desarrollo - TODO VA A GITHUB PERSONAL (raioumine), NO A PRODUCCION

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                     TABLERO SENCE SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐         ┌─────────────────────────────┐  │
│   │  Excel BBDD     │──────▶  │     DynamoDB Table          │  │
│   │  2025 (69 cols) │ migrate │  tablero-sence-operaciones  │  │
│   └─────────────────┘         └─────────────────────────────┘  │
│                                        ▲                        │
│                                        │                        │
│   ┌─────────────────┐         ┌────────┴────────┐              │
│   │  SENCE API      │◀────────│  Tablero API    │◀─── HTTP    │
│   │  (LCE Portal)   │  sync   │  (Lambda)       │    requests │
│   └─────────────────┘         └─────────────────┘              │
│                                        │                        │
│                               ┌────────▼────────┐              │
│                               │  EventBridge    │              │
│                               │  (cada 2 horas) │              │
│                               └─────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Datos DynamoDB

### Tabla Principal: `tablero-sence-operaciones`

| Key | Pattern | Ejemplo |
|-----|---------|---------|
| PK | `COURSE#<codSence>` | `COURSE#6749253` |
| SK | `PARTICIPANT#<rut>` | `PARTICIPANT#12345678-9` |

### Global Secondary Indexes (GSIs)

| GSI | PK | SK | Uso |
|-----|----|----|-----|
| gsi1-client | `CLIENT#<idCliente>` | `COURSE#<codSence>#PARTICIPANT#<rut>` | Buscar por cliente |
| gsi2-rut | `RUT#<rut>` | `COURSE#<codSence>` | Buscar por participante |

### Campos (69 columnas del Excel)

Todos los campos del Excel BBDD 2025 mapeados a camelCase. Ver `src/types/tableroSence.ts` para el mapeo completo.

---

## Archivos del Proyecto

```
sence_api - Copy/
├── src/
│   ├── types/
│   │   ├── tableroSence.ts      # Modelo de datos (69 columnas)
│   │   └── index.ts              # Otros tipos SENCE
│   ├── services/
│   │   ├── tableroSenceDynamo.ts # Servicio DynamoDB (CRUD)
│   │   └── sence.ts              # Servicio API SENCE
│   └── handlers/
│       └── tableroApi.ts         # Lambda API handler
├── lambda/
│   ├── tablero_sence_api/
│   │   └── serverless.yml        # Config Serverless para API
│   └── sence_sync_bot/
│       └── handler.py            # Bot de sincronizacion
├── scripts/
│   └── migrateExcelToDynamo.ts   # Script de migracion
└── TABLERO_SENCE_README.md       # Este archivo
```

---

## Instalacion y Despliegue

### 1. Prerrequisitos

```bash
# Node.js 18+
node --version

# AWS CLI configurado
aws configure

# Serverless Framework
npm install -g serverless
```

### 2. Instalar dependencias

```bash
cd "sence_api - Copy"
npm install

# Dependencias adicionales para migracion
npm install xlsx @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
npm install -D typescript ts-node @types/node
```

### 3. Compilar TypeScript

```bash
npx tsc
```

### 4. Migrar datos del Excel

```bash
# Primero hacer dry-run para verificar
npx ts-node scripts/migrateExcelToDynamo.ts --dry-run

# Luego migrar (crea la tabla si no existe)
npx ts-node scripts/migrateExcelToDynamo.ts
```

### 5. Desplegar Lambda API

```bash
cd lambda/tablero_sence_api
serverless deploy --stage dev
```

---

## Uso de la API

### Endpoints disponibles

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/tablero/health` | Health check |
| GET | `/tablero/stats` | Estadisticas generales |
| GET | `/tablero/course/{codSence}` | Participantes de un curso |
| GET | `/tablero/client/{idCliente}` | Cursos de un cliente |
| GET | `/tablero/participant/{rut}` | Cursos de un participante |
| GET | `/tablero/{codSence}/{rut}` | Registro especifico |
| POST | `/tablero` | Crear registro |
| PUT | `/tablero/{codSence}/{rut}` | Actualizar registro |
| DELETE | `/tablero/{codSence}/{rut}` | Eliminar registro |
| POST | `/tablero/batch-update` | Actualizacion masiva |
| GET | `/tablero/search?filters...` | Busqueda con filtros |

### Ejemplos

```bash
# Health check
curl https://API_URL/tablero/health

# Obtener estadisticas
curl https://API_URL/tablero/stats

# Obtener participantes de un curso
curl https://API_URL/tablero/course/6749253

# Obtener cursos de un cliente
curl https://API_URL/tablero/client/CLIENTE123

# Actualizar un registro
curl -X PUT https://API_URL/tablero/6749253/12345678-9 \
  -H "Content-Type: application/json" \
  -d '{"updates": {"conexBot": 1, "djBot": 1}}'

# Actualizacion masiva (para sync bot)
curl -X POST https://API_URL/tablero/batch-update \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"codSence": "6749253", "rut": "12345678-9", "updates": {"conexBot": 1}},
      {"codSence": "6749253", "rut": "98765432-1", "updates": {"djBot": 1}}
    ]
  }'
```

---

## COMO BORRAR TODO

### Opcion 1: Serverless Remove (Recomendado)

```bash
cd lambda/tablero_sence_api
serverless remove --stage dev
```

Esto elimina:
- Lambda functions
- API Gateway
- DynamoDB table
- CloudWatch logs
- IAM roles

### Opcion 2: Manual AWS CLI

```bash
# Eliminar tabla DynamoDB
aws dynamodb delete-table --table-name tablero-sence-api-dev --region us-east-2

# Eliminar Lambda
aws lambda delete-function --function-name tablero-sence-api-dev-api --region us-east-2

# Eliminar API Gateway (obtener ID primero)
aws apigateway get-rest-apis --region us-east-2
aws apigateway delete-rest-api --rest-api-id <API_ID> --region us-east-2
```

### Opcion 3: Eliminar solo los datos (mantener infraestructura)

```bash
# Usando AWS CLI
aws dynamodb scan --table-name tablero-sence-api-dev --region us-east-2 \
  --projection-expression "pk,sk" \
  --output json | jq -r '.Items[] | "aws dynamodb delete-item --table-name tablero-sence-api-dev --key " + (. | tojson)' | sh
```

---

## Sincronizacion con SENCE API

El sync bot (`sence_sync_bot/handler.py`) se ejecuta cada 2 horas y:

1. Llama a la Lambda `operaciones-core-internal-extract-data-user-sence`
2. Compara con datos actuales en DynamoDB
3. Actualiza campos `conexBot`, `djBot`, `actualizarConex`, `actualizarDj`
4. Exporta CSV a S3

### Flujo de actualizacion

```
SENCE API ──▶ sence_sync_bot ──▶ tablero-sence-operaciones (DynamoDB)
                  │
                  └──▶ S3 (CSV backup)
```

---

## Notas Importantes

1. **TODO VA A GITHUB PERSONAL `raioumine`** - Nunca a produccion
2. **Reversible** - Todo puede eliminarse con `serverless remove`
3. **Region** - us-east-2 (Ohio) - igual que Lambda SENCE existente
4. **Billing** - PAY_PER_REQUEST (solo pagas por uso)
5. **Estimado costo** - ~$0.50/mes para volumen actual

---

## Contacto

- **GitHub**: raioumine
- **AWS Account**: 891377298400
- **Region**: us-east-2
