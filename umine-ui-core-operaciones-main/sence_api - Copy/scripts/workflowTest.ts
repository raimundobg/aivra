/**
 * SENCE Bot Workflow Test
 *
 * Simula el flujo del Google Apps Script para testear la API.
 * Basado en: google_apps_script.js
 *
 * WORKFLOW:
 * 1. Obtener IDs SENCE unicos del tablero
 * 2. Para cada ID SENCE, obtener participantes
 * 3. Comparar con datos actuales (CONEX SENCE, DJ)
 * 4. Actualizar columnas BOT (conexBot, djBot, etc.)
 * 5. Setear flags Actualizar_CONEX y Actualizar_DJ
 *
 * USO:
 *   npx ts-node scripts/workflowTest.ts
 *
 * REQUIERE:
 *   El servidor local debe estar corriendo:
 *   npx ts-node scripts/localServer.ts
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001';

// ============================================
// Types
// ============================================

interface TableroRecord {
    codSence: string;
    rut: string;
    idCliente: string;
    nombres: string | null;
    apellidos: string | null;
    conexSence: number | null;
    dj: number | null;
    conexBot: number | null;
    djBot: number | null;
    actualizarConex: number | null;
    actualizarDj: number | null;
    [key: string]: any;
}

interface WorkflowStats {
    idSencesTotal: number;
    idSencesProcesados: number;
    idSencesSaltados: number;
    registrosActualizados: number;
    filasSaltadas: number;
    flagsConex: number;
    flagsDj: number;
    errores: number;
}

// ============================================
// Helper Functions
// ============================================

function normalizeRut(rut: string | null): string {
    if (!rut) return '';
    let rutStr = String(rut).trim().toUpperCase().replace(/\./g, '');
    if (!rutStr.includes('-') && rutStr.length > 1) {
        rutStr = rutStr.slice(0, -1) + '-' + rutStr.slice(-1);
    }
    return rutStr;
}

function log(message: string, indent = 0): void {
    const prefix = '  '.repeat(indent);
    console.log(`${prefix}${message}`);
}

// ============================================
// Workflow Functions
// ============================================

/**
 * Obtiene todos los IDs SENCE unicos del tablero
 */
async function getUniqueIdSences(): Promise<string[]> {
    const response = await axios.get(`${API_URL}/tablero/search?limit=50000`);
    const records: TableroRecord[] = response.data.items || [];

    const idSences = new Set<string>();
    for (const record of records) {
        if (record.codSence) {
            idSences.add(record.codSence);
        }
    }

    return Array.from(idSences);
}

/**
 * Obtiene participantes de un curso
 */
async function getParticipantsByCourse(codSence: string): Promise<TableroRecord[]> {
    const response = await axios.get(`${API_URL}/tablero/course/${encodeURIComponent(codSence)}`);
    return response.data.items || [];
}

/**
 * Simula la respuesta de la API SENCE (basado en datos del tablero)
 * En produccion, esto llamaria a la API real de SENCE
 */
function simulateSenceApiResponse(records: TableroRecord[]): Map<string, { conectado: boolean; declaracion_jurada: boolean; num_sesiones: number }> {
    const response = new Map();

    for (const record of records) {
        const rut = normalizeRut(record.rut);

        // Simular: si ya tiene conexBot=1 o djBot=1, la API retorna esos valores
        // Si no, simular aleatoriamente algunos como conectados
        const conectado = record.conexBot === 1 || record.conexSence === 1 || Math.random() > 0.7;
        const dj = record.djBot === 1 || record.dj === 1 || (conectado && Math.random() > 0.5);

        response.set(rut, {
            conectado,
            declaracion_jurada: dj,
            num_sesiones: conectado ? Math.floor(Math.random() * 10) + 1 : 0,
        });
    }

    return response;
}

/**
 * Actualiza un registro con los datos del bot
 */
async function updateRecord(
    codSence: string,
    rut: string,
    updates: Partial<TableroRecord>
): Promise<boolean> {
    try {
        await axios.put(
            `${API_URL}/tablero/${encodeURIComponent(codSence)}/${encodeURIComponent(rut)}`,
            { updates }
        );
        return true;
    } catch {
        return false;
    }
}

/**
 * Batch update de registros
 */
async function batchUpdate(
    items: Array<{ codSence: string; rut: string; updates: Partial<TableroRecord> }>
): Promise<{ updated: number; failed: number }> {
    const response = await axios.post(`${API_URL}/tablero/batch-update`, { items });
    return {
        updated: response.data.updated || 0,
        failed: response.data.failed || 0,
    };
}

// ============================================
// Main Workflow
// ============================================

async function runWorkflow(): Promise<void> {
    console.log('='.repeat(60));
    console.log('SENCE Bot Workflow Test');
    console.log('Simulando flujo del Google Apps Script');
    console.log('='.repeat(60));
    console.log(`API: ${API_URL}`);
    console.log(`Hora: ${new Date().toISOString()}`);
    console.log('');

    // Check server
    try {
        await axios.get(`${API_URL}/tablero/health`);
    } catch {
        console.error('ERROR: El servidor local no esta corriendo!');
        console.error('Ejecuta primero: npx ts-node scripts/localServer.ts');
        process.exit(1);
    }

    const stats: WorkflowStats = {
        idSencesTotal: 0,
        idSencesProcesados: 0,
        idSencesSaltados: 0,
        registrosActualizados: 0,
        filasSaltadas: 0,
        flagsConex: 0,
        flagsDj: 0,
        errores: 0,
    };

    // 1. Obtener IDs SENCE unicos
    log('Obteniendo IDs SENCE unicos...');
    const idSences = await getUniqueIdSences();
    stats.idSencesTotal = idSences.length;
    log(`Encontrados: ${idSences.length} IDs SENCE unicos`);
    console.log('');

    // Limitar para test (procesar solo algunos)
    const testLimit = 5;
    const idSencesToProcess = idSences.slice(0, testLimit);
    log(`Procesando ${idSencesToProcess.length} IDs SENCE (limite de test: ${testLimit})`);
    console.log('');

    // 2. Procesar cada ID SENCE
    for (const idSence of idSencesToProcess) {
        log(`--- Procesando ID SENCE: ${idSence} ---`);

        try {
            // Obtener participantes del tablero
            const participants = await getParticipantsByCourse(idSence);
            log(`Participantes en tablero: ${participants.length}`, 1);

            // PRE-CHECK: Verificar si hay filas incompletas
            const incompleteRows = participants.filter(p =>
                p.conexSence !== 1 || p.dj !== 1
            );

            if (incompleteRows.length === 0) {
                log('[SKIP] Todas las filas ya tienen CONEX=1 y DJ=1', 1);
                stats.idSencesSaltados++;
                continue;
            }

            log(`Filas incompletas: ${incompleteRows.length}`, 1);

            // Simular llamada a API SENCE
            const senceData = simulateSenceApiResponse(participants);
            log(`Respuesta API SENCE simulada: ${senceData.size} participantes`, 1);

            stats.idSencesProcesados++;

            // 3. Comparar y preparar updates
            const updates: Array<{ codSence: string; rut: string; updates: Partial<TableroRecord> }> = [];

            for (const record of participants) {
                const excelConex = record.conexSence === 1 ? 1 : 0;
                const excelDj = record.dj === 1 ? 1 : 0;

                // Skip si ya esta completo
                if (excelConex === 1 && excelDj === 1) {
                    stats.filasSaltadas++;
                    continue;
                }

                const rut = normalizeRut(record.rut);
                const apiData = senceData.get(rut);

                if (!apiData) continue;

                const apiConex = apiData.conectado ? 1 : 0;
                const apiDj = apiData.declaracion_jurada ? 1 : 0;

                // Calcular flags
                const flagConex = (apiConex === 1 && excelConex === 0) ? 1 : 0;
                const flagDj = (apiDj === 1 && excelDj === 0) ? 1 : 0;

                if (flagConex) stats.flagsConex++;
                if (flagDj) stats.flagsDj++;

                updates.push({
                    codSence: record.codSence,
                    rut: record.rut,
                    updates: {
                        conexBot: apiConex,
                        djBot: apiDj,
                        conexBotStatus: excelConex === apiConex ? 1 : 0,
                        djBotStatus: excelDj === apiDj ? 1 : 0,
                        botProcessed: new Date().toISOString(),
                        botNumSesiones: apiData.num_sesiones,
                        actualizarConex: flagConex,
                        actualizarDj: flagDj,
                    },
                });
            }

            // 4. Aplicar updates
            if (updates.length > 0) {
                const result = await batchUpdate(updates);
                stats.registrosActualizados += result.updated;
                stats.errores += result.failed;
                log(`Actualizados: ${result.updated}, Errores: ${result.failed}`, 1);
            }

        } catch (error: any) {
            log(`ERROR: ${error.message}`, 1);
            stats.errores++;
        }

        console.log('');
    }

    // 5. Resumen
    console.log('='.repeat(60));
    console.log('RESUMEN DEL WORKFLOW');
    console.log('='.repeat(60));
    console.log(`IDs SENCE total:          ${stats.idSencesTotal}`);
    console.log(`IDs procesados:           ${stats.idSencesProcesados}`);
    console.log(`IDs saltados (completos): ${stats.idSencesSaltados}`);
    console.log(`Registros actualizados:   ${stats.registrosActualizados}`);
    console.log(`Filas saltadas:           ${stats.filasSaltadas}`);
    console.log(`Flags CONEX (pendientes): ${stats.flagsConex}`);
    console.log(`Flags DJ (pendientes):    ${stats.flagsDj}`);
    console.log(`Errores:                  ${stats.errores}`);
    console.log('='.repeat(60));

    // 6. Mostrar estadisticas actualizadas
    console.log('\nEstadisticas del tablero post-workflow:');
    const finalStats = await axios.get(`${API_URL}/tablero/stats`);
    console.log(JSON.stringify(finalStats.data.stats, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('WORKFLOW TEST COMPLETADO');
    console.log('='.repeat(60));
}

// ============================================
// Run
// ============================================

runWorkflow().catch(error => {
    console.error('Workflow failed:', error.message);
    process.exit(1);
});
