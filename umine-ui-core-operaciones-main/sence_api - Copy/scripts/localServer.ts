/**
 * TABLERO SENCE - Local Development Server
 *
 * Servidor Express para testear la API localmente SIN DynamoDB.
 * Usa almacenamiento en memoria para desarrollo rapido.
 *
 * USO:
 *   npx ts-node scripts/localServer.ts
 *
 * ENDPOINTS:
 *   http://localhost:3001/tablero/...
 *
 * Este servidor simula la Lambda API localmente.
 */

import * as http from 'http';
import * as url from 'url';
import * as XLSX from 'xlsx';
import * as path from 'path';
import { COLUMN_MAPPING, IGNORED_COLUMNS, TableroKeys } from '../src/types/tableroSence';

// ============================================
// Configuration
// ============================================

const PORT = 3001;
const EXCEL_FILE = path.join(__dirname, '..', '..', 'Copia de TABLERO SENCE 2025 (1).xlsx');
const SHEET_NAME = 'BBDD 2025';

// ============================================
// In-Memory Database
// ============================================

interface InMemoryRecord {
    pk: string;
    sk: string;
    [key: string]: any;
}

const database: Map<string, InMemoryRecord> = new Map();
const gsi1Index: Map<string, string[]> = new Map(); // gsi1pk -> [pk#sk]
const gsi2Index: Map<string, string[]> = new Map(); // gsi2pk -> [pk#sk]

// ============================================
// Helper Functions
// ============================================

function normalizeRut(rut: any): string {
    if (!rut) return '';
    const rutStr = String(rut).trim().toUpperCase().replace(/\./g, '');
    if (!rutStr.includes('-') && rutStr.length > 1) {
        return rutStr.slice(0, -1) + '-' + rutStr.slice(-1);
    }
    return rutStr;
}

function parseExcelDate(value: any): string | null {
    if (!value) return null;
    if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value);
        if (date) {
            return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }
    }
    if (typeof value === 'string') {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
        }
        return value;
    }
    return null;
}

function parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
}

function parseString(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;
    return String(value).trim();
}

function mapColumnName(excelColumn: string): string | null {
    const mapped = COLUMN_MAPPING[excelColumn];
    if (!mapped) return null;
    if (IGNORED_COLUMNS.includes(mapped)) return null;
    return mapped;
}

function getRecordKey(pk: string, sk: string): string {
    return `${pk}#${sk}`;
}

// ============================================
// Database Operations
// ============================================

function dbPut(record: InMemoryRecord): void {
    const key = getRecordKey(record.pk, record.sk);
    database.set(key, record);

    // Update GSI1
    if (record.gsi1pk) {
        const existing = gsi1Index.get(record.gsi1pk) || [];
        if (!existing.includes(key)) {
            existing.push(key);
            gsi1Index.set(record.gsi1pk, existing);
        }
    }

    // Update GSI2
    if (record.gsi2pk) {
        const existing = gsi2Index.get(record.gsi2pk) || [];
        if (!existing.includes(key)) {
            existing.push(key);
            gsi2Index.set(record.gsi2pk, existing);
        }
    }
}

function dbGet(pk: string, sk: string): InMemoryRecord | null {
    return database.get(getRecordKey(pk, sk)) || null;
}

function dbDelete(pk: string, sk: string): boolean {
    const key = getRecordKey(pk, sk);
    const record = database.get(key);
    if (record) {
        database.delete(key);
        // Clean up indexes
        if (record.gsi1pk) {
            const existing = gsi1Index.get(record.gsi1pk) || [];
            gsi1Index.set(record.gsi1pk, existing.filter(k => k !== key));
        }
        if (record.gsi2pk) {
            const existing = gsi2Index.get(record.gsi2pk) || [];
            gsi2Index.set(record.gsi2pk, existing.filter(k => k !== key));
        }
        return true;
    }
    return false;
}

function dbQueryByPk(pk: string): InMemoryRecord[] {
    const results: InMemoryRecord[] = [];
    database.forEach((record, key) => {
        if (key.startsWith(pk + '#')) {
            results.push(record);
        }
    });
    return results;
}

function dbQueryByGsi1(gsi1pk: string): InMemoryRecord[] {
    const keys = gsi1Index.get(gsi1pk) || [];
    return keys.map(k => database.get(k)).filter(r => r !== undefined) as InMemoryRecord[];
}

function dbQueryByGsi2(gsi2pk: string): InMemoryRecord[] {
    const keys = gsi2Index.get(gsi2pk) || [];
    return keys.map(k => database.get(k)).filter(r => r !== undefined) as InMemoryRecord[];
}

function dbScan(filters?: Record<string, any>): InMemoryRecord[] {
    const results: InMemoryRecord[] = [];
    database.forEach(record => {
        if (!filters || Object.keys(filters).length === 0) {
            results.push(record);
            return;
        }
        let match = true;
        for (const [key, value] of Object.entries(filters)) {
            if (record[key] !== value) {
                match = false;
                break;
            }
        }
        if (match) results.push(record);
    });
    return results;
}

function dbGetStats(): any {
    const clientes = new Set<string>();
    const cursos = new Set<string>();
    const participantes = new Set<string>();
    let totalConectados = 0;
    let totalDjEmitidas = 0;
    let montoTotalSence = 0;
    let montoTotalFacturar = 0;

    database.forEach(record => {
        if (record.idCliente) clientes.add(record.idCliente);
        if (record.codSence) cursos.add(record.codSence);
        if (record.rut) participantes.add(record.rut);
        if (record.conexSence === 1) totalConectados++;
        if (record.dj === 1) totalDjEmitidas++;
        if (record.montoSence) montoTotalSence += Number(record.montoSence) || 0;
        if (record.montoAFacturar) montoTotalFacturar += Number(record.montoAFacturar) || 0;
    });

    return {
        totalRegistros: database.size,
        totalClientes: clientes.size,
        totalCursos: cursos.size,
        totalParticipantes: participantes.size,
        totalConectados,
        totalDjEmitidas,
        montoTotalSence,
        montoTotalFacturar,
    };
}

// ============================================
// Load Excel Data
// ============================================

function loadExcelData(): number {
    console.log(`Loading Excel data from: ${EXCEL_FILE}`);

    try {
        const workbook = XLSX.readFile(EXCEL_FILE);
        const sheet = workbook.Sheets[SHEET_NAME];

        if (!sheet) {
            console.error(`Sheet "${SHEET_NAME}" not found`);
            return 0;
        }

        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
        console.log(`Found ${rows.length} rows in Excel`);

        let loaded = 0;
        for (const row of rows) {
            const item: Record<string, any> = {};

            for (const [excelCol, value] of Object.entries(row)) {
                const dynamoAttr = mapColumnName(excelCol);
                if (!dynamoAttr) continue;

                let parsedValue: any;
                if (['fechaInicio', 'fechaTermino', 'fechaHoy', 'fechaFacturacion', 'fechaEstimadaFacturacion', 'botProcessed'].includes(dynamoAttr)) {
                    parsedValue = parseExcelDate(value);
                } else if ([
                    'totalCliente', 'anioInicio', 'diasInicio', 'anioTermino', 'franquiciaPct',
                    'montoSence', 'costoEmpresa', 'inscritos', 'conexSence', 'pctConexion',
                    'dj', 'bajasConexion', 'bajasDj', 'pctDjp', 'montoReal', 'diasConexion',
                    'diasDjp', 'promedioDiasDjCliente', 'montoConexionSence', 'montoAFacturar',
                    'diasDuracionCurso', 'diasTotalesDj', 'mesNumero', 'conexBot', 'djBot',
                    'conexBotStatus', 'djBotStatus', 'botNumSesiones', 'actualizarConex', 'actualizarDj'
                ].includes(dynamoAttr)) {
                    parsedValue = parseNumber(value);
                } else if (dynamoAttr === 'rut') {
                    parsedValue = normalizeRut(value);
                } else {
                    parsedValue = parseString(value);
                }

                item[dynamoAttr] = parsedValue;
            }

            const codSence = parseString(item.codSence);
            const rut = item.rut;
            const idCliente = parseString(item.idCliente) || 'UNKNOWN';

            if (!codSence || !rut) continue;

            const now = new Date().toISOString();
            const record: InMemoryRecord = {
                pk: TableroKeys.pk(codSence),
                sk: TableroKeys.sk(rut),
                gsi1pk: TableroKeys.gsi1pk(idCliente),
                gsi1sk: TableroKeys.gsi1sk(codSence, rut),
                gsi2pk: TableroKeys.gsi2pk(rut),
                gsi2sk: TableroKeys.gsi2sk(codSence),
                codSence,
                rut,
                idCliente,
                createdAt: now,
                updatedAt: now,
                ...item,
            };

            dbPut(record);
            loaded++;
        }

        console.log(`Loaded ${loaded} records into memory`);
        return loaded;
    } catch (error) {
        console.error('Error loading Excel:', error);
        return 0;
    }
}

// ============================================
// HTTP Request Handlers
// ============================================

function jsonResponse(res: http.ServerResponse, statusCode: number, data: any): void {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end(JSON.stringify(data, null, 2));
}

function parseBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const method = req.method || 'GET';
    const parsedUrl = url.parse(req.url || '/', true);
    const pathname = parsedUrl.pathname || '/';
    const query = parsedUrl.query;

    console.log(`${method} ${pathname}`);

    // CORS preflight
    if (method === 'OPTIONS') {
        jsonResponse(res, 200, {});
        return;
    }

    try {
        // Root / Info
        if (pathname === '/' || pathname === '/tablero') {
            if (method === 'GET') {
                jsonResponse(res, 200, {
                    service: 'Tablero SENCE API (Local)',
                    version: '1.0.0',
                    mode: 'in-memory',
                    recordsLoaded: database.size,
                    endpoints: {
                        health: 'GET /tablero/health',
                        stats: 'GET /tablero/stats',
                        byCourse: 'GET /tablero/course/{codSence}',
                        byClient: 'GET /tablero/client/{idCliente}',
                        byParticipant: 'GET /tablero/participant/{rut}',
                        getRecord: 'GET /tablero/{codSence}/{rut}',
                        createRecord: 'POST /tablero',
                        updateRecord: 'PUT /tablero/{codSence}/{rut}',
                        deleteRecord: 'DELETE /tablero/{codSence}/{rut}',
                        batchUpdate: 'POST /tablero/batch-update',
                        search: 'GET /tablero/search?filters...',
                    },
                });
                return;
            }
            if (method === 'POST') {
                const body = await parseBody(req);
                if (!body.codSence || !body.rut || !body.idCliente) {
                    jsonResponse(res, 400, { success: false, error: 'codSence, rut, idCliente required' });
                    return;
                }
                const now = new Date().toISOString();
                const record: InMemoryRecord = {
                    pk: TableroKeys.pk(body.codSence),
                    sk: TableroKeys.sk(body.rut),
                    gsi1pk: TableroKeys.gsi1pk(body.idCliente),
                    gsi1sk: TableroKeys.gsi1sk(body.codSence, body.rut),
                    gsi2pk: TableroKeys.gsi2pk(body.rut),
                    gsi2sk: TableroKeys.gsi2sk(body.codSence),
                    createdAt: now,
                    updatedAt: now,
                    ...body,
                };
                dbPut(record);
                jsonResponse(res, 201, { success: true, record });
                return;
            }
        }

        // Health check
        if (pathname === '/tablero/health') {
            jsonResponse(res, 200, {
                status: 'healthy',
                service: 'tablero-sence-api-local',
                mode: 'in-memory',
                recordsLoaded: database.size,
                timestamp: new Date().toISOString(),
            });
            return;
        }

        // Stats
        if (pathname === '/tablero/stats') {
            jsonResponse(res, 200, { success: true, stats: dbGetStats() });
            return;
        }

        // Export all data as CSV
        if (pathname === '/tablero/export') {
            const allRecords = dbScan();

            // Define columns to export (excluding internal keys)
            const exportColumns = [
                'codSence', 'rut', 'idCliente', 'cliente', 'nombreCurso',
                'nombres', 'apellidos', 'correoPersonal',
                'coordinador', 'comercialACargo', 'otic', 'oc', 'idSence',
                'fechaInicio', 'mesInicio', 'anioInicio', 'fechaTermino', 'mesTermino', 'anioTermino',
                'franquiciaPct', 'montoSence', 'costoEmpresa',
                'inscritos', 'conexSence', 'pctConexion', 'dj',
                'bajasConexion', 'bajasDj', 'pctDjp', 'montoReal',
                'comentario', 'diasConexion', 'diasDjp', 'promedioDiasDjCliente',
                'montoConexionSence', 'montoAFacturar',
                'estadoOc', 'numeroFactura', 'fechaFacturacion', 'mesFacturacion',
                'diasDuracionCurso', 'fechaEstimadaFacturacion',
                'conexBot', 'djBot', 'conexBotStatus', 'djBotStatus',
                'botProcessed', 'botNumSesiones', 'actualizarConex', 'actualizarDj',
                'createdAt', 'updatedAt'
            ];

            // Build CSV
            const BOM = '\uFEFF';
            const csvRows = [exportColumns.join(',')];

            for (const record of allRecords) {
                const row = exportColumns.map(col => {
                    const value = record[col];
                    if (value === null || value === undefined) return '';
                    const str = String(value);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                });
                csvRows.push(row.join(','));
            }

            const csvContent = BOM + csvRows.join('\n');
            const timestamp = new Date().toISOString().split('T')[0];

            res.writeHead(200, {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="tablero_sence_${timestamp}.csv"`,
                'Access-Control-Allow-Origin': '*',
            });
            res.end(csvContent);
            return;
        }

        // Search
        if (pathname === '/tablero/search') {
            const filters: Record<string, any> = {};
            if (query.coordinador) filters.coordinador = query.coordinador;
            if (query.comercialACargo) filters.comercialACargo = query.comercialACargo;
            if (query.idCliente) filters.idCliente = query.idCliente;
            if (query.estadoOc) filters.estadoOc = query.estadoOc;
            if (query.mesInicio) filters.mesInicio = query.mesInicio;
            if (query.anioInicio) filters.anioInicio = parseInt(query.anioInicio as string);
            if (query.conexSence) filters.conexSence = parseInt(query.conexSence as string);
            if (query.dj) filters.dj = parseInt(query.dj as string);

            const limit = query.limit ? parseInt(query.limit as string) : 100;
            const items = dbScan(filters).slice(0, limit);
            jsonResponse(res, 200, { success: true, items, count: items.length });
            return;
        }

        // Batch update
        if (pathname === '/tablero/batch-update' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.items || !Array.isArray(body.items)) {
                jsonResponse(res, 400, { success: false, error: 'items array required' });
                return;
            }

            let success = 0;
            let failed = 0;
            for (const item of body.items) {
                const pk = TableroKeys.pk(item.codSence);
                const sk = TableroKeys.sk(item.rut);
                const existing = dbGet(pk, sk);
                if (existing) {
                    const updated = {
                        ...existing,
                        ...item.updates,
                        updatedAt: new Date().toISOString(),
                    };
                    dbPut(updated);
                    success++;
                } else {
                    failed++;
                }
            }
            jsonResponse(res, 200, { success: true, updated: success, failed });
            return;
        }

        // Query by course: /tablero/course/{codSence}
        const courseMatch = pathname.match(/^\/tablero\/course\/(.+)$/);
        if (courseMatch && method === 'GET') {
            const codSence = decodeURIComponent(courseMatch[1]);
            const items = dbQueryByPk(TableroKeys.pk(codSence));
            const limit = query.limit ? parseInt(query.limit as string) : undefined;
            const limited = limit ? items.slice(0, limit) : items;
            jsonResponse(res, 200, { success: true, items: limited, count: limited.length });
            return;
        }

        // Query by client: /tablero/client/{idCliente}
        const clientMatch = pathname.match(/^\/tablero\/client\/(.+)$/);
        if (clientMatch && method === 'GET') {
            const idCliente = decodeURIComponent(clientMatch[1]);
            const items = dbQueryByGsi1(TableroKeys.gsi1pk(idCliente));
            const limit = query.limit ? parseInt(query.limit as string) : undefined;
            const limited = limit ? items.slice(0, limit) : items;
            jsonResponse(res, 200, { success: true, items: limited, count: limited.length });
            return;
        }

        // Query by participant: /tablero/participant/{rut}
        const participantMatch = pathname.match(/^\/tablero\/participant\/(.+)$/);
        if (participantMatch && method === 'GET') {
            const rut = decodeURIComponent(participantMatch[1]);
            const items = dbQueryByGsi2(TableroKeys.gsi2pk(rut));
            const limit = query.limit ? parseInt(query.limit as string) : undefined;
            const limited = limit ? items.slice(0, limit) : items;
            jsonResponse(res, 200, { success: true, items: limited, count: limited.length });
            return;
        }

        // Single record: /tablero/{codSence}/{rut}
        const recordMatch = pathname.match(/^\/tablero\/([^/]+)\/([^/]+)$/);
        if (recordMatch) {
            const codSence = decodeURIComponent(recordMatch[1]);
            const rut = decodeURIComponent(recordMatch[2]);
            const pk = TableroKeys.pk(codSence);
            const sk = TableroKeys.sk(rut);

            if (method === 'GET') {
                const record = dbGet(pk, sk);
                if (!record) {
                    jsonResponse(res, 404, { success: false, error: 'Record not found' });
                    return;
                }
                jsonResponse(res, 200, { success: true, record });
                return;
            }

            if (method === 'PUT') {
                const body = await parseBody(req);
                const existing = dbGet(pk, sk);
                if (!existing) {
                    jsonResponse(res, 404, { success: false, error: 'Record not found' });
                    return;
                }
                const updated = {
                    ...existing,
                    ...(body.updates || body),
                    updatedAt: new Date().toISOString(),
                };
                dbPut(updated);
                jsonResponse(res, 200, { success: true, record: updated });
                return;
            }

            if (method === 'DELETE') {
                const deleted = dbDelete(pk, sk);
                if (!deleted) {
                    jsonResponse(res, 404, { success: false, error: 'Record not found' });
                    return;
                }
                jsonResponse(res, 200, { success: true, message: 'Record deleted' });
                return;
            }
        }

        // Not found
        jsonResponse(res, 404, { success: false, error: 'Endpoint not found', path: pathname });

    } catch (error: any) {
        console.error('Error:', error);
        jsonResponse(res, 500, { success: false, error: error.message });
    }
}

// ============================================
// Main
// ============================================

function main(): void {
    console.log('='.repeat(60));
    console.log('TABLERO SENCE - Local Development Server');
    console.log('='.repeat(60));

    // Load Excel data
    const loaded = loadExcelData();
    console.log(`Database initialized with ${loaded} records`);

    // Create server
    const server = http.createServer(handleRequest);

    server.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log(`Server running at http://localhost:${PORT}`);
        console.log('='.repeat(60));
        console.log('');
        console.log('Test endpoints:');
        console.log(`  curl http://localhost:${PORT}/tablero/health`);
        console.log(`  curl http://localhost:${PORT}/tablero/stats`);
        console.log(`  curl http://localhost:${PORT}/tablero/course/6749253`);
        console.log(`  curl http://localhost:${PORT}/tablero/search?conexSence=1`);
        console.log('');
        console.log('Press Ctrl+C to stop');
    });
}

main();
