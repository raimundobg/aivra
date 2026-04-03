/**
 * Test SENCE LCE Portal with OTEC credentials
 */
import { chromium } from 'playwright';

async function testOTEC() {
    const rut = '76562778-8';
    const password = 'W80063W7';
    const codigoCurso = '1238057511';

    console.log('='.repeat(60));
    console.log('SENCE LCE Portal - OTEC Login Test');
    console.log('='.repeat(60));
    console.log(`RUT OTEC: ${rut}`);
    console.log(`Course: ${codigoCurso}`);
    console.log('');

    const browser = await chromium.launch({ headless: false, slowMo: 300 });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    try {
        // Step 1: Go to LCE portal
        console.log('1. Navigating to LCE portal...');
        await page.goto('https://lce.sence.cl/CertificadoAsistencia', { waitUntil: 'networkidle' });

        // Step 2: Click Ingresar to go to login options
        console.log('2. Clicking Ingresar button...');
        await page.click('button:has-text("Ingresar")');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Step 3: Select OTEC from dropdown
        console.log('3. Selecting OTEC from dropdown...');
        const dropdown = await page.$('select');
        if (dropdown) {
            await dropdown.selectOption({ label: 'OTEC' });
            console.log('   Selected OTEC');
            await page.waitForTimeout(500);
        } else {
            console.log('   WARNING: Could not find dropdown');
        }

        // Step 4: Fill credentials
        console.log('4. Filling credentials...');
        const rutInput = await page.$('input[placeholder="RUT Usuario"]');
        if (rutInput) {
            await rutInput.fill(rut);
            console.log('   Filled RUT: ' + rut);
        } else {
            console.log('   WARNING: Could not find RUT input');
        }

        const passInput = await page.$('input[placeholder="Clave SENCE"]');
        if (passInput) {
            await passInput.fill(password);
            console.log('   Filled password');
        } else {
            console.log('   WARNING: Could not find password input');
        }

        await page.screenshot({ path: 'otec_1_credentials.png' });

        // Step 5: Click Ingresar
        console.log('5. Clicking Ingresar...');
        const buttons = await page.$$('button:has-text("Ingresar")');
        if (buttons.length > 0) {
            await buttons[buttons.length - 1].click();
            console.log('   Clicked login button');
        }

        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        console.log('   Current URL: ' + page.url());
        await page.screenshot({ path: 'otec_2_after_login.png', fullPage: true });

        // Check for error messages
        const pageContent = await page.content();
        if (pageContent.includes('NO AUTORIZADO') || pageContent.includes('error') || pageContent.includes('incorrecto')) {
            const errorEl = await page.$('.text-danger, .alert-danger');
            if (errorEl) {
                const errorText = await errorEl.textContent();
                console.log('   ERROR: ' + (errorText || '').trim());
            } else {
                console.log('   Possible error in page content');
            }
        } else {
            console.log('   No obvious error detected');
        }

        // Step 6: Click Ingresar on the GCA landing page
        console.log('6. Clicking Ingresar on GCA landing page...');
        const gcaIngresar = await page.$('button:has-text("Ingresar"), a:has-text("Ingresar")');
        if (gcaIngresar) {
            await gcaIngresar.click();
            console.log('   Clicked Ingresar');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
        }

        console.log('   Current URL: ' + page.url());
        await page.screenshot({ path: 'otec_3_after_gca_ingresar.png', fullPage: true });

        // Analyze search page
        const selects = await page.$$('select');
        console.log(`   Found ${selects.length} select elements`);
        for (const sel of selects) {
            const name = await sel.getAttribute('name') || '';
            const id = await sel.getAttribute('id') || '';
            console.log(`   - Select: name="${name}", id="${id}"`);
        }

        const inputs = await page.$$('input');
        console.log(`   Found ${inputs.length} input elements`);
        for (const inp of inputs) {
            const name = await inp.getAttribute('name') || '';
            const id = await inp.getAttribute('id') || '';
            const type = await inp.getAttribute('type') || '';
            const placeholder = await inp.getAttribute('placeholder') || '';
            if (type !== 'hidden') {
                console.log(`   - Input: name="${name}", id="${id}", type="${type}", placeholder="${placeholder}"`);
            }
        }

        // Step 7: Try to search for the course
        console.log(`\n7. Searching for course: ${codigoCurso}...`);

        // Look for course code input field
        const codigoInput = await page.$('input[name*="codigo"], input[id*="codigo"], input[placeholder*="Código"], input[type="text"]');
        if (codigoInput) {
            await codigoInput.fill(codigoCurso);
            console.log('   Filled course code');
        }

        // Click search button
        const searchBtn = await page.$('button:has-text("Buscar"), input[value="Buscar"], a:has-text("Buscar")');
        if (searchBtn) {
            await searchBtn.click();
            console.log('   Clicked Buscar');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
        }

        await page.screenshot({ path: 'otec_4_search_results.png', fullPage: true });
        console.log('   Current URL: ' + page.url());

        // Check for results or errors
        const resultContent = await page.content();
        if (resultContent.includes('No se encontr') || resultContent.includes('sin resultados')) {
            console.log('   No results found for this course');
        } else {
            console.log('   Search completed - check screenshot for results');
        }

        console.log('\n8. Waiting 15 seconds for inspection...');
        await page.waitForTimeout(15000);

    } catch (error) {
        console.error('Error:', error);
        await page.screenshot({ path: 'otec_error.png' });
    } finally {
        await browser.close();
        console.log('\nTest complete. Check screenshots.');
    }
}

testOTEC().catch(console.error);
