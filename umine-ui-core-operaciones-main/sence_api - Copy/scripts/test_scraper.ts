/**
 * Test Script for SENCE LCE Portal Scraper
 *
 * This script allows you to test the scraper locally with your credentials.
 *
 * Usage:
 *   1. Copy .env.example to .env and fill in your credentials
 *   2. Run: npm run scrape:test
 *
 * Or run with command line args:
 *   npx ts-node scripts/test_scraper.ts --rut=76562778-8 --password=mypass --curso=6749253
 */

import * as dotenv from 'dotenv';
import { scrapeCourseParticipants } from '../src/services/lceScraper';
import { LCECredentials } from '../src/types';

// Load environment variables
dotenv.config();

// Parse command line arguments
function parseArgs(): { rut?: string; password?: string; curso?: string; headless?: boolean } {
    const args: { [key: string]: string } = {};
    process.argv.slice(2).forEach(arg => {
        const [key, value] = arg.replace('--', '').split('=');
        if (key && value) {
            args[key] = value;
        }
    });
    return {
        rut: args.rut,
        password: args.password,
        curso: args.curso,
        headless: args.headless !== 'false',
    };
}

async function main() {
    console.log('='.repeat(60));
    console.log('SENCE LCE Portal Scraper Test');
    console.log('='.repeat(60));

    const args = parseArgs();

    // Get credentials from env or args
    const credentials: LCECredentials = {
        rutOtec: args.rut || process.env.SENCE_RUT_OTEC || '',
        rutRepLegal: process.env.SENCE_RUT_REP_LEGAL || '',
        password: args.password || process.env.SENCE_PASSWORD || '',
    };

    const codigoCurso = args.curso || process.env.TEST_CODIGO_CURSO || '6749253';
    const headless = args.headless ?? true;

    // Validate credentials
    if (!credentials.rutOtec || !credentials.password) {
        console.error('\nError: Missing credentials!');
        console.error('\nPlease either:');
        console.error('  1. Create a .env file with SENCE_RUT_OTEC and SENCE_PASSWORD');
        console.error('  2. Or pass them as arguments: --rut=76562778-8 --password=mypass');
        console.error('\nExample:');
        console.error('  npx ts-node scripts/test_scraper.ts --rut=76562778-8 --password=mypass --curso=6749253');
        process.exit(1);
    }

    console.log(`\nConfiguration:`);
    console.log(`  RUT OTEC: ${credentials.rutOtec}`);
    console.log(`  Password: ${'*'.repeat(credentials.password.length)}`);
    console.log(`  Código Curso: ${codigoCurso}`);
    console.log(`  Headless: ${headless}`);
    console.log('');

    // Run the scraper
    console.log('Starting scraper...\n');

    const result = await scrapeCourseParticipants(credentials, codigoCurso, {
        headless,
        screenshotOnError: true,
    });

    if (result.success && result.data) {
        console.log('\n' + '='.repeat(60));
        console.log('SUCCESS! Course data retrieved');
        console.log('='.repeat(60));

        const { courseInfo, participants, totalParticipants, totalConectados, totalDJEmitidas } = result.data;

        console.log('\nCourse Information:');
        console.log(`  Código Curso: ${courseInfo.codigoCurso}`);
        console.log(`  Código SENCE: ${courseInfo.codigoSence}`);
        console.log(`  Nombre: ${courseInfo.nombreCurso}`);
        console.log(`  Horas Acreditadas: ${courseInfo.horasAcreditadas}`);
        console.log(`  Fecha Inicio: ${courseInfo.fechaInicio}`);
        console.log(`  Fecha Término: ${courseInfo.fechaTermino}`);
        console.log(`  Estado: ${courseInfo.estado}`);

        console.log('\nSummary:');
        console.log(`  Total Participantes: ${totalParticipants}`);
        console.log(`  Total Conectados (CONEX_SENCE=1): ${totalConectados}`);
        console.log(`  Total DJ Emitidas (DJ=1): ${totalDJEmitidas}`);
        console.log(`  Sin Conexión: ${totalParticipants - totalConectados}`);
        console.log(`  DJ Pendientes: ${totalParticipants - totalDJEmitidas}`);

        console.log('\nParticipants:');
        console.log('-'.repeat(100));
        console.log(
            'RUT'.padEnd(15) +
            'Nombre'.padEnd(30) +
            'Sesiones'.padEnd(10) +
            'CONEX'.padEnd(8) +
            'DJ'.padEnd(8) +
            'Estado DJ'
        );
        console.log('-'.repeat(100));

        for (const p of participants) {
            console.log(
                p.rutNormalized.padEnd(15) +
                p.nombre.substring(0, 28).padEnd(30) +
                p.numSesiones.toString().padEnd(10) +
                p.conexSence.toString().padEnd(8) +
                p.dj.toString().padEnd(8) +
                p.estadoDeclaracionJurada
            );
        }

        console.log('-'.repeat(100));

        // Output as JSON for easy copy-paste
        console.log('\nJSON Output (for integration):');
        console.log(JSON.stringify(result.data, null, 2));

        // Generate CSV-ready output
        console.log('\nCSV Output (RUT,CONEX_SENCE,DJ,N_SESIONES):');
        for (const p of participants) {
            console.log(`${p.rutNormalized},${p.conexSence},${p.dj},${p.numSesiones}`);
        }

    } else {
        console.error('\n' + '='.repeat(60));
        console.error('FAILED!');
        console.error('='.repeat(60));
        console.error(`Error: ${result.error}`);
        console.error(`Error Code: ${result.errorCode}`);
        console.error('\nCheck the screenshot files for debugging.');
    }
}

// Run
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
