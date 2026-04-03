/**
 * MIGRATION SCRIPT: Excel BBDD 2025 → DynamoDB
 *
 * Este script lee el archivo Excel "Copia de TABLERO SENCE 2025 (1).xlsx"
 * y migra los datos a la tabla DynamoDB "tablero-sence-operaciones".
 *
 * USO:
 *   npx ts-node scripts/migrateExcelToDynamo.ts
 *
 * OPCIONES:
 *   --dry-run     Solo simula, no escribe en DynamoDB
 *   --limit=N     Limita a N registros
 *   --offset=N    Empieza desde el registro N
 *
 * PARA REVERTIR:
 *   1. Eliminar la tabla DynamoDB: aws dynamodb delete-table --table-name tablero-sence-operaciones
 *   2. O usar el endpoint DELETE /tablero/all (si implementado)
 *
 * NOTA: Todo este codigo puede ser eliminado si es necesario.
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    BatchWriteCommand,
    CreateTableCommand,
    DescribeTableCommand,
} from '@aws-sdk/lib-dynamodb';
import { CreateTableCommand as CreateTableCmd } from '@aws-sdk/client-dynamodb';
import { COLUMN_MAPPING, IGNORED_COLUMNS, TableroKeys } from '../src/types/tableroSence';

// ============================================
// Configuration
// ============================================

const TABLE_NAME = process.env.TABLERO_SENCE_TABLE || 'tablero-sence-operaciones';
const REGION = process.env.AWS_REGION || 'us-east-2';

// Excel file path - adjust as needed
const EXCEL_FILE = path.join(__dirname, '..', '..', 'Copia de TABLERO SENCE 2025 (1).xlsx');
const SHEET_NAME = 'BBDD 2025';

// Parse CLI arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0') || 0;
const OFFSET = parseInt(args.find(a => a.startsWith('--offset='))?.split('=')[1] || '0') || 0;

// DynamoDB client
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: true,
    },
});

// ============================================
// Helper Functions
// ============================================

/**
 * Normalize RUT format (remove dots, ensure hyphen)
 */
function normalizeRut(rut: any): string {
    if (!rut) return '';
    const rutStr = String(rut).trim().toUpperCase().replace(/\./g, '');
    if (!rutStr.includes('-') && rutStr.length > 1) {
        return rutStr.slice(0, -1) + '-' + rutStr.slice(-1);
    }
    return rutStr;
}

/**
 * Parse Excel date to ISO string
 */
function parseExcelDate(value: any): string | null {
    if (!value) return null;

    // If it's a number (Excel serial date)
    if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value);
        if (date) {
            return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }
    }

    // If it's already a string
    if (typeof value === 'string') {
        // Try to parse common date formats
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
        }
        return value;
    }

    return null;
}

/**
 * Parse numeric value
 */
function parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
}

/**
 * Parse string value
 */
function parseString(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;
    return String(value).trim();
}

/**
 * Map Excel column name to DynamoDB attribute name
 */
function mapColumnName(excelColumn: string): string | null {
    const mapped = COLUMN_MAPPING[excelColumn];
    if (!mapped) return null;
    if (IGNORED_COLUMNS.includes(mapped)) return null;
    return mapped;
}

/**
 * Transform Excel row to DynamoDB item
 */
function transformRow(row: Record<string, any>, rowIndex: number): Record<string, any> | null {
    const item: Record<string, any> = {};

    // Map all columns
    for (const [excelCol, value] of Object.entries(row)) {
        const dynamoAttr = mapColumnName(excelCol);
        if (!dynamoAttr) continue;

        // Determine value type based on attribute name
        let parsedValue: any;

        // Date fields
        if (['fechaInicio', 'fechaTermino', 'fechaHoy', 'fechaFacturacion', 'fechaEstimadaFacturacion', 'botProcessed'].includes(dynamoAttr)) {
            parsedValue = parseExcelDate(value);
        }
        // Numeric fields
        else if ([
            'totalCliente', 'anioInicio', 'diasInicio', 'anioTermino', 'franquiciaPct',
            'montoSence', 'costoEmpresa', 'inscritos', 'conexSence', 'pctConexion',
            'dj', 'bajasConexion', 'bajasDj', 'pctDjp', 'montoReal', 'diasConexion',
            'diasDjp', 'promedioDiasDjCliente', 'montoConexionSence', 'montoAFacturar',
            'diasDuracionCurso', 'diasTotalesDj', 'mesNumero', 'conexBot', 'djBot',
            'conexBotStatus', 'djBotStatus', 'botNumSesiones', 'actualizarConex', 'actualizarDj'
        ].includes(dynamoAttr)) {
            parsedValue = parseNumber(value);
        }
        // RUT normalization
        else if (dynamoAttr === 'rut') {
            parsedValue = normalizeRut(value);
        }
        // String fields
        else {
            parsedValue = parseString(value);
        }

        item[dynamoAttr] = parsedValue;
    }

    // Validate required fields
    const codSence = parseString(item.codSence);
    const rut = item.rut;
    const idCliente = parseString(item.idCliente);

    if (!codSence || !rut) {
        console.warn(`Row ${rowIndex + 2}: Skipping - missing codSence or rut`);
        return null;
    }

    // Use a default idCliente if missing
    const finalIdCliente = idCliente || 'UNKNOWN';

    // Build DynamoDB keys
    const now = new Date().toISOString();

    return {
        // DynamoDB keys
        pk: TableroKeys.pk(codSence),
        sk: TableroKeys.sk(rut),
        gsi1pk: TableroKeys.gsi1pk(finalIdCliente),
        gsi1sk: TableroKeys.gsi1sk(codSence, rut),
        gsi2pk: TableroKeys.gsi2pk(rut),
        gsi2sk: TableroKeys.gsi2sk(codSence),

        // Required fields
        codSence,
        rut,
        idCliente: finalIdCliente,

        // All other fields
        ...item,

        // Audit fields
        createdAt: now,
        updatedAt: now,
    };
}

// ============================================
// DynamoDB Table Creation
// ============================================

async function ensureTableExists(): Promise<void> {
    try {
        await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
        console.log(`Table ${TABLE_NAME} exists`);
    } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
            console.log(`Creating table ${TABLE_NAME}...`);

            await client.send(new CreateTableCmd({
                TableName: TABLE_NAME,
                BillingMode: 'PAY_PER_REQUEST',
                AttributeDefinitions: [
                    { AttributeName: 'pk', AttributeType: 'S' },
                    { AttributeName: 'sk', AttributeType: 'S' },
                    { AttributeName: 'gsi1pk', AttributeType: 'S' },
                    { AttributeName: 'gsi1sk', AttributeType: 'S' },
                    { AttributeName: 'gsi2pk', AttributeType: 'S' },
                    { AttributeName: 'gsi2sk', AttributeType: 'S' },
                ],
                KeySchema: [
                    { AttributeName: 'pk', KeyType: 'HASH' },
                    { AttributeName: 'sk', KeyType: 'RANGE' },
                ],
                GlobalSecondaryIndexes: [
                    {
                        IndexName: 'gsi1-client',
                        KeySchema: [
                            { AttributeName: 'gsi1pk', KeyType: 'HASH' },
                            { AttributeName: 'gsi1sk', KeyType: 'RANGE' },
                        ],
                        Projection: { ProjectionType: 'ALL' },
                    },
                    {
                        IndexName: 'gsi2-rut',
                        KeySchema: [
                            { AttributeName: 'gsi2pk', KeyType: 'HASH' },
                            { AttributeName: 'gsi2sk', KeyType: 'RANGE' },
                        ],
                        Projection: { ProjectionType: 'ALL' },
                    },
                ],
            }));

            console.log(`Table ${TABLE_NAME} created. Waiting for it to become active...`);

            // Wait for table to be active
            let tableActive = false;
            while (!tableActive) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                const desc = await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
                tableActive = desc.Table?.TableStatus === 'ACTIVE';
            }

            console.log(`Table ${TABLE_NAME} is now active`);
        } else {
            throw error;
        }
    }
}

// ============================================
// Migration Logic
// ============================================

async function writeBatch(items: Record<string, any>[]): Promise<{ success: number; failed: number }> {
    if (DRY_RUN) {
        return { success: items.length, failed: 0 };
    }

    const BATCH_SIZE = 25;
    let success = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);

        const putRequests = batch.map(item => ({
            PutRequest: { Item: item },
        }));

        try {
            await docClient.send(new BatchWriteCommand({
                RequestItems: {
                    [TABLE_NAME]: putRequests,
                },
            }));
            success += batch.length;
        } catch (error) {
            console.error(`Batch write failed:`, error);
            failed += batch.length;
        }
    }

    return { success, failed };
}

async function migrate(): Promise<void> {
    console.log('='.repeat(60));
    console.log('TABLERO SENCE - Excel to DynamoDB Migration');
    console.log('='.repeat(60));
    console.log(`Excel file: ${EXCEL_FILE}`);
    console.log(`Sheet: ${SHEET_NAME}`);
    console.log(`Table: ${TABLE_NAME}`);
    console.log(`Region: ${REGION}`);
    console.log(`Dry run: ${DRY_RUN}`);
    if (LIMIT) console.log(`Limit: ${LIMIT}`);
    if (OFFSET) console.log(`Offset: ${OFFSET}`);
    console.log('='.repeat(60));

    // Read Excel file
    console.log('\nReading Excel file...');
    let workbook: XLSX.WorkBook;
    try {
        workbook = XLSX.readFile(EXCEL_FILE);
    } catch (error) {
        console.error(`Error reading Excel file: ${error}`);
        process.exit(1);
    }

    const sheet = workbook.Sheets[SHEET_NAME];
    if (!sheet) {
        console.error(`Sheet "${SHEET_NAME}" not found. Available sheets:`, workbook.SheetNames);
        process.exit(1);
    }

    // Convert to JSON
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
    console.log(`Total rows in Excel: ${rows.length}`);

    // Apply offset and limit
    let rowsToProcess = rows;
    if (OFFSET > 0) {
        rowsToProcess = rowsToProcess.slice(OFFSET);
    }
    if (LIMIT > 0) {
        rowsToProcess = rowsToProcess.slice(0, LIMIT);
    }
    console.log(`Rows to process: ${rowsToProcess.length}`);

    // Transform rows
    console.log('\nTransforming rows...');
    const items: Record<string, any>[] = [];
    let skipped = 0;

    for (let i = 0; i < rowsToProcess.length; i++) {
        const transformed = transformRow(rowsToProcess[i], OFFSET + i);
        if (transformed) {
            items.push(transformed);
        } else {
            skipped++;
        }

        // Progress update
        if ((i + 1) % 1000 === 0) {
            console.log(`  Processed ${i + 1} rows...`);
        }
    }

    console.log(`Transformed: ${items.length} items`);
    console.log(`Skipped: ${skipped} rows`);

    if (items.length === 0) {
        console.log('\nNo items to write. Exiting.');
        return;
    }

    // Ensure table exists
    if (!DRY_RUN) {
        console.log('\nChecking DynamoDB table...');
        await ensureTableExists();
    }

    // Write to DynamoDB
    console.log('\nWriting to DynamoDB...');
    const startTime = Date.now();
    const { success, failed } = await writeBatch(items);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total processed: ${items.length}`);
    console.log(`Successful writes: ${success}`);
    console.log(`Failed writes: ${failed}`);
    console.log(`Duration: ${duration}s`);
    console.log('='.repeat(60));

    if (DRY_RUN) {
        console.log('\n[DRY RUN] No data was written to DynamoDB');
        console.log('Run without --dry-run to perform actual migration');
    }

    // Show sample item
    if (items.length > 0) {
        console.log('\nSample item:');
        console.log(JSON.stringify(items[0], null, 2));
    }
}

// ============================================
// Main
// ============================================

migrate().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
});
