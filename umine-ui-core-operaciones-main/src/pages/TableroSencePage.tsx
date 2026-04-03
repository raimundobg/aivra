/**
 * TABLERO SENCE Page
 *
 * Pagina principal del Tablero SENCE en el portal de operaciones.
 * Incluye:
 * - Dashboard con estadisticas
 * - Visualizacion de actualizaciones pendientes
 * - Descarga de Excel
 * - Simulacion de workflow del Bot SENCE
 */

import { TableroSenceDashboard } from '../components/TableroSence';

export function TableroSencePage() {
    return <TableroSenceDashboard />;
}

export default TableroSencePage;
