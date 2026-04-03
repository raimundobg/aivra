/**
 * Test script for SENCE LCE Portal with Clave Única login
 */
import { chromium } from 'playwright';

async function testClaveUnica() {
    const rut = '14507899-7';
    const password = 'TantaucO2006@';

    console.log('='.repeat(60));
    console.log('SENCE LCE Portal - Clave Única Login Test');
    console.log('='.repeat(60));
    console.log(`RUT: ${rut}`);
    console.log('');

    const browser = await chromium.launch({ headless: false, slowMo: 300 });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    try {
        // Step 1: Go to LCE portal
        console.log('1. Navigating to LCE portal...');
        await page.goto('https://lce.sence.cl/CertificadoAsistencia', { waitUntil: 'networkidle' });

        // Step 2: Click "Ingresar" to go to login options
        console.log('2. Clicking Ingresar button...');
        await page.click('button:has-text("Ingresar")');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Step 3: Click Clave Única button (option 1)
        console.log('3. Clicking Clave Única button...');
        // The button contains text "ClaveÚnica" - try multiple approaches
        const claveUnicaBtn = await page.$('text=ClaveÚnica')
            || await page.$('button >> text=ClaveÚnica')
            || await page.$('a >> text=ClaveÚnica')
            || await page.$('[class*="btn"] >> text=Clave');
        if (claveUnicaBtn) {
            await claveUnicaBtn.click();
        } else {
            // Try clicking by position - the first large button
            await page.click(':nth-match(button, 1)');
        }
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        console.log('   Current URL:', page.url());
        await page.screenshot({ path: 'cu_step3_clave_unica_page.png', fullPage: true });

        // Step 4: Fill in Clave Única credentials
        console.log('4. Looking for Clave Única login form...');

        // Analyze the page
        const inputs = await page.$$('input');
        console.log(`   Found ${inputs.length} input elements`);
        for (const input of inputs) {
            const name = await input.getAttribute('name') || '';
            const id = await input.getAttribute('id') || '';
            const type = await input.getAttribute('type') || '';
            const placeholder = await input.getAttribute('placeholder') || '';
            console.log(`   - Input: name="${name}", id="${id}", type="${type}", placeholder="${placeholder}"`);
        }

        // Try to fill RUT
        const rutSelectors = [
            'input[name="run"]',
            'input[name="rut"]',
            'input[id*="run"]',
            'input[id*="rut"]',
            'input[placeholder*="RUT"]',
            'input[placeholder*="RUN"]',
        ];

        let rutFilled = false;
        for (const selector of rutSelectors) {
            const el = await page.$(selector);
            if (el) {
                await el.fill(rut);
                console.log(`   Filled RUT with selector: ${selector}`);
                rutFilled = true;
                break;
            }
        }

        if (!rutFilled) {
            console.log('   WARNING: Could not find RUT input');
        }

        // Try to fill password
        const passInput = await page.$('input[type="password"]');
        if (passInput) {
            await passInput.fill(password);
            console.log('   Filled password');
        } else {
            console.log('   WARNING: Could not find password input');
        }

        await page.screenshot({ path: 'cu_step4_credentials_filled.png', fullPage: true });

        // Step 5: Click login button
        console.log('5. Looking for login button...');
        const loginBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Ingresar"), button:has-text("Continuar")');
        if (loginBtn) {
            await loginBtn.click();
            console.log('   Clicked login button');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(5000);
        }

        console.log('   Current URL after login:', page.url());
        await page.screenshot({ path: 'cu_step5_after_login.png', fullPage: true });

        // Check for errors
        const pageContent = await page.content();
        if (pageContent.toLowerCase().includes('error') || pageContent.toLowerCase().includes('incorrecto')) {
            console.log('   Possible error detected in page');
        }

        // Wait for inspection
        console.log('\n6. Waiting 15 seconds for visual inspection...');
        await page.waitForTimeout(15000);

    } catch (error) {
        console.error('Error:', error);
        await page.screenshot({ path: 'cu_error_screenshot.png', fullPage: true });
    } finally {
        await browser.close();
        console.log('\nTest complete. Check screenshots for results.');
    }
}

testClaveUnica().catch(console.error);
