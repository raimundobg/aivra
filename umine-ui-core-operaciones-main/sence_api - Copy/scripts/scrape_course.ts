/**
 * Scrape Course Participants Script
 *
 * This script scrapes a specific course from the SENCE LCE portal
 * and outputs the data in a format ready for updating your TABLERO SENCE.
 *
 * Usage:
 *   npm run scrape:course -- --curso=6749253
 *
 * Or with credentials:
 *   npx ts-node scripts/scrape_course.ts --rut=76562778-8 --password=mypass --curso=6749253
 *
 * Output formats:
 *   --format=json  (default) JSON output
 *   --format=csv   CSV output for spreadsheet import
 *   --format=table Console table
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { scrapeCourseParticipants } from '../src/services/lceScraper';
import { LCECredentials, LCECourseParticipants, TableroSenceUpdate } from '../src/types';

dotenv.config();

interface ScriptArgs {
    rut?: string;
    password?: string;
    curso?: string;
    format?: 'json' | 'csv' | 'table';
    output?: string;
    headless?: boolean;
}

function parseArgs(): ScriptArgs {
    const args: { [key: string]: string } = {};
    process.argv.slice(2).forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.replace('--', '').split('=');
            if (key) {
                args[key] = value || 'true';
            }
        }
    });
    return {
        rut: args.rut,
        password: args.password,
        curso: args.curso,
        format: (args.format as 'json' | 'csv' | 'table') || 'json',
        output: args.output,
        headless: args.headless !== 'false',
    };
}

function generateCSV(data: LCECourseParticipants): string {
    const headers = [
        'RUT',
        'NOMBRE',
        'N_SESIONES',
        'CONEX_SENCE',
        'DJ',
        'ESTADO_DJ',
        'CODIGO_CURSO',
        'CODIGO_SENCE',
        'FECHA_CONSULTA'
    ];

    const rows = data.participants.map(p => [
        p.rutNormalized,
        `"${p.nombre}"`,
        p.numSesiones.toString(),
        p.conexSence.toString(),
        p.dj.toString(),
        p.estadoDeclaracionJurada,
        data.courseInfo.codigoCurso,
        data.courseInfo.codigoSence,
        data.scrapedAt
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function generateTable(data: LCECourseParticipants): string {
    const lines: string[] = [];
    const sep = '-'.repeat(110);

    lines.push(sep);
    lines.push(`Curso: ${data.courseInfo.nombreCurso}`);
    lines.push(`Código Curso: ${data.courseInfo.codigoCurso} | Código SENCE: ${data.courseInfo.codigoSence}`);
    lines.push(`Fecha consulta: ${data.scrapedAt}`);
    lines.push(sep);
    lines.push(
        'RUT'.padEnd(15) +
        'Nombre'.padEnd(35) +
        'Sesiones'.padEnd(10) +
        'CONEX'.padEnd(8) +
        'DJ'.padEnd(8) +
        'Estado DJ'
    );
    lines.push(sep);

    for (const p of data.participants) {
        lines.push(
            p.rutNormalized.padEnd(15) +
            p.nombre.substring(0, 33).padEnd(35) +
            p.numSesiones.toString().padEnd(10) +
            p.conexSence.toString().padEnd(8) +
            p.dj.toString().padEnd(8) +
            p.estadoDeclaracionJurada
        );
    }

    lines.push(sep);
    lines.push(`Total: ${data.totalParticipants} | Conectados: ${data.totalConectados} | DJ Emitidas: ${data.totalDJEmitidas}`);
    lines.push(sep);

    return lines.join('\n');
}

function generateTableroUpdates(data: LCECourseParticipants): TableroSenceUpdate[] {
    return data.participants.map(p => ({
        rut: p.rutNormalized,
        conexSence: p.conexSence,
        dj: p.dj,
        numSesiones: p.numSesiones,
        lastChecked: data.scrapedAt,
    }));
}

async function main() {
    const args = parseArgs();

    // Validate required args
    const credentials: LCECredentials = {
        rutOtec: args.rut || process.env.SENCE_RUT_OTEC || '',
        rutRepLegal: process.env.SENCE_RUT_REP_LEGAL || '',
        password: args.password || process.env.SENCE_PASSWORD || '',
    };

    const codigoCurso = args.curso;

    if (!credentials.rutOtec || !credentials.password) {
        console.error('Error: Missing credentials. Set SENCE_RUT_OTEC and SENCE_PASSWORD in .env or pass --rut and --password');
        process.exit(1);
    }

    if (!codigoCurso) {
        console.error('Error: Missing --curso argument');
        console.error('Usage: npm run scrape:course -- --curso=6749253');
        process.exit(1);
    }

    console.error(`Scraping course ${codigoCurso}...`);

    const result = await scrapeCourseParticipants(credentials, codigoCurso, {
        headless: args.headless ?? true,
        screenshotOnError: true,
    });

    if (!result.success || !result.data) {
        console.error(`Error: ${result.error} (${result.errorCode})`);
        process.exit(1);
    }

    // Generate output
    let output: string;
    switch (args.format) {
        case 'csv':
            output = generateCSV(result.data);
            break;
        case 'table':
            output = generateTable(result.data);
            break;
        case 'json':
        default:
            output = JSON.stringify(result.data, null, 2);
            break;
    }

    // Write to file or stdout
    if (args.output) {
        fs.writeFileSync(args.output, output);
        console.error(`Output written to ${args.output}`);
    } else {
        console.log(output);
    }

    // Also output tablero updates for easy integration
    if (args.format === 'json') {
        const updates = generateTableroUpdates(result.data);
        console.error('\n--- TABLERO Updates (for Google Sheets API) ---');
        console.error(JSON.stringify(updates, null, 2));
    }
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
