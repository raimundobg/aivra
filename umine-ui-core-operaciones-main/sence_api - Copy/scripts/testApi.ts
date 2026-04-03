/**
 * TABLERO SENCE - API Test Script
 *
 * Script para probar la API del Tablero SENCE.
 * Ejecutar DESPUES de iniciar el servidor local.
 *
 * USO:
 *   1. En una terminal: npx ts-node scripts/localServer.ts
 *   2. En otra terminal: npx ts-node scripts/testApi.ts
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001';

// ============================================
// Test Cases
// ============================================

interface TestResult {
    name: string;
    success: boolean;
    duration: number;
    data?: any;
    error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    const start = Date.now();
    try {
        const data = await testFn();
        results.push({
            name,
            success: true,
            duration: Date.now() - start,
            data,
        });
        console.log(`  ✓ ${name} (${Date.now() - start}ms)`);
    } catch (error: any) {
        results.push({
            name,
            success: false,
            duration: Date.now() - start,
            error: error.message,
        });
        console.log(`  ✗ ${name} - ${error.message}`);
    }
}

// ============================================
// Tests
// ============================================

async function testHealthCheck(): Promise<any> {
    const response = await axios.get(`${API_URL}/tablero/health`);
    if (response.data.status !== 'healthy') throw new Error('Not healthy');
    return response.data;
}

async function testGetStats(): Promise<any> {
    const response = await axios.get(`${API_URL}/tablero/stats`);
    if (!response.data.success) throw new Error('Stats failed');
    if (response.data.stats.totalRegistros === 0) throw new Error('No records loaded');
    return response.data.stats;
}

async function testQueryByCourse(): Promise<any> {
    // First get stats to find a valid course
    const statsResponse = await axios.get(`${API_URL}/tablero/stats`);
    if (statsResponse.data.stats.totalCursos === 0) throw new Error('No courses');

    // Query a known course code from the Excel
    const response = await axios.get(`${API_URL}/tablero/course/6749253`);
    if (!response.data.success) throw new Error('Query failed');
    return {
        count: response.data.count,
        sampleRecord: response.data.items?.[0] ? {
            rut: response.data.items[0].rut,
            nombres: response.data.items[0].nombres,
            conexSence: response.data.items[0].conexSence,
        } : null,
    };
}

async function testQueryByClient(): Promise<any> {
    // Query by a client ID
    const response = await axios.get(`${API_URL}/tablero/client/1`, { timeout: 5000 });
    return {
        success: response.data.success,
        count: response.data.count || 0,
    };
}

async function testQueryByRut(): Promise<any> {
    // First get a record to find a valid RUT
    const courseResponse = await axios.get(`${API_URL}/tablero/course/6749253?limit=1`);
    if (courseResponse.data.items?.length === 0) {
        return { skipped: true, reason: 'No records to test' };
    }

    const testRut = courseResponse.data.items[0].rut;
    const response = await axios.get(`${API_URL}/tablero/participant/${encodeURIComponent(testRut)}`);
    return {
        rut: testRut,
        coursesFound: response.data.count,
    };
}

async function testGetSingleRecord(): Promise<any> {
    // Get a specific record
    const courseResponse = await axios.get(`${API_URL}/tablero/course/6749253?limit=1`);
    if (courseResponse.data.items?.length === 0) {
        return { skipped: true, reason: 'No records to test' };
    }

    const record = courseResponse.data.items[0];
    const response = await axios.get(
        `${API_URL}/tablero/${record.codSence}/${encodeURIComponent(record.rut)}`
    );

    if (!response.data.success) throw new Error('Get record failed');
    return {
        found: true,
        codSence: response.data.record.codSence,
        rut: response.data.record.rut,
    };
}

async function testUpdateRecord(): Promise<any> {
    // Get a record to update
    const courseResponse = await axios.get(`${API_URL}/tablero/course/6749253?limit=1`);
    if (courseResponse.data.items?.length === 0) {
        return { skipped: true, reason: 'No records to test' };
    }

    const record = courseResponse.data.items[0];
    const originalConexBot = record.conexBot;

    // Update the record
    const response = await axios.put(
        `${API_URL}/tablero/${record.codSence}/${encodeURIComponent(record.rut)}`,
        {
            updates: {
                conexBot: 1,
                djBot: 1,
                botProcessed: new Date().toISOString(),
            },
        }
    );

    if (!response.data.success) throw new Error('Update failed');

    return {
        updated: true,
        codSence: record.codSence,
        rut: record.rut,
        conexBotBefore: originalConexBot,
        conexBotAfter: response.data.record.conexBot,
    };
}

async function testBatchUpdate(): Promise<any> {
    // Get some records to batch update
    const courseResponse = await axios.get(`${API_URL}/tablero/course/6749253?limit=3`);
    if (courseResponse.data.items?.length === 0) {
        return { skipped: true, reason: 'No records to test' };
    }

    const items = courseResponse.data.items.map((r: any) => ({
        codSence: r.codSence,
        rut: r.rut,
        updates: {
            conexBot: 1,
            actualizarConex: 0,
        },
    }));

    const response = await axios.post(`${API_URL}/tablero/batch-update`, { items });

    if (!response.data.success) throw new Error('Batch update failed');
    return {
        attempted: items.length,
        updated: response.data.updated,
        failed: response.data.failed,
    };
}

async function testSearchWithFilters(): Promise<any> {
    // Search for connected participants
    const response = await axios.get(`${API_URL}/tablero/search?conexSence=1&limit=10`);
    if (!response.data.success) throw new Error('Search failed');

    return {
        filter: 'conexSence=1',
        found: response.data.count,
        sample: response.data.items?.[0] ? {
            rut: response.data.items[0].rut,
            nombres: response.data.items[0].nombres,
        } : null,
    };
}

async function testSearchByDj(): Promise<any> {
    // Search for DJ issued
    const response = await axios.get(`${API_URL}/tablero/search?dj=1&limit=10`);
    if (!response.data.success) throw new Error('Search failed');

    return {
        filter: 'dj=1',
        found: response.data.count,
    };
}

// ============================================
// Evaluation: Simulate SENCE Bot Update
// ============================================

async function testSenceBotSimulation(): Promise<any> {
    console.log('\n  Simulating SENCE Bot workflow...');

    // 1. Get current stats
    const beforeStats = (await axios.get(`${API_URL}/tablero/stats`)).data.stats;

    // 2. "Fetch" data from SENCE API (simulated)
    const senceApiData = [
        { rut: '12345678-9', conexSence: 1, dj: 1, numSesiones: 5 },
        { rut: '98765432-1', conexSence: 1, dj: 0, numSesiones: 3 },
    ];

    // 3. Find records that need updating
    const courseRecords = (await axios.get(`${API_URL}/tablero/course/6749253`)).data.items || [];

    // 4. Compare and update
    const updates: any[] = [];
    for (const record of courseRecords.slice(0, 5)) {
        // Simulate: mark as updated by bot
        updates.push({
            codSence: record.codSence,
            rut: record.rut,
            updates: {
                conexBot: 1,
                botProcessed: new Date().toISOString(),
                actualizarConex: record.conexSence === 0 ? 1 : 0,
            },
        });
    }

    if (updates.length > 0) {
        await axios.post(`${API_URL}/tablero/batch-update`, { items: updates });
    }

    // 5. Get after stats
    const afterStats = (await axios.get(`${API_URL}/tablero/stats`)).data.stats;

    return {
        recordsProcessed: updates.length,
        beforeStats: {
            totalConectados: beforeStats.totalConectados,
            totalDjEmitidas: beforeStats.totalDjEmitidas,
        },
        afterStats: {
            totalConectados: afterStats.totalConectados,
            totalDjEmitidas: afterStats.totalDjEmitidas,
        },
    };
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
    console.log('='.repeat(60));
    console.log('TABLERO SENCE - API Test Suite');
    console.log('='.repeat(60));
    console.log(`Testing API at: ${API_URL}`);
    console.log('');

    // Check if server is running
    try {
        await axios.get(`${API_URL}/tablero/health`, { timeout: 2000 });
    } catch {
        console.error('ERROR: Local server is not running!');
        console.error('');
        console.error('Please start the server first:');
        console.error('  npx ts-node scripts/localServer.ts');
        process.exit(1);
    }

    console.log('Running tests...\n');

    // Basic tests
    console.log('Basic Operations:');
    await runTest('Health Check', testHealthCheck);
    await runTest('Get Stats', testGetStats);

    // Query tests
    console.log('\nQuery Operations:');
    await runTest('Query by Course', testQueryByCourse);
    await runTest('Query by Client', testQueryByClient);
    await runTest('Query by RUT', testQueryByRut);
    await runTest('Get Single Record', testGetSingleRecord);

    // Update tests
    console.log('\nUpdate Operations:');
    await runTest('Update Record', testUpdateRecord);
    await runTest('Batch Update', testBatchUpdate);

    // Search tests
    console.log('\nSearch Operations:');
    await runTest('Search conexSence=1', testSearchWithFilters);
    await runTest('Search dj=1', testSearchByDj);

    // Simulation test
    console.log('\nSENCE Bot Simulation:');
    await runTest('Bot Workflow Simulation', testSenceBotSimulation);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalTime = results.reduce((acc, r) => acc + r.duration, 0);

    console.log(`Total: ${results.length} tests`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Duration: ${totalTime}ms`);
    console.log('');

    // Show failed tests
    if (failed > 0) {
        console.log('Failed tests:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.name}: ${r.error}`);
        });
    }

    // Show some sample data
    console.log('\n' + '='.repeat(60));
    console.log('SAMPLE DATA FROM TESTS');
    console.log('='.repeat(60));

    const statsTest = results.find(r => r.name === 'Get Stats');
    if (statsTest?.data) {
        console.log('\nTablero Stats:');
        console.log(JSON.stringify(statsTest.data, null, 2));
    }

    const courseTest = results.find(r => r.name === 'Query by Course');
    if (courseTest?.data) {
        console.log('\nCourse Query Sample:');
        console.log(JSON.stringify(courseTest.data, null, 2));
    }

    const botTest = results.find(r => r.name === 'Bot Workflow Simulation');
    if (botTest?.data) {
        console.log('\nBot Simulation Result:');
        console.log(JSON.stringify(botTest.data, null, 2));
    }

    console.log('\n' + '='.repeat(60));
    console.log('API TEST COMPLETE');
    console.log('='.repeat(60));

    process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
