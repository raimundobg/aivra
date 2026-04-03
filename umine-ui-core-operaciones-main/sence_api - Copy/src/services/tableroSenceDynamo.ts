/**
 * TABLERO SENCE - DynamoDB Service
 *
 * Capa de datos para la tabla independiente del Tablero SENCE.
 * Almacena los 69 campos del Excel BBDD 2025.
 *
 * Tabla: tablero-sence-operaciones
 *
 * NOTA: Todo este código puede ser eliminado si es necesario.
 * Para borrar: eliminar tabla DynamoDB + eliminar Lambda + eliminar este archivo
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    QueryCommand,
    UpdateCommand,
    DeleteCommand,
    BatchWriteCommand,
    ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import {
    TableroSenceRecord,
    TableroKeys,
    CreateTableroRecordInput,
    UpdateTableroRecordInput,
    TableroQueryResult,
    TableroStats,
    TableroFilters,
    BatchUpdateInput,
    IGNORED_COLUMNS,
} from '../types/tableroSence';

// ============================================
// Configuration
// ============================================

const TABLE_NAME = process.env.TABLERO_SENCE_TABLE || 'tablero-sence-operaciones';
const REGION = process.env.AWS_REGION || 'us-east-2';

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: true,
    },
});

// ============================================
// CRUD Operations
// ============================================

export const TableroSenceService = {
    /**
     * Create a new record in the tablero
     */
    async create(input: CreateTableroRecordInput): Promise<TableroSenceRecord> {
        const { codSence, rut, idCliente, ...rest } = input;

        if (!codSence || !rut || !idCliente) {
            throw new Error('codSence, rut, and idCliente are required');
        }

        const now = new Date().toISOString();

        const item: TableroSenceRecord = {
            // DynamoDB Keys
            pk: TableroKeys.pk(codSence),
            sk: TableroKeys.sk(rut),
            gsi1pk: TableroKeys.gsi1pk(idCliente),
            gsi1sk: TableroKeys.gsi1sk(codSence, rut),
            gsi2pk: TableroKeys.gsi2pk(rut),
            gsi2sk: TableroKeys.gsi2sk(codSence),

            // Required fields
            codSence,
            rut,

            // Default null values for all optional fields
            coordinador: null,
            comercialACargo: null,
            idCliente: idCliente,
            cliente: null,
            totalCliente: null,
            otic: null,
            oc: null,
            idSence: null,
            nombreCurso: null,
            fechaInicio: null,
            mesInicio: null,
            anioInicio: null,
            diasInicio: null,
            fechaTermino: null,
            mesTermino: null,
            anioTermino: null,
            franquiciaPct: null,
            montoSence: null,
            costoEmpresa: null,
            inscritos: null,
            nombres: null,
            apellidos: null,
            correoPersonal: null,
            conexSence: null,
            pctConexion: null,
            dj: null,
            bajasConexion: null,
            bajasDj: null,
            pctDjp: null,
            montoReal: null,
            comentario: null,
            fechaHoy: null,
            diasConexion: null,
            diasDjp: null,
            promedioDiasDjCliente: null,
            montoConexionSence: null,
            montoAFacturar: null,
            estadoOc: null,
            numeroFactura: null,
            fechaFacturacion: null,
            mesFacturacion: null,
            diasDuracionCurso: null,
            fechaEstimadaFacturacion: null,
            diasTotalesDj: null,
            mes: null,
            mesNumero: null,
            idCurso: null,
            linkCarpetaBaja: null,
            semanaEstimadaFacturacion: null,
            supervisado: null,
            aportanteRse: null,
            djFlag: null,
            genero: null,
            grupo: null,
            idComercial: null,
            conexBot: null,
            djBot: null,
            conexBotStatus: null,
            djBotStatus: null,
            botProcessed: null,
            botNumSesiones: null,
            actualizarConex: null,
            actualizarDj: null,

            // Audit fields
            createdAt: now,
            updatedAt: now,

            // Spread any additional fields
            ...rest,
        };

        // Remove ignored columns
        IGNORED_COLUMNS.forEach(col => {
            delete (item as any)[col];
        });

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
        }));

        return item;
    },

    /**
     * Get a single record by codSence and rut
     */
    async get(codSence: string, rut: string): Promise<TableroSenceRecord | null> {
        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                pk: TableroKeys.pk(codSence),
                sk: TableroKeys.sk(rut),
            },
        }));

        return (result.Item as TableroSenceRecord) || null;
    },

    /**
     * Update a record
     */
    async update(input: UpdateTableroRecordInput): Promise<TableroSenceRecord | null> {
        const { codSence, rut, updates } = input;

        if (Object.keys(updates).length === 0) {
            return this.get(codSence, rut);
        }

        const now = new Date().toISOString();

        // Build update expression
        const updateExpressionParts: string[] = ['#updatedAt = :updatedAt'];
        const expressionAttributeNames: Record<string, string> = {
            '#updatedAt': 'updatedAt',
        };
        const expressionAttributeValues: Record<string, any> = {
            ':updatedAt': now,
        };

        Object.entries(updates).forEach(([key, value]) => {
            // Skip ignored columns
            if (IGNORED_COLUMNS.includes(key)) return;

            const attrName = `#${key}`;
            const attrValue = `:${key}`;
            updateExpressionParts.push(`${attrName} = ${attrValue}`);
            expressionAttributeNames[attrName] = key;
            expressionAttributeValues[attrValue] = value;
        });

        const result = await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                pk: TableroKeys.pk(codSence),
                sk: TableroKeys.sk(rut),
            },
            UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        }));

        return (result.Attributes as TableroSenceRecord) || null;
    },

    /**
     * Delete a record
     */
    async delete(codSence: string, rut: string): Promise<boolean> {
        await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                pk: TableroKeys.pk(codSence),
                sk: TableroKeys.sk(rut),
            },
        }));
        return true;
    },

    /**
     * Query participants by course (codSence)
     */
    async queryByCourse(codSence: string, limit?: number, lastKey?: Record<string, any>): Promise<TableroQueryResult> {
        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk',
            ExpressionAttributeValues: {
                ':pk': TableroKeys.pk(codSence),
            },
            Limit: limit,
            ExclusiveStartKey: lastKey,
        }));

        return {
            items: (result.Items as TableroSenceRecord[]) || [],
            count: result.Count || 0,
            scannedCount: result.ScannedCount || 0,
            lastEvaluatedKey: result.LastEvaluatedKey,
        };
    },

    /**
     * Query courses by client (using GSI1)
     */
    async queryByClient(idCliente: string, limit?: number, lastKey?: Record<string, any>): Promise<TableroQueryResult> {
        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'gsi1-client',
            KeyConditionExpression: 'gsi1pk = :gsi1pk',
            ExpressionAttributeValues: {
                ':gsi1pk': TableroKeys.gsi1pk(idCliente),
            },
            Limit: limit,
            ExclusiveStartKey: lastKey,
        }));

        return {
            items: (result.Items as TableroSenceRecord[]) || [],
            count: result.Count || 0,
            scannedCount: result.ScannedCount || 0,
            lastEvaluatedKey: result.LastEvaluatedKey,
        };
    },

    /**
     * Query all courses for a participant by RUT (using GSI2)
     */
    async queryByRut(rut: string, limit?: number, lastKey?: Record<string, any>): Promise<TableroQueryResult> {
        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'gsi2-rut',
            KeyConditionExpression: 'gsi2pk = :gsi2pk',
            ExpressionAttributeValues: {
                ':gsi2pk': TableroKeys.gsi2pk(rut),
            },
            Limit: limit,
            ExclusiveStartKey: lastKey,
        }));

        return {
            items: (result.Items as TableroSenceRecord[]) || [],
            count: result.Count || 0,
            scannedCount: result.ScannedCount || 0,
            lastEvaluatedKey: result.LastEvaluatedKey,
        };
    },

    /**
     * Batch write records (for migration)
     */
    async batchWrite(records: CreateTableroRecordInput[]): Promise<{ success: number; failed: number }> {
        const BATCH_SIZE = 25; // DynamoDB limit
        let success = 0;
        let failed = 0;

        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);

            const putRequests = batch.map(record => {
                const now = new Date().toISOString();
                const { codSence, rut, idCliente, ...rest } = record;

                const item = {
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
                    ...rest,
                };

                // Remove ignored columns
                IGNORED_COLUMNS.forEach(col => {
                    delete (item as any)[col];
                });

                return {
                    PutRequest: {
                        Item: item,
                    },
                };
            });

            try {
                await docClient.send(new BatchWriteCommand({
                    RequestItems: {
                        [TABLE_NAME]: putRequests,
                    },
                }));
                success += batch.length;
            } catch (error) {
                console.error(`Batch write failed for items ${i}-${i + batch.length}:`, error);
                failed += batch.length;
            }
        }

        return { success, failed };
    },

    /**
     * Batch update records (for sync bot updates)
     */
    async batchUpdate(input: BatchUpdateInput): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        for (const item of input.items) {
            try {
                await this.update({
                    codSence: item.codSence,
                    rut: item.rut,
                    updates: item.updates,
                });
                success++;
            } catch (error) {
                console.error(`Update failed for ${item.codSence}/${item.rut}:`, error);
                failed++;
            }
        }

        return { success, failed };
    },

    /**
     * Get statistics for the tablero
     */
    async getStats(): Promise<TableroStats> {
        let totalRegistros = 0;
        const clientes = new Set<string>();
        const cursos = new Set<string>();
        const participantes = new Set<string>();
        let totalConectados = 0;
        let totalDjEmitidas = 0;
        let montoTotalSence = 0;
        let montoTotalFacturar = 0;

        let lastKey: Record<string, any> | undefined;

        do {
            const result = await docClient.send(new ScanCommand({
                TableName: TABLE_NAME,
                ExclusiveStartKey: lastKey,
                ProjectionExpression: 'idCliente, codSence, rut, conexSence, dj, montoSence, montoAFacturar',
            }));

            for (const item of (result.Items || [])) {
                totalRegistros++;

                if (item.idCliente) clientes.add(item.idCliente);
                if (item.codSence) cursos.add(item.codSence);
                if (item.rut) participantes.add(item.rut);

                if (item.conexSence === 1) totalConectados++;
                if (item.dj === 1) totalDjEmitidas++;

                if (item.montoSence) montoTotalSence += Number(item.montoSence) || 0;
                if (item.montoAFacturar) montoTotalFacturar += Number(item.montoAFacturar) || 0;
            }

            lastKey = result.LastEvaluatedKey;
        } while (lastKey);

        return {
            totalRegistros,
            totalClientes: clientes.size,
            totalCursos: cursos.size,
            totalParticipantes: participantes.size,
            totalConectados,
            totalDjEmitidas,
            montoTotalSence,
            montoTotalFacturar,
        };
    },

    /**
     * Scan with filters (use sparingly - prefer queries)
     */
    async scanWithFilters(filters: TableroFilters, limit?: number, lastKey?: Record<string, any>): Promise<TableroQueryResult> {
        const filterExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        if (filters.coordinador) {
            filterExpressions.push('#coordinador = :coordinador');
            expressionAttributeNames['#coordinador'] = 'coordinador';
            expressionAttributeValues[':coordinador'] = filters.coordinador;
        }

        if (filters.comercialACargo) {
            filterExpressions.push('#comercialACargo = :comercialACargo');
            expressionAttributeNames['#comercialACargo'] = 'comercialACargo';
            expressionAttributeValues[':comercialACargo'] = filters.comercialACargo;
        }

        if (filters.idCliente) {
            filterExpressions.push('#idCliente = :idCliente');
            expressionAttributeNames['#idCliente'] = 'idCliente';
            expressionAttributeValues[':idCliente'] = filters.idCliente;
        }

        if (filters.estadoOc) {
            filterExpressions.push('#estadoOc = :estadoOc');
            expressionAttributeNames['#estadoOc'] = 'estadoOc';
            expressionAttributeValues[':estadoOc'] = filters.estadoOc;
        }

        if (filters.mesInicio) {
            filterExpressions.push('#mesInicio = :mesInicio');
            expressionAttributeNames['#mesInicio'] = 'mesInicio';
            expressionAttributeValues[':mesInicio'] = filters.mesInicio;
        }

        if (filters.anioInicio !== undefined) {
            filterExpressions.push('#anioInicio = :anioInicio');
            expressionAttributeNames['#anioInicio'] = 'anioInicio';
            expressionAttributeValues[':anioInicio'] = filters.anioInicio;
        }

        if (filters.conexSence !== undefined) {
            filterExpressions.push('#conexSence = :conexSence');
            expressionAttributeNames['#conexSence'] = 'conexSence';
            expressionAttributeValues[':conexSence'] = filters.conexSence;
        }

        if (filters.dj !== undefined) {
            filterExpressions.push('#dj = :dj');
            expressionAttributeNames['#dj'] = 'dj';
            expressionAttributeValues[':dj'] = filters.dj;
        }

        const result = await docClient.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined,
            ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
            ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
            Limit: limit,
            ExclusiveStartKey: lastKey,
        }));

        return {
            items: (result.Items as TableroSenceRecord[]) || [],
            count: result.Count || 0,
            scannedCount: result.ScannedCount || 0,
            lastEvaluatedKey: result.LastEvaluatedKey,
        };
    },

    /**
     * Delete all records (USE WITH CAUTION - for cleanup only)
     */
    async deleteAll(): Promise<{ deleted: number }> {
        let deleted = 0;
        let lastKey: Record<string, any> | undefined;

        do {
            const result = await docClient.send(new ScanCommand({
                TableName: TABLE_NAME,
                ProjectionExpression: 'pk, sk',
                ExclusiveStartKey: lastKey,
            }));

            const items = result.Items || [];

            for (let i = 0; i < items.length; i += 25) {
                const batch = items.slice(i, i + 25);
                const deleteRequests = batch.map(item => ({
                    DeleteRequest: {
                        Key: {
                            pk: item.pk,
                            sk: item.sk,
                        },
                    },
                }));

                await docClient.send(new BatchWriteCommand({
                    RequestItems: {
                        [TABLE_NAME]: deleteRequests,
                    },
                }));

                deleted += batch.length;
            }

            lastKey = result.LastEvaluatedKey;
        } while (lastKey);

        return { deleted };
    },
};

export default TableroSenceService;
