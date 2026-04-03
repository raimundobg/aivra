# Setup Google Sheets - SENCE Bot

## Paso 1: Crear Proyecto en Google Cloud

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear nuevo proyecto o usar uno existente
3. Nombre sugerido: `sence-bot`

## Paso 2: Habilitar APIs

1. Ir a **APIs y Servicios** > **Biblioteca**
2. Buscar y habilitar:
   - **Google Sheets API**
   - **Google Drive API**

## Paso 3: Crear Credenciales

1. Ir a **APIs y Servicios** > **Credenciales**
2. Click en **Crear credenciales** > **Cuenta de servicio**
3. Nombre: `sence-bot-service`
4. Click en la cuenta creada
5. Ir a pestaña **Claves**
6. **Agregar clave** > **Crear clave nueva** > **JSON**
7. Se descargará un archivo `.json`
8. **Renombrar** el archivo a `credentials.json`
9. **Mover** a la carpeta `scripts/`

## Paso 4: Compartir Google Sheet

1. Abrir el Google Sheet con los datos
2. Click en **Compartir**
3. Agregar el email de la cuenta de servicio (está en el JSON, campo `client_email`)
   - Ejemplo: `sence-bot-service@tu-proyecto.iam.gserviceaccount.com`
4. Dar permisos de **Editor**

## Paso 5: Obtener ID del Sheet

El ID está en la URL del Google Sheet:
```
https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
```

## Paso 6: Ejecutar

```bash
# Asegurar que el servidor API esté corriendo
cd ../sence_api/api_reporteria-main/api_reporteria-main/app
python run_sence_real.py

# En otra terminal, ejecutar el bot
cd sence_api\ -\ Copy/scripts

# Una sola vez (para probar)
python sence_bot_gsheets.py --sheet-id TU_SHEET_ID --once

# Con scheduler cada 2 horas
python sence_bot_gsheets.py --sheet-id TU_SHEET_ID --interval 2

# Solo un ID SENCE específico
python sence_bot_gsheets.py --sheet-id TU_SHEET_ID --id-sence 6628203 --once
```

## Estructura del Google Sheet

La hoja debe llamarse **BBDD 2025** y tener estas columnas:
- `ID SENCE` - ID del curso
- `RUT` - RUT del participante
- `CONEX SENCE` - Estado conexión actual
- `DJ` - Estado declaración jurada actual

El bot agregará automáticamente:
- `CONEXBOT` - Valor de la API
- `DJBOT` - Valor de la API
- `ConexBOTStatus` - True si coinciden
- `DJBOTStatus` - True si coinciden
- `Actualizar_CONEX` - 1 si hay que actualizar
- `Actualizar_DJ` - 1 si hay que actualizar
- `BOT_NUM_SESIONES` - Número de sesiones
- `BOT_PROCESSED` - Timestamp
- `BOT_ID_PROCESSED` - ID procesado

## Hosting en la Nube (Opcional)

Para correr 24/7 sin tu PC:

### Opción A: Google Cloud Run (Recomendado)
- Gratis hasta cierto uso
- Se integra bien con Google Sheets

### Opción B: Railway.app
- Fácil de configurar
- $5/mes aproximado

### Opción C: Render.com
- Tier gratuito disponible
- Ideal para este tipo de servicios
