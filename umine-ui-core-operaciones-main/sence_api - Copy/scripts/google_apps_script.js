/**
 * SENCE Bot Sync - Google Apps Script
 *
 * INSTRUCCIONES:
 * 1. Abre tu Google Sheet "COPIA Tablero SENCE"
 * 2. Extensiones → Apps Script
 * 3. Pega este código
 * 4. Configura la URL de tu API Lambda (línea 15)
 * 5. Ejecuta "sincronizarSENCE" o configura un trigger cada 2 horas
 */

// ========== CONFIGURACIÓN ==========
// URL de tu API Lambda (API Gateway endpoint)
// IMPORTANTE: Reemplazar con tu endpoint real de API Gateway
const SENCE_API_URL = "https://pue1oa58el.execute-api.us-east-2.amazonaws.com/participants";

// Sheet ID (ya lo tenemos)
const SHEET_ID = "1fgSHb3edW__d-JE7NX27-zFBNR17ZwbyFITWfwVjdWI";

// Nombre de la hoja a actualizar
const SHEET_NAME = "BBDD 2025";

// IDs SENCE a procesar - Se obtienen automáticamente del Sheet
// También puedes fijarlos manualmente:
// const ID_SENCES_MANUAL = ["6744840", "6749253", "6628203"];
const ID_SENCES_MANUAL = null; // null = obtener automáticamente del Sheet

// ========== COLUMNAS ==========
const COL_ID_SENCE = "ID SENCE";
const COL_RUT = "RUT";
const COL_CONEX_SENCE = "CONEX SENCE";
const COL_DJ = "DJ";

// Columnas BOT (se crean si no existen)
const COL_CONEXBOT = "CONEXBOT";
const COL_DJBOT = "DJBOT";
const COL_CONEXBOT_STATUS = "ConexBOTStatus";
const COL_DJBOT_STATUS = "DJBOTStatus";
const COL_BOT_PROCESSED = "BOT_PROCESSED";
const COL_BOT_NUM_SESIONES = "BOT_NUM_SESIONES";
const COL_FLAG_CONEX = "Actualizar_CONEX";
const COL_FLAG_DJ = "Actualizar_DJ";

// ========== FUNCIONES PRINCIPALES ==========

/**
 * Obtiene IDs SENCE únicos del Sheet
 */
function getIdSencesFromSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idSenceCol = headers.indexOf(COL_ID_SENCE);

  if (idSenceCol === -1) {
    Logger.log("ERROR: No se encontró columna " + COL_ID_SENCE);
    return [];
  }

  const ids = new Set();
  for (let i = 1; i < data.length; i++) {
    const id = data[i][idSenceCol];
    if (id) ids.add(String(id));
  }

  return Array.from(ids);
}

/**
 * Función principal - Ejecutar manualmente o con trigger
 */
function sincronizarSENCE() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log("ERROR: No se encontró la hoja " + SHEET_NAME);
    return;
  }

  Logger.log("=== SENCE Bot Sync Iniciado ===");
  Logger.log("Hora: " + new Date().toISOString());

  // Asegurar columnas BOT existen
  ensureBotColumns(sheet);

  // Obtener IDs SENCE a procesar
  const idSences = ID_SENCES_MANUAL || getIdSencesFromSheet(sheet);
  Logger.log("IDs SENCE a procesar: " + idSences.join(", "));

  // Obtener datos
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Índices de columnas
  const colIdx = {
    idSence: headers.indexOf(COL_ID_SENCE),
    rut: headers.indexOf(COL_RUT),
    conexSence: headers.indexOf(COL_CONEX_SENCE),
    dj: headers.indexOf(COL_DJ),
    conexBot: headers.indexOf(COL_CONEXBOT),
    djBot: headers.indexOf(COL_DJBOT),
    conexBotStatus: headers.indexOf(COL_CONEXBOT_STATUS),
    djBotStatus: headers.indexOf(COL_DJBOT_STATUS),
    botProcessed: headers.indexOf(COL_BOT_PROCESSED),
    botNumSesiones: headers.indexOf(COL_BOT_NUM_SESIONES),
    flagConex: headers.indexOf(COL_FLAG_CONEX),
    flagDj: headers.indexOf(COL_FLAG_DJ)
  };

  // Estadísticas
  let stats = {
    procesados: 0,
    actualizados: 0,
    errores: 0,
    flagsConex: 0,
    flagsDj: 0,
    saltados: 0,  // Filas ya completas (CONEX=1 y DJ=1)
    idSencesSaltados: 0  // IDs SENCE completamente procesados (sin llamar API)
  };

  // Procesar cada ID SENCE
  for (const idSence of idSences) {
    Logger.log("\n--- Procesando ID SENCE: " + idSence + " ---");

    // PRE-CHECK: Verificar si hay filas incompletas para este ID SENCE
    let hasIncompleteRows = false;
    for (let row = 1; row < data.length; row++) {
      const rowIdSence = String(data[row][colIdx.idSence] || "");
      if (rowIdSence !== idSence) continue;

      const excelConex = data[row][colIdx.conexSence] === 1 ? 1 : 0;
      const excelDj = data[row][colIdx.dj] === 1 ? 1 : 0;

      if (excelConex !== 1 || excelDj !== 1) {
        hasIncompleteRows = true;
        break;  // Encontramos al menos una fila incompleta
      }
    }

    // Si todas las filas están completas, saltar API call
    if (!hasIncompleteRows) {
      Logger.log("  [SKIP API] Todas las filas ya tienen CONEX=1 y DJ=1");
      stats.idSencesSaltados++;
      continue;
    }

    try {
      const participants = fetchSenceParticipants(idSence);
      if (!participants) {
        Logger.log("  Sin participantes o error");
        stats.errores++;
        continue;
      }

      Logger.log("  Participantes API: " + participants.length);
      stats.procesados++;

      // Crear índice por RUT
      const participantsByRut = {};
      for (const p of participants) {
        const rutNorm = normalizeRut(p.rut);
        participantsByRut[rutNorm] = p;
      }

      // Actualizar filas del Sheet
      for (let row = 1; row < data.length; row++) {
        const rowIdSence = String(data[row][colIdx.idSence] || "");
        if (rowIdSence !== idSence) continue;

        // Valores actuales del Excel
        const excelConex = data[row][colIdx.conexSence] === 1 ? 1 : 0;
        const excelDj = data[row][colIdx.dj] === 1 ? 1 : 0;

        // OPTIMIZACIÓN: Si ya tiene CONEX=1 y DJ=1, saltar (ya está completo)
        if (excelConex === 1 && excelDj === 1) {
          stats.saltados++;
          continue;
        }

        const rut = normalizeRut(data[row][colIdx.rut]);
        const participant = participantsByRut[rut];

        if (!participant) continue;

        // Valores de la API
        const apiConex = participant.conectado ? 1 : 0;
        const apiDj = participant.declaracion_jurada ? 1 : 0;
        const apiSesiones = participant.num_sesiones || 0;

        // Calcular flags
        const flagConex = (apiConex === 1 && excelConex === 0) ? 1 : 0;
        const flagDj = (apiDj === 1 && excelDj === 0) ? 1 : 0;

        // Actualizar celdas (row + 1 porque Apps Script usa índice 1)
        const rowNum = row + 1;
        sheet.getRange(rowNum, colIdx.conexBot + 1).setValue(apiConex);
        sheet.getRange(rowNum, colIdx.djBot + 1).setValue(apiDj);
        sheet.getRange(rowNum, colIdx.conexBotStatus + 1).setValue(excelConex === apiConex);
        sheet.getRange(rowNum, colIdx.djBotStatus + 1).setValue(excelDj === apiDj);
        sheet.getRange(rowNum, colIdx.botProcessed + 1).setValue(new Date().toISOString());
        sheet.getRange(rowNum, colIdx.botNumSesiones + 1).setValue(apiSesiones);
        sheet.getRange(rowNum, colIdx.flagConex + 1).setValue(flagConex);
        sheet.getRange(rowNum, colIdx.flagDj + 1).setValue(flagDj);

        stats.actualizados++;
        if (flagConex) stats.flagsConex++;
        if (flagDj) stats.flagsDj++;

        Logger.log("  [OK] " + rut + ": CONEX=" + apiConex + ", DJ=" + apiDj);
      }

    } catch (e) {
      Logger.log("  ERROR: " + e.message);
      stats.errores++;
    }

    // Pausa para evitar rate limiting
    Utilities.sleep(1000);
  }

  // Resumen
  Logger.log("\n=== RESUMEN ===");
  Logger.log("IDs procesados: " + stats.procesados);
  Logger.log("IDs saltados (sin API call): " + stats.idSencesSaltados);
  Logger.log("Registros actualizados: " + stats.actualizados);
  Logger.log("Filas saltadas (ya completas): " + stats.saltados);
  Logger.log("Errores: " + stats.errores);
  Logger.log("Flags CONEX (a actualizar): " + stats.flagsConex);
  Logger.log("Flags DJ (a actualizar): " + stats.flagsDj);

  // Notificación opcional
  if (stats.flagsConex > 0 || stats.flagsDj > 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      "SENCE Bot: " + stats.flagsConex + " CONEX y " + stats.flagsDj + " DJ por actualizar",
      "Sincronización completada",
      10
    );
  }
}

/**
 * Llama a la API SENCE
 */
function fetchSenceParticipants(idSence) {
  try {
    const url = SENCE_API_URL + "/" + idSence;
    const options = {
      method: "GET",
      muteHttpExceptions: true,
      headers: {
        "Content-Type": "application/json"
      }
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      Logger.log("  API Error: HTTP " + responseCode);
      return null;
    }

    const data = JSON.parse(response.getContentText());

    if (data.success) {
      return data.participants || [];
    } else {
      Logger.log("  API Error: " + data.error);
      return null;
    }

  } catch (e) {
    Logger.log("  Fetch Error: " + e.message);
    return null;
  }
}

/**
 * Normaliza RUT
 */
function normalizeRut(rut) {
  if (!rut) return "";
  let rutStr = String(rut).trim().toUpperCase().replace(/\./g, "");
  if (rutStr.indexOf("-") === -1 && rutStr.length > 1) {
    rutStr = rutStr.slice(0, -1) + "-" + rutStr.slice(-1);
  }
  return rutStr;
}

/**
 * Asegura que existan las columnas BOT
 */
function ensureBotColumns(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const botColumns = [
    COL_CONEXBOT, COL_DJBOT, COL_CONEXBOT_STATUS, COL_DJBOT_STATUS,
    COL_BOT_PROCESSED, COL_BOT_NUM_SESIONES, COL_FLAG_CONEX, COL_FLAG_DJ
  ];

  for (const col of botColumns) {
    if (headers.indexOf(col) === -1) {
      const newColIdx = sheet.getLastColumn() + 1;
      sheet.getRange(1, newColIdx).setValue(col);
      Logger.log("Columna creada: " + col);
    }
  }
}

/**
 * Configura trigger automático cada 2 horas
 * Ejecutar esta función UNA VEZ para activar el cron
 */
function configurarTriggerCada2Horas() {
  // Eliminar triggers existentes
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === "sincronizarSENCE") {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  // Crear nuevo trigger cada 2 horas
  ScriptApp.newTrigger("sincronizarSENCE")
    .timeBased()
    .everyHours(2)
    .create();

  Logger.log("Trigger configurado: sincronizarSENCE cada 2 horas");
}

/**
 * Menu personalizado
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("🤖 SENCE Bot")
    .addItem("Sincronizar ahora", "sincronizarSENCE")
    .addItem("Configurar auto-sync (cada 2h)", "configurarTriggerCada2Horas")
    .addToUi();
}
