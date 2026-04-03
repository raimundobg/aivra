import { chromium, Browser, Page, BrowserContext } from 'playwright';
import {
    LCECredentials,
    LCECourseInfo,
    LCEParticipant,
    LCECourseParticipants,
    LCEScrapeResult,
} from '../types';

// Portal URLs
const LCE_BASE_URL = 'https://lce.sence.cl';
const LCE_LOGIN_URL = `${LCE_BASE_URL}/CertificadoAsistencia`;
const LCE_SEARCH_URL = `${LCE_BASE_URL}/CertificadoAsistencia/BusquedaAccion`;

// Timeouts
const DEFAULT_TIMEOUT = 30000;
const NAVIGATION_TIMEOUT = 60000;

export class LCEScraperService {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private _isLoggedIn: boolean = false;
    private credentials: LCECredentials;

    constructor(credentials: LCECredentials) {
        this.credentials = credentials;
    }

    get isLoggedIn(): boolean {
        return this._isLoggedIn;
    }

    /**
     * Initialize browser and login to LCE portal
     */
    async initialize(headless: boolean = true): Promise<void> {
        console.log('[LCE] Initializing browser...');

        this.browser = await chromium.launch({
            headless,
            slowMo: headless ? 0 : 100, // Slow down for debugging when not headless
        });

        this.context = await this.browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });

        this.page = await this.context.newPage();
        this.page.setDefaultTimeout(DEFAULT_TIMEOUT);
        this.page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);

        console.log('[LCE] Browser initialized');
    }

    /**
     * Login to the LCE portal
     */
    async login(): Promise<boolean> {
        if (!this.page) {
            throw new Error('Browser not initialized. Call initialize() first.');
        }

        console.log('[LCE] Navigating to login page...');

        try {
            // Navigate to the login page
            await this.page.goto(LCE_LOGIN_URL, { waitUntil: 'networkidle' });

            // Wait for the login form
            console.log('[LCE] Waiting for login form...');

            // The SENCE portal typically has a login form with RUT and password fields
            // Check if we need to click a login button first or if we're already on the form

            // Wait for the page to load and check for login elements
            await this.page.waitForLoadState('domcontentloaded');

            // Look for the RUT input field - SENCE portals usually have this
            const rutInput = await this.page.$('input[name="rut"], input[id*="rut"], input[placeholder*="RUT"]');

            if (rutInput) {
                console.log('[LCE] Found login form, entering credentials...');

                // Fill RUT OTEC
                await this.page.fill('input[name="rut"], input[id*="rut"]', this.credentials.rutOtec);

                // Fill password
                const passwordInput = await this.page.$('input[type="password"]');
                if (passwordInput) {
                    await passwordInput.fill(this.credentials.password);
                }

                // Click login button
                const loginButton = await this.page.$('button[type="submit"], input[type="submit"], button:has-text("Ingresar"), button:has-text("Entrar")');
                if (loginButton) {
                    await loginButton.click();
                    await this.page.waitForLoadState('networkidle');
                }
            }

            // Check if login was successful by looking for elements that appear after login
            // or by checking if we're redirected to a dashboard
            await this.page.waitForTimeout(2000);

            const currentUrl = this.page.url();
            console.log('[LCE] Current URL after login attempt:', currentUrl);

            // Check for error messages
            const errorMessage = await this.page.$('.error, .alert-danger, [class*="error"]');
            if (errorMessage) {
                const errorText = await errorMessage.textContent();
                console.error('[LCE] Login error:', errorText);
                return false;
            }

            this._isLoggedIn = true;
            console.log('[LCE] Login successful');
            return true;

        } catch (error) {
            console.error('[LCE] Login failed:', error);
            return false;
        }
    }

    /**
     * Search for a course and get participant data
     */
    async getCourseParticipants(codigoCurso: string): Promise<LCEScrapeResult> {
        if (!this.page) {
            return { success: false, error: 'Browser not initialized', errorCode: 'NOT_INITIALIZED' };
        }

        console.log(`[LCE] Searching for course: ${codigoCurso}`);

        try {
            // Navigate to search page
            await this.page.goto(LCE_SEARCH_URL, { waitUntil: 'networkidle' });
            await this.page.waitForLoadState('domcontentloaded');

            // Select "Franquicia Tributaria E-Learning" from dropdown
            console.log('[LCE] Selecting Línea de Capacitación...');
            const lineaSelect = await this.page.$('select[name*="Linea"], select[id*="linea"], select:has-text("Línea")');
            if (lineaSelect) {
                await lineaSelect.selectOption({ label: 'Franquicia Tributaria E-Learning' });
                await this.page.waitForTimeout(500);
            }

            // Select "Curso" as criteria
            console.log('[LCE] Selecting Criterio: Curso...');
            const criterioSelect = await this.page.$('select[name*="Criterio"], select[id*="criterio"]');
            if (criterioSelect) {
                await criterioSelect.selectOption({ label: 'Curso' });
                await this.page.waitForTimeout(500);
            }

            // Enter Código Curso
            console.log('[LCE] Entering Código Curso...');
            const codigoInput = await this.page.$('input[name*="Codigo"], input[id*="codigo"], input[placeholder*="Código"]');
            if (codigoInput) {
                await codigoInput.fill(codigoCurso);
            }

            // Click Buscar button
            console.log('[LCE] Clicking Buscar...');
            const buscarButton = await this.page.$('button:has-text("Buscar"), input[value="Buscar"], a:has-text("Buscar")');
            if (buscarButton) {
                await buscarButton.click();
                await this.page.waitForLoadState('networkidle');
            }

            // Wait for results
            await this.page.waitForTimeout(2000);

            // Check if we got results
            const noResults = await this.page.$('text="No se encontraron resultados", text="Sin resultados"');
            if (noResults) {
                return { success: false, error: 'No course found with that code', errorCode: 'COURSE_NOT_FOUND' };
            }

            // Click on the course row to see details (if needed)
            const courseRow = await this.page.$(`tr:has-text("${codigoCurso}"), [data-codigo="${codigoCurso}"]`);
            if (courseRow) {
                await courseRow.click();
                await this.page.waitForLoadState('networkidle');
                await this.page.waitForTimeout(1000);
            }

            // Extract course information
            const courseInfo = await this.extractCourseInfo(codigoCurso);

            // Extract participants
            const participants = await this.extractParticipants();

            // Calculate totals
            const totalConectados = participants.filter(p => p.conexSence === 1).length;
            const totalDJEmitidas = participants.filter(p => p.dj === 1).length;

            const result: LCECourseParticipants = {
                courseInfo,
                participants,
                scrapedAt: new Date().toISOString(),
                totalParticipants: participants.length,
                totalConectados,
                totalDJEmitidas,
            };

            console.log(`[LCE] Found ${participants.length} participants`);
            console.log(`[LCE] Conectados: ${totalConectados}, DJ Emitidas: ${totalDJEmitidas}`);

            return { success: true, data: result };

        } catch (error) {
            console.error('[LCE] Error getting course participants:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                errorCode: 'SCRAPE_ERROR'
            };
        }
    }

    /**
     * Extract course information from the detail page
     */
    private async extractCourseInfo(codigoCurso: string): Promise<LCECourseInfo> {
        if (!this.page) {
            throw new Error('Page not available');
        }

        const courseInfo: LCECourseInfo = {
            codigoCurso,
            codigoSence: '',
            nombreCurso: '',
            programa: 'Franquicia Tributaria E-Learning',
            horasAcreditadas: 0,
            fechaInicio: '',
            fechaTermino: '',
            estado: '',
        };

        try {
            // Try to extract various fields - adjust selectors based on actual page structure
            const _extractText = async (selector: string): Promise<string> => {
                const element = await this.page!.$(selector);
                return element ? (await element.textContent() || '').trim() : '';
            };
            void _extractText; // Suppress unused warning

            // These selectors need to be adjusted based on actual page structure
            // Looking at the screenshots, the data is in a table or definition list format

            // Try common patterns for extracting labeled data
            const labels = await this.page.$$('td, th, dt, label, span');
            for (const label of labels) {
                const text = await label.textContent();
                if (!text) continue;

                const labelText = text.trim().toLowerCase();
                const nextSibling = await label.$('+ td, + dd, + span');
                const value = nextSibling ? (await nextSibling.textContent() || '').trim() : '';

                if (labelText.includes('código sence')) {
                    courseInfo.codigoSence = value;
                } else if (labelText.includes('curso') && !labelText.includes('código')) {
                    courseInfo.nombreCurso = value;
                } else if (labelText.includes('horas acreditadas')) {
                    courseInfo.horasAcreditadas = parseInt(value) || 0;
                } else if (labelText.includes('fecha inicio')) {
                    courseInfo.fechaInicio = value;
                } else if (labelText.includes('fecha término')) {
                    courseInfo.fechaTermino = value;
                } else if (labelText.includes('estado')) {
                    courseInfo.estado = value;
                } else if (labelText.includes('modalidad')) {
                    courseInfo.modalidad = value;
                } else if (labelText.includes('empresa')) {
                    courseInfo.empresa = value;
                } else if (labelText.includes('otec')) {
                    courseInfo.otec = value;
                } else if (labelText.includes('otic')) {
                    courseInfo.otic = value;
                }
            }

        } catch (error) {
            console.warn('[LCE] Could not extract some course info:', error);
        }

        return courseInfo;
    }

    /**
     * Extract participants from the participants table
     */
    private async extractParticipants(): Promise<LCEParticipant[]> {
        if (!this.page) {
            throw new Error('Page not available');
        }

        const participants: LCEParticipant[] = [];

        try {
            // Wait for the participants table
            await this.page.waitForSelector('table', { timeout: 10000 });

            // Find the participants table - look for one with RUT column
            const tables = await this.page.$$('table');
            let participantsTable = null;

            for (const table of tables) {
                const headers = await table.$$('th');
                for (const header of headers) {
                    const text = await header.textContent();
                    if (text && text.toLowerCase().includes('rut')) {
                        participantsTable = table;
                        break;
                    }
                }
                if (participantsTable) break;
            }

            if (!participantsTable) {
                console.warn('[LCE] Could not find participants table');
                return participants;
            }

            // Get all rows (skip header)
            const rows = await participantsTable.$$('tbody tr');

            for (const row of rows) {
                const cells = await row.$$('td');
                if (cells.length < 3) continue;

                // Extract cell values
                const cellTexts: string[] = [];
                for (const cell of cells) {
                    const text = await cell.textContent();
                    cellTexts.push((text || '').trim());
                }

                // Parse based on expected column order: RUT, Nombre, N° sesiones, Estado DJ
                // Adjust indices based on actual table structure
                const rut = cellTexts[0] || '';
                const nombre = cellTexts[1] || '';
                const numSesionesStr = cellTexts[2] || '0';

                // Estado DJ might be in a different column or have an icon
                let estadoDJ = 'Pendiente';
                const djCell = cells[cells.length - 2]; // Usually second to last
                const djText = await djCell.textContent();
                if (djText) {
                    estadoDJ = djText.trim();
                }

                // Also check for status icons
                const emitidaIcon = await djCell.$('[class*="emitida"], [src*="emitida"], .verde, .green');
                if (emitidaIcon) {
                    estadoDJ = 'Emitida';
                }

                const numSesiones = parseInt(numSesionesStr) || 0;
                const conexSence: 0 | 1 = numSesiones >= 1 ? 1 : 0;
                const dj: 0 | 1 = estadoDJ.toLowerCase().includes('emitida') ? 1 : 0;

                participants.push({
                    rut,
                    rutNormalized: this.normalizeRut(rut),
                    nombre,
                    numSesiones,
                    estadoDeclaracionJurada: estadoDJ,
                    conexSence,
                    dj,
                });
            }

        } catch (error) {
            console.error('[LCE] Error extracting participants:', error);
        }

        return participants;
    }

    /**
     * Normalize RUT (remove dots, keep hyphen)
     */
    private normalizeRut(rut: string): string {
        return rut.replace(/\./g, '').trim();
    }

    /**
     * Take a screenshot for debugging
     */
    async screenshot(filename: string): Promise<void> {
        if (this.page) {
            await this.page.screenshot({ path: filename, fullPage: true });
            console.log(`[LCE] Screenshot saved to ${filename}`);
        }
    }

    /**
     * Get current page content for debugging
     */
    async getPageContent(): Promise<string> {
        if (this.page) {
            return await this.page.content();
        }
        return '';
    }

    /**
     * Close browser and cleanup
     */
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.page = null;
            this._isLoggedIn = false;
            console.log('[LCE] Browser closed');
        }
    }
}

/**
 * Convenience function to scrape a course without managing browser lifecycle
 */
export async function scrapeCourseParticipants(
    credentials: LCECredentials,
    codigoCurso: string,
    options: { headless?: boolean; screenshotOnError?: boolean } = {}
): Promise<LCEScrapeResult> {
    const scraper = new LCEScraperService(credentials);

    try {
        await scraper.initialize(options.headless ?? true);

        const loginSuccess = await scraper.login();
        if (!loginSuccess) {
            if (options.screenshotOnError) {
                await scraper.screenshot(`error_login_${Date.now()}.png`);
            }
            return { success: false, error: 'Login failed', errorCode: 'LOGIN_FAILED' };
        }

        const result = await scraper.getCourseParticipants(codigoCurso);

        if (!result.success && options.screenshotOnError) {
            await scraper.screenshot(`error_scrape_${Date.now()}.png`);
        }

        return result;

    } catch (error) {
        console.error('[LCE] Scraping error:', error);
        if (options.screenshotOnError) {
            await scraper.screenshot(`error_${Date.now()}.png`);
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            errorCode: 'UNKNOWN_ERROR'
        };
    } finally {
        await scraper.close();
    }
}
