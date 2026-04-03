import { APIGatewayProxyHandler } from 'aws-lambda';
import { SenceApiService } from '../../services/sence';
import { SenceProgressPayload } from '../../types';

export const syncProgress: APIGatewayProxyHandler = async (event) => {
    try {
        const body: SenceProgressPayload = typeof event.body === 'string'
            ? JSON.parse(event.body || '{}')
            : event.body;

        console.log('Sync Progress request:', body);

        // Basic validation
        if (!body.token || !body.listaAlumnos) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing token or student list' })
            };
        }

        // Send to Sence
        const senceResponse = await SenceApiService.sendProgress(body);

        // Here you would typically update your local DB with the 'id_proceso' returned by Sence

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Progress synced to Sence',
                senceResponse
            }),
        };

    } catch (error: any) {
        console.error('Error syncing progress:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error syncing progress',
                error: error.message,
                response: error.response?.data
            }),
        };
    }
};
