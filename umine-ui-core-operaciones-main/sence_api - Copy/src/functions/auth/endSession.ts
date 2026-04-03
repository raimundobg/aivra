import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoService } from '../../services/dynamo';
import { SenceEndSessionBody } from '../../types';

export const endSession: APIGatewayProxyHandler = async (event) => {
    try {
        // Sence sends data as Form URL Encoded usually for browser redirects, 
        // but this generic handler assumes it might be JSON or parsed body.
        // If receiving application/x-www-form-urlencoded, we might need a parser middleware or manual parsing.
        // For now, assuming JSON/Parsed for simplicity or that API Gateway handles it.

        // Note: If Sence does a browser POST, the body is x-www-form-urlencoded.
        // We'll add a safe parse check.
        let body: SenceEndSessionBody;

        if (event.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
            const params = new URLSearchParams(event.body || '');
            body = Object.fromEntries(params.entries()) as any as SenceEndSessionBody;
        } else {
            body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : event.body;
        }

        console.log('End Session received:', body);

        if (body.IdSesionAlumno) {
            await DynamoService.updateSessionEnd(body.IdSesionAlumno, body.FechaHora || new Date().toISOString());
        }

        // Return HTML to user as this is likely a browser redirect end
        const htmlResponse = `
      <html>
        <body>
          <h1>Session Ended</h1>
          <p>Student: ${body.RunAlumno}</p>
          <p>Result: Success</p>
          <p>You may close this window.</p>
        </body>
      </html>
    `;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: htmlResponse,
        };

    } catch (error) {
        console.error('Error ending session:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
