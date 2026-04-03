import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { scrapeCourseParticipants } from '../../services/lceScraper';
import { LCECredentials } from '../../types';

/**
 * Lambda handler to scrape course participants from SENCE LCE portal
 *
 * POST /sence/scrape/course
 * Body: {
 *   codigoCurso: string,       // Required: Course code to search
 *   credentials?: {            // Optional: Override env credentials
 *     rutOtec: string,
 *     password: string
 *   }
 * }
 *
 * Note: This endpoint is resource-intensive as it launches a browser.
 * Consider:
 * - Running on a schedule (cron) instead of on-demand
 * - Increasing Lambda timeout to 60+ seconds
 * - Using Lambda with more memory (1024MB+)
 */
export const getCourseParticipants = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        // Parse request body
        const body = event.body ? JSON.parse(event.body) : {};
        const { codigoCurso, credentials: bodyCredentials } = body;

        // Validate required fields
        if (!codigoCurso) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required field: codigoCurso',
                    errorCode: 'MISSING_FIELD',
                }),
            };
        }

        // Get credentials from body or environment
        const credentials: LCECredentials = {
            rutOtec: bodyCredentials?.rutOtec || process.env.SENCE_RUT_OTEC || '',
            rutRepLegal: bodyCredentials?.rutRepLegal || process.env.SENCE_RUT_REP_LEGAL || '',
            password: bodyCredentials?.password || process.env.SENCE_PASSWORD || '',
        };

        // Validate credentials
        if (!credentials.rutOtec || !credentials.password) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: false,
                    error: 'Missing credentials. Set SENCE_RUT_OTEC and SENCE_PASSWORD environment variables or pass in request body.',
                    errorCode: 'MISSING_CREDENTIALS',
                }),
            };
        }

        console.log(`[API] Scraping course: ${codigoCurso}`);

        // Run the scraper
        const result = await scrapeCourseParticipants(credentials, codigoCurso, {
            headless: true,
            screenshotOnError: false, // Don't save screenshots in Lambda
        });

        if (!result.success) {
            return {
                statusCode: result.errorCode === 'LOGIN_FAILED' ? 401 : 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result),
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result),
        };

    } catch (error) {
        console.error('[API] Error in getCourseParticipants:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
                errorCode: 'INTERNAL_ERROR',
            }),
        };
    }
};

/**
 * Lambda handler to get participants for multiple courses
 *
 * POST /sence/scrape/courses
 * Body: {
 *   codigosCurso: string[],    // Required: Array of course codes
 *   credentials?: { ... }      // Optional
 * }
 */
export const getMultipleCourseParticipants = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const { codigosCurso, credentials: bodyCredentials } = body;

        if (!codigosCurso || !Array.isArray(codigosCurso) || codigosCurso.length === 0) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required field: codigosCurso (array)',
                    errorCode: 'MISSING_FIELD',
                }),
            };
        }

        const credentials: LCECredentials = {
            rutOtec: bodyCredentials?.rutOtec || process.env.SENCE_RUT_OTEC || '',
            rutRepLegal: bodyCredentials?.rutRepLegal || process.env.SENCE_RUT_REP_LEGAL || '',
            password: bodyCredentials?.password || process.env.SENCE_PASSWORD || '',
        };

        if (!credentials.rutOtec || !credentials.password) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: false,
                    error: 'Missing credentials',
                    errorCode: 'MISSING_CREDENTIALS',
                }),
            };
        }

        console.log(`[API] Scraping ${codigosCurso.length} courses`);

        // Scrape each course sequentially (to avoid overloading)
        const results: { [codigoCurso: string]: any } = {};

        for (const codigo of codigosCurso) {
            console.log(`[API] Scraping course: ${codigo}`);
            results[codigo] = await scrapeCourseParticipants(credentials, codigo, {
                headless: true,
            });
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                results,
                totalCourses: codigosCurso.length,
                successCount: Object.values(results).filter((r: any) => r.success).length,
            }),
        };

    } catch (error) {
        console.error('[API] Error in getMultipleCourseParticipants:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
                errorCode: 'INTERNAL_ERROR',
            }),
        };
    }
};
