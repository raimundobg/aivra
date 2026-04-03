/**
 * Test script for SENCE LCE Portal with Clave SENCE login
 */
import { chromium } from 'playwright';

async function testClaveSence() {
    const rut = '14507899-7';
    const password = 'TantaucO2006@';
    const codigoCurso = '6749253';

    console.log('='.repeat(60));
    console.log('SENCE LCE Portal - Clave SENCE Login Test');
    console.log('='.repeat(60));
    console.log(`RUT: ${rut}`);
    console.log(`Course: ${codigoCurso}`);
    console.log('');

    const browser = await chromium.launch({ headless: false, slowMo: 300 });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    try {
        // Step 1: Go to LCE portal
        console.log('1. Navigating to LCE portal...');
        await page.goto('https://lce.sence.cl/CertificadoAsistencia', { waitUntil: 'networkidle' });
        await page.screenshot({ path: 'step1_lce_portal.png' });

        // Step 2: Click "Ingresar" to go to login options
        console.log('2. Clicking Ingresar button...');
        await page.click('button:has-text("Ingresar")');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'step2_login_options.png' });

        // Step 3: Use "Clave SENCE" login (option 3)
        console.log('3. Using Clave SENCE login method...');

        // Fill RUT Usuario
        const rutInput = await page.$('input[placeholder="RUT Usuario"]');
        if (rutInput) {
            await rutInput.fill(rut);
            console.log('   Filled RUT Usuario');
        } else {
            console.log('   WARNING: Could not find RUT Usuario input');
        }

        // Fill Clave SENCE (password)
        const passInput = await page.$('input[placeholder="Clave SENCE"]');
        if (passInput) {
            await passInput.fill(password);
            console.log('   Filled Clave SENCE');
        } else {
            console.log('   WARNING: Could not find Clave SENCE input');
        }

        await page.screenshot({ path: 'step3_credentials_filled.png' });

        // Step 4: Click Ingresar button for Clave SENCE
        console.log('4. Clicking login button...');
        // Find the Ingresar button in the Clave SENCE section
        const loginButtons = await page.$$('button:has-text("Ingresar")');
        if (loginButtons.length > 0) {
            // Click the last one (the one for Clave SENCE form)
            await loginButtons[loginButtons.length - 1].click();
        }

        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'step4_after_login.png' });

        console.log('   Current URL:', page.url());

        // Check for error messages
        const errorEl = await page.$('.error, .alert-danger, .alert-error, [class*="error"], .text-danger');
        if (errorEl) {
            const errorText = await errorEl.textContent();
            console.log(`   ERROR: ${errorText}`);
        }

        // Step 5: If logged in, navigate to search
        if (page.url().includes('BusquedaAccion') || page.url().includes('CertificadoAsistencia')) {
            console.log('5. Login successful! Navigating to search...');

            // Look for search elements
            await page.goto('https://lce.sence.cl/CertificadoAsistencia/BusquedaAccion', { waitUntil: 'networkidle' });
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'step5_search_page.png' });

            // Analyze the search page
            console.log('\n   Analyzing search page...');
            const selects = await page.$$('select');
            console.log(`   Found ${selects.length} select elements`);

            const inputs = await page.$$('input');
            console.log(`   Found ${inputs.length} input elements`);
        }

        // Wait for inspection
        console.log('\n6. Waiting 15 seconds for visual inspection...');
        await page.waitForTimeout(15000);

    } catch (error) {
        console.error('Error:', error);
        await page.screenshot({ path: 'error_screenshot.png' });
    } finally {
        await browser.close();
        console.log('\nTest complete. Check screenshots for results.');
    }
}

testClaveSence().catch(console.error);
