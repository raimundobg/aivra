import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoService } from '../../services/dynamo'; // Import from parent relative path
import { SessionRecord, SenceStartSessionBody } from '../../types';

export const startSession: APIGatewayProxyHandler = async (event) => {
    try {
        const body: SenceStartSessionBody = typeof event.body === 'string'
            ? JSON.parse(event.body || '{}')
            : event.body;

        console.log('Start Session received:', body);

        // Validate required fields (basic validation)
        if (!body.RunAlumno || !body.RutOtec || !body.IdSesionAlumno) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required parameters' }),
            };
        }

        const sessionRecord: SessionRecord = {
            pk: `SESSION#${body.IdSesionAlumno}`,
            sk: 'METADATA',
            rutOtec: body.RutOtec,
            codSence: body.CodSence,
            runAlumno: body.RunAlumno,
            startTime: new Date().toISOString(),
            status: 'ACTIVE',
            senceToken: body.Token,
        };

        await DynamoService.saveSession(sessionRecord);

        // In a real app, you might redirect to the actual course content here.
        // For this API implementation, we return success.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Session started successfully',
                sessionId: body.IdSesionAlumno,
                redirectUrl: `/course/${body.CodigoCurso}/play`
            }),
        };

    } catch (error) {
        console.error('Error starting session:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
