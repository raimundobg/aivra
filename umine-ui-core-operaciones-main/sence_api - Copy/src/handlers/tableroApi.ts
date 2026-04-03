/**
 * TABLERO SENCE - Lambda API Handler
 *
 * API REST para el Tablero SENCE.
 * Expone endpoints para CRUD y actualizaciones del sync bot.
 *
 * Endpoints:
 *   GET  /tablero/health           - Health check
 *   GET  /tablero/stats            - Get statistics
 *   GET  /tablero/course/{codSence} - Get participants by course
 *   GET  /tablero/client/{idCliente} - Get courses by client
 *   GET  /tablero/participant/{rut}  - Get courses by participant
 *   GET  /tablero/{codSence}/{rut}   - Get single record
 *   POST /tablero                    - Create record
 *   PUT  /tablero/{codSence}/{rut}   - Update record
 *   DELETE /tablero/{codSence}/{rut} - Delete record
 *   POST /tablero/batch-update       - Batch update (for sync bot)
 *   POST /tablero/sync               - Trigger sync with SENCE API
 *
 * NOTA: Todo este codigo puede ser eliminado si es necesario.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TableroSenceService } from '../services/tableroSenceDynamo';
import { CreateTableroRecordInput, BatchUpdateInput, TableroFilters } from '../types/tableroSence';

// ============================================
// Helper Functions
// ============================================

const response = (statusCode: number, body: any): APIGatewayProxyResult => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(body),
});

const parseBody = <T>(event: APIGatewayProxyEvent): T | null => {
    try {
        if (!event.body) return null;
        return JSON.parse(event.body) as T;
    } catch {
        return null;
    }
};

const getPathParam = (event: APIGatewayProxyEvent, param: string): string | null => {
    return event.pathParameters?.[param] || null;
};

const getQueryParam = (event: APIGatewayProxyEvent, param: string): string | null => {
    return event.queryStringParameters?.[param] || null;
};

// ============================================
// Route Handlers
// ============================================

async function handleHealth(): Promise<APIGatewayProxyResult> {
    return response(200, {
        status: 'healthy',
        service: 'tablero-sence-api',
        timestamp: new Date().toISOString(),
    });
}

async function handleGetStats(): Promise<APIGatewayProxyResult> {
    try {
        const stats = await TableroSenceService.getStats();
        return response(200, { success: true, stats });
    } catch (error) {
        console.error('Error getting stats:', error);
        return response(500, { success: false, error: 'Error getting stats' });
    }
}

async function handleGetByCourse(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const codSence = getPathParam(event, 'codSence');
    if (!codSence) {
        return response(400, { success: false, error: 'codSence is required' });
    }

    try {
        const limit = getQueryParam(event, 'limit');
        const result = await TableroSenceService.queryByCourse(
            codSence,
            limit ? parseInt(limit) : undefined
        );
        return response(200, { success: true, ...result });
    } catch (error) {
        console.error('Error querying by course:', error);
        return response(500, { success: false, error: 'Error querying by course' });
    }
}

async function handleGetByClient(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const idCliente = getPathParam(event, 'idCliente');
    if (!idCliente) {
        return response(400, { success: false, error: 'idCliente is required' });
    }

    try {
        const limit = getQueryParam(event, 'limit');
        const result = await TableroSenceService.queryByClient(
            idCliente,
            limit ? parseInt(limit) : undefined
        );
        return response(200, { success: true, ...result });
    } catch (error) {
        console.error('Error querying by client:', error);
        return response(500, { success: false, error: 'Error querying by client' });
    }
}

async function handleGetByRut(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const rut = getPathParam(event, 'rut');
    if (!rut) {
        return response(400, { success: false, error: 'rut is required' });
    }

    try {
        const limit = getQueryParam(event, 'limit');
        const result = await TableroSenceService.queryByRut(
            decodeURIComponent(rut),
            limit ? parseInt(limit) : undefined
        );
        return response(200, { success: true, ...result });
    } catch (error) {
        console.error('Error querying by rut:', error);
        return response(500, { success: false, error: 'Error querying by rut' });
    }
}

async function handleGetRecord(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const codSence = getPathParam(event, 'codSence');
    const rut = getPathParam(event, 'rut');

    if (!codSence || !rut) {
        return response(400, { success: false, error: 'codSence and rut are required' });
    }

    try {
        const record = await TableroSenceService.get(codSence, decodeURIComponent(rut));
        if (!record) {
            return response(404, { success: false, error: 'Record not found' });
        }
        return response(200, { success: true, record });
    } catch (error) {
        console.error('Error getting record:', error);
        return response(500, { success: false, error: 'Error getting record' });
    }
}

async function handleCreateRecord(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const body = parseBody<CreateTableroRecordInput>(event);
    if (!body) {
        return response(400, { success: false, error: 'Invalid request body' });
    }

    if (!body.codSence || !body.rut || !body.idCliente) {
        return response(400, { success: false, error: 'codSence, rut, and idCliente are required' });
    }

    try {
        const record = await TableroSenceService.create(body);
        return response(201, { success: true, record });
    } catch (error) {
        console.error('Error creating record:', error);
        return response(500, { success: false, error: 'Error creating record' });
    }
}

async function handleUpdateRecord(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const codSence = getPathParam(event, 'codSence');
    const rut = getPathParam(event, 'rut');

    if (!codSence || !rut) {
        return response(400, { success: false, error: 'codSence and rut are required' });
    }

    const body = parseBody<{ updates: Record<string, any> }>(event);
    if (!body || !body.updates) {
        return response(400, { success: false, error: 'Invalid request body - updates required' });
    }

    try {
        const record = await TableroSenceService.update({
            codSence,
            rut: decodeURIComponent(rut),
            updates: body.updates,
        });

        if (!record) {
            return response(404, { success: false, error: 'Record not found' });
        }

        return response(200, { success: true, record });
    } catch (error) {
        console.error('Error updating record:', error);
        return response(500, { success: false, error: 'Error updating record' });
    }
}

async function handleDeleteRecord(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const codSence = getPathParam(event, 'codSence');
    const rut = getPathParam(event, 'rut');

    if (!codSence || !rut) {
        return response(400, { success: false, error: 'codSence and rut are required' });
    }

    try {
        await TableroSenceService.delete(codSence, decodeURIComponent(rut));
        return response(200, { success: true, message: 'Record deleted' });
    } catch (error) {
        console.error('Error deleting record:', error);
        return response(500, { success: false, error: 'Error deleting record' });
    }
}

async function handleBatchUpdate(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const body = parseBody<BatchUpdateInput>(event);
    if (!body || !body.items || !Array.isArray(body.items)) {
        return response(400, { success: false, error: 'Invalid request body - items array required' });
    }

    try {
        const result = await TableroSenceService.batchUpdate(body);
        return response(200, {
            success: true,
            ...result,
            message: `Updated ${result.success} records, ${result.failed} failed`,
        });
    } catch (error) {
        console.error('Error in batch update:', error);
        return response(500, { success: false, error: 'Error in batch update' });
    }
}

async function handleSearch(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const filters: TableroFilters = {};

    const coordinador = getQueryParam(event, 'coordinador');
    const comercialACargo = getQueryParam(event, 'comercialACargo');
    const idCliente = getQueryParam(event, 'idCliente');
    const estadoOc = getQueryParam(event, 'estadoOc');
    const mesInicio = getQueryParam(event, 'mesInicio');
    const anioInicio = getQueryParam(event, 'anioInicio');
    const conexSence = getQueryParam(event, 'conexSence');
    const dj = getQueryParam(event, 'dj');
    const limit = getQueryParam(event, 'limit');

    if (coordinador) filters.coordinador = coordinador;
    if (comercialACargo) filters.comercialACargo = comercialACargo;
    if (idCliente) filters.idCliente = idCliente;
    if (estadoOc) filters.estadoOc = estadoOc;
    if (mesInicio) filters.mesInicio = mesInicio;
    if (anioInicio) filters.anioInicio = parseInt(anioInicio);
    if (conexSence) filters.conexSence = parseInt(conexSence);
    if (dj) filters.dj = parseInt(dj);

    try {
        const result = await TableroSenceService.scanWithFilters(
            filters,
            limit ? parseInt(limit) : 100
        );
        return response(200, { success: true, ...result });
    } catch (error) {
        console.error('Error searching:', error);
        return response(500, { success: false, error: 'Error searching' });
    }
}

// ============================================
// Main Handler
// ============================================

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Event:', JSON.stringify(event, null, 2));

    const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
    const path = event.path || event.rawPath || '/';

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        return response(200, {});
    }

    try {
        // Route matching
        // Health check
        if (path.endsWith('/health')) {
            return handleHealth();
        }

        // Stats
        if (path.endsWith('/stats') && method === 'GET') {
            return handleGetStats();
        }

        // Search
        if (path.endsWith('/search') && method === 'GET') {
            return handleSearch(event);
        }

        // Batch update
        if (path.endsWith('/batch-update') && method === 'POST') {
            return handleBatchUpdate(event);
        }

        // Course query: /tablero/course/{codSence}
        const courseMatch = path.match(/\/course\/([^/]+)$/);
        if (courseMatch && method === 'GET') {
            event.pathParameters = { ...event.pathParameters, codSence: courseMatch[1] };
            return handleGetByCourse(event);
        }

        // Client query: /tablero/client/{idCliente}
        const clientMatch = path.match(/\/client\/([^/]+)$/);
        if (clientMatch && method === 'GET') {
            event.pathParameters = { ...event.pathParameters, idCliente: clientMatch[1] };
            return handleGetByClient(event);
        }

        // Participant query: /tablero/participant/{rut}
        const participantMatch = path.match(/\/participant\/([^/]+)$/);
        if (participantMatch && method === 'GET') {
            event.pathParameters = { ...event.pathParameters, rut: participantMatch[1] };
            return handleGetByRut(event);
        }

        // Single record: /tablero/{codSence}/{rut}
        const recordMatch = path.match(/\/tablero\/([^/]+)\/([^/]+)$/);
        if (recordMatch) {
            event.pathParameters = {
                ...event.pathParameters,
                codSence: recordMatch[1],
                rut: recordMatch[2],
            };

            switch (method) {
                case 'GET':
                    return handleGetRecord(event);
                case 'PUT':
                    return handleUpdateRecord(event);
                case 'DELETE':
                    return handleDeleteRecord(event);
            }
        }

        // Create record: POST /tablero
        if (path.endsWith('/tablero') && method === 'POST') {
            return handleCreateRecord(event);
        }

        // Root path - API info
        if (path === '/' || path === '/tablero' || path.endsWith('/tablero')) {
            if (method === 'GET') {
                return response(200, {
                    service: 'Tablero SENCE API',
                    version: '1.0.0',
                    endpoints: {
                        health: 'GET /tablero/health',
                        stats: 'GET /tablero/stats',
                        search: 'GET /tablero/search?filters...',
                        byCourse: 'GET /tablero/course/{codSence}',
                        byClient: 'GET /tablero/client/{idCliente}',
                        byParticipant: 'GET /tablero/participant/{rut}',
                        getRecord: 'GET /tablero/{codSence}/{rut}',
                        createRecord: 'POST /tablero',
                        updateRecord: 'PUT /tablero/{codSence}/{rut}',
                        deleteRecord: 'DELETE /tablero/{codSence}/{rut}',
                        batchUpdate: 'POST /tablero/batch-update',
                    },
                });
            }
        }

        // Not found
        return response(404, {
            success: false,
            error: 'Endpoint not found',
            path,
            method,
        });

    } catch (error) {
        console.error('Unhandled error:', error);
        return response(500, {
            success: false,
            error: 'Internal server error',
        });
    }
};

export default handler;
