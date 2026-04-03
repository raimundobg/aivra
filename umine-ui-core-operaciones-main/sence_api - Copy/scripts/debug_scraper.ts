/**
 * Debug script to analyze the SENCE LCE Portal page structure
 */
import { chromium } from 'playwright';

async function debugPortal() {
    console.log('Starting debug session...\n');

    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    try {
        // Navigate to login page
        console.log('1. Navigating to https://lce.sence.cl/CertificadoAsistencia...');
        await page.goto('https://lce.sence.cl/CertificadoAsistencia', { waitUntil: 'networkidle' });

        console.log('   Current URL:', page.url());
        await page.screenshot({ path: 'debug_1_initial.png', fullPage: true });
        console.log('   Screenshot saved: debug_1_initial.png\n');

        // Analyze form elements
        console.log('2. Analyzing page structure...');

        const inputs = await page.$$('input');
        console.log(`   Found ${inputs.length} input elements:`);
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const name = await input.getAttribute('name') || 'no-name';
            const type = await input.getAttribute('type') || 'text';
            const id = await input.getAttribute('id') || 'no-id';
            const placeholder = await input.getAttribute('placeholder') || '';
            console.log(`   - Input #${i+1}: name="${name}", type="${type}", id="${id}", placeholder="${placeholder}"`);
        }

        const buttons = await page.$$('button, input[type="submit"]');
        console.log(`\n   Found ${buttons.length} buttons:`);
        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            const text = await btn.textContent();
            const type = await btn.getAttribute('type') || 'button';
            console.log(`   - Button #${i+1}: type="${type}", text="${(text || '').trim()}"`);
        }

        const selects = await page.$$('select');
        console.log(`\n   Found ${selects.length} select elements:`);
        for (let i = 0; i < selects.length; i++) {
            const sel = selects[i];
            const name = await sel.getAttribute('name') || 'no-name';
            const id = await sel.getAttribute('id') || 'no-id';
            console.log(`   - Select #${i+1}: name="${name}", id="${id}"`);
        }

        // Try to login with provided credentials
        console.log('\n3. Attempting login with credentials...');
        const rut = '14507899-7';
        const password = 'TantaucO2006@';

        // Look for RUT input - try various selectors
        const rutSelectors = [
            'input[name="rut"]',
            'input[id*="rut"]',
            'input[placeholder*="RUT"]',
            'input[name*="Rut"]',
            'input#txtRut',
            'input.rut',
        ];

        let rutInput = null;
        for (const selector of rutSelectors) {
            rutInput = await page.$(selector);
            if (rutInput) {
                console.log(`   Found RUT input with selector: ${selector}`);
                break;
            }
        }

        if (rutInput) {
            await rutInput.fill(rut);
            console.log(`   Filled RUT: ${rut}`);
            await page.screenshot({ path: 'debug_2_rut_filled.png', fullPage: true });
        } else {
            console.log('   WARNING: Could not find RUT input field!');
        }

        // Look for password input
        const passInput = await page.$('input[type="password"]');
        if (passInput) {
            await passInput.fill(password);
            console.log('   Filled password');
            await page.screenshot({ path: 'debug_3_pass_filled.png', fullPage: true });
        } else {
            console.log('   WARNING: Could not find password input field!');
        }

        // Find and click login button
        const loginSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Ingresar")',
            'button:has-text("Entrar")',
            'button:has-text("Login")',
            'a:has-text("Ingresar")',
        ];

        let loginBtn = null;
        for (const selector of loginSelectors) {
            loginBtn = await page.$(selector);
            if (loginBtn) {
                console.log(`   Found login button with selector: ${selector}`);
                break;
            }
        }

        if (loginBtn) {
            console.log('\n4. Clicking login button...');
            await loginBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);

            console.log('   Current URL after login:', page.url());
            await page.screenshot({ path: 'debug_4_after_login.png', fullPage: true });
            console.log('   Screenshot saved: debug_4_after_login.png');

            // Check for error messages
            const errorEl = await page.$('.error, .alert-danger, .alert-error, [class*="error"]');
            if (errorEl) {
                const errorText = await errorEl.textContent();
                console.log(`   ERROR MESSAGE FOUND: ${errorText}`);
            }
        } else {
            console.log('   WARNING: Could not find login button!');
        }

        // Wait and allow visual inspection
        console.log('\n5. Waiting 10 seconds for visual inspection...');
        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('Error during debug:', error);
        await page.screenshot({ path: 'debug_error.png', fullPage: true });
    } finally {
        await browser.close();
        console.log('\nDebug session complete. Check the screenshots.');
    }
}

debugPortal().catch(console.error);
