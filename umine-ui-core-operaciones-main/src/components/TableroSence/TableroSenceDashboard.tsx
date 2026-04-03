/**
 * TABLERO SENCE - Dashboard Component
 *
 * Muestra estadisticas del tablero SENCE:
 * - Actualizaciones diarias de DJ y Conexion
 * - Totales generales
 * - Descarga de Excel
 */

import { useState, useEffect, useCallback } from 'react';
import { tableroApi, TableroStats, TableroRecord } from '../../services/tableroSenceApi';

// ============================================
// Types
// ============================================

interface DailyUpdateStats {
    pendingConexUpdates: number;
    pendingDjUpdates: number;
    processedToday: number;
    lastUpdate: string | null;
}

// ============================================
// Styles (inline for simplicity)
// ============================================

const styles = {
    container: {
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    header: {
        marginBottom: '24px',
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#1a1a2e',
        marginBottom: '8px',
    },
    subtitle: {
        fontSize: '14px',
        color: '#666',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
    },
    cardLabel: {
        fontSize: '13px',
        color: '#666',
        marginBottom: '8px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    cardValue: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#1a1a2e',
    },
    cardValueSmall: {
        fontSize: '12px',
        color: '#888',
        marginTop: '4px',
    },
    section: {
        marginBottom: '32px',
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: '16px',
    },
    button: {
        backgroundColor: '#4F46E5',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        marginRight: '12px',
        transition: 'background-color 0.2s',
    },
    buttonSecondary: {
        backgroundColor: '#fff',
        color: '#4F46E5',
        padding: '12px 24px',
        borderRadius: '8px',
        border: '2px solid #4F46E5',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        marginRight: '12px',
        transition: 'background-color 0.2s',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        cursor: 'not-allowed',
    },
    alertCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: '12px',
        padding: '16px 20px',
        border: '1px solid #F59E0B',
        marginBottom: '16px',
    },
    alertTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#92400E',
        marginBottom: '4px',
    },
    alertText: {
        fontSize: '13px',
        color: '#92400E',
    },
    successCard: {
        backgroundColor: '#D1FAE5',
        borderRadius: '12px',
        padding: '16px 20px',
        border: '1px solid #10B981',
        marginBottom: '16px',
    },
    successText: {
        fontSize: '13px',
        color: '#065F46',
    },
    loading: {
        textAlign: 'center' as const,
        padding: '40px',
        color: '#666',
    },
    error: {
        backgroundColor: '#FEE2E2',
        color: '#DC2626',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
    },
};

// ============================================
// Helper Functions
// ============================================

function formatNumber(num: number): string {
    return new Intl.NumberFormat('es-CL').format(num);
}

function formatCurrency(num: number): string {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
    }).format(num);
}

function downloadAsExcel(records: TableroRecord[], filename: string): void {
    // Convert records to CSV format
    if (records.length === 0) {
        alert('No hay registros para descargar');
        return;
    }

    const headers = Object.keys(records[0]).filter(k => !k.startsWith('pk') && !k.startsWith('sk') && !k.startsWith('gsi'));
    const csvContent = [
        headers.join(','),
        ...records.map(record =>
            headers.map(h => {
                const value = record[h];
                if (value === null || value === undefined) return '';
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return String(value);
            }).join(',')
        )
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ============================================
// Component
// ============================================

interface SyncResult {
    processed: number;
    updated: number;
    flagsConex: number;
    flagsDj: number;
}

export function TableroSenceDashboard() {
    const [stats, setStats] = useState<TableroStats | null>(null);
    const [dailyStats, setDailyStats] = useState<DailyUpdateStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Get main stats
            const mainStats = await tableroApi.getStats();
            setStats(mainStats);

            // Get daily update stats
            const pendingConex = await tableroApi.search({ conexSence: 0, limit: 1000 });
            const pendingDj = await tableroApi.search({ dj: 0, limit: 1000 });

            // Count records with bot flags
            const conexNeedUpdate = pendingConex.items.filter(r => r.conexBot === 1).length;
            const djNeedUpdate = pendingDj.items.filter(r => r.djBot === 1).length;

            // Count processed today
            const today = new Date().toISOString().split('T')[0];
            const processedToday = pendingConex.items.filter(r =>
                r.botProcessed && r.botProcessed.startsWith(today)
            ).length;

            setDailyStats({
                pendingConexUpdates: conexNeedUpdate,
                pendingDjUpdates: djNeedUpdate,
                processedToday,
                lastUpdate: new Date().toISOString(),
            });

            setLastRefresh(new Date());
        } catch (err: any) {
            setError(err.message || 'Error al cargar datos');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDownloadExcel = async () => {
        setDownloading(true);
        try {
            // Use the API export endpoint which handles all records
            await tableroApi.exportToCsv();
        } catch (err: any) {
            alert('Error al descargar: ' + err.message);
        } finally {
            setDownloading(false);
        }
    };

    const handleSyncWorkflow = async () => {
        setSyncing(true);
        setSyncResult(null);
        try {
            const result = await tableroApi.runSyncWorkflow(10); // Process 10 courses
            setSyncResult(result);
            // Refresh data after sync
            await fetchData();
        } catch (err: any) {
            alert('Error en sincronizacion: ' + err.message);
        } finally {
            setSyncing(false);
        }
    };

    if (loading && !stats) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Cargando datos del tablero...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.title}>Tablero SENCE</h1>
                <p style={styles.subtitle}>
                    Dashboard de operaciones y sincronizacion SENCE
                    {lastRefresh && ` | Ultima actualizacion: ${lastRefresh.toLocaleTimeString()}`}
                </p>
            </div>

            {/* Error */}
            {error && (
                <div style={styles.error}>
                    Error: {error}
                    <button onClick={fetchData} style={{ marginLeft: '16px' }}>Reintentar</button>
                </div>
            )}

            {/* Daily Updates Section */}
            {dailyStats && (dailyStats.pendingConexUpdates > 0 || dailyStats.pendingDjUpdates > 0) && (
                <div style={styles.alertCard}>
                    <div style={styles.alertTitle}>Actualizaciones Pendientes</div>
                    <div style={styles.alertText}>
                        Hay {formatNumber(dailyStats.pendingConexUpdates)} conexiones
                        y {formatNumber(dailyStats.pendingDjUpdates)} DJ pendientes de actualizar en el Excel.
                    </div>
                </div>
            )}

            {/* Main Stats Grid */}
            {stats && (
                <div style={styles.grid}>
                    <div style={styles.card}>
                        <div style={styles.cardLabel}>Total Registros</div>
                        <div style={styles.cardValue}>{formatNumber(stats.totalRegistros)}</div>
                    </div>
                    <div style={styles.card}>
                        <div style={styles.cardLabel}>Clientes</div>
                        <div style={styles.cardValue}>{formatNumber(stats.totalClientes)}</div>
                    </div>
                    <div style={styles.card}>
                        <div style={styles.cardLabel}>Cursos</div>
                        <div style={styles.cardValue}>{formatNumber(stats.totalCursos)}</div>
                    </div>
                    <div style={styles.card}>
                        <div style={styles.cardLabel}>Participantes</div>
                        <div style={styles.cardValue}>{formatNumber(stats.totalParticipantes)}</div>
                    </div>
                </div>
            )}

            {/* Connection Stats */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Estado de Conexiones</h2>
                {stats && (
                    <div style={styles.grid}>
                        <div style={{ ...styles.card, borderLeft: '4px solid #10B981' }}>
                            <div style={styles.cardLabel}>Conectados SENCE</div>
                            <div style={styles.cardValue}>{formatNumber(stats.totalConectados)}</div>
                            <div style={styles.cardValueSmall}>
                                {((stats.totalConectados / stats.totalParticipantes) * 100).toFixed(1)}% del total
                            </div>
                        </div>
                        <div style={{ ...styles.card, borderLeft: '4px solid #3B82F6' }}>
                            <div style={styles.cardLabel}>DJ Emitidas</div>
                            <div style={styles.cardValue}>{formatNumber(stats.totalDjEmitidas)}</div>
                            <div style={styles.cardValueSmall}>
                                {((stats.totalDjEmitidas / stats.totalParticipantes) * 100).toFixed(1)}% del total
                            </div>
                        </div>
                        {dailyStats && (
                            <>
                                <div style={{ ...styles.card, borderLeft: '4px solid #F59E0B' }}>
                                    <div style={styles.cardLabel}>Pendientes Conexion</div>
                                    <div style={styles.cardValue}>{formatNumber(dailyStats.pendingConexUpdates)}</div>
                                    <div style={styles.cardValueSmall}>Para actualizar en Excel</div>
                                </div>
                                <div style={{ ...styles.card, borderLeft: '4px solid #F59E0B' }}>
                                    <div style={styles.cardLabel}>Pendientes DJ</div>
                                    <div style={styles.cardValue}>{formatNumber(dailyStats.pendingDjUpdates)}</div>
                                    <div style={styles.cardValueSmall}>Para actualizar en Excel</div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Financial Stats */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Montos</h2>
                {stats && (
                    <div style={styles.grid}>
                        <div style={styles.card}>
                            <div style={styles.cardLabel}>Total SENCE</div>
                            <div style={styles.cardValue}>{formatCurrency(stats.montoTotalSence)}</div>
                        </div>
                        <div style={styles.card}>
                            <div style={styles.cardLabel}>Total a Facturar</div>
                            <div style={styles.cardValue}>{formatCurrency(stats.montoTotalFacturar)}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sync Result */}
            {syncResult && (
                <div style={styles.successCard}>
                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>Sincronizacion Completada</div>
                    <div style={styles.successText}>
                        Cursos procesados: {syncResult.processed} |
                        Registros actualizados: {syncResult.updated} |
                        Flags CONEX: {syncResult.flagsConex} |
                        Flags DJ: {syncResult.flagsDj}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Acciones</h2>
                <button
                    style={styles.button}
                    onClick={fetchData}
                    disabled={loading}
                >
                    {loading ? 'Actualizando...' : 'Actualizar Datos'}
                </button>
                <button
                    style={syncing ? { ...styles.button, ...styles.buttonDisabled } : { ...styles.button, backgroundColor: '#10B981' }}
                    onClick={handleSyncWorkflow}
                    disabled={syncing}
                >
                    {syncing ? 'Sincronizando...' : 'Ejecutar Sync SENCE'}
                </button>
                <button
                    style={downloading ? { ...styles.buttonSecondary, ...styles.buttonDisabled } : styles.buttonSecondary}
                    onClick={handleDownloadExcel}
                    disabled={downloading}
                >
                    {downloading ? 'Descargando...' : 'Descargar Excel Completo'}
                </button>
            </div>
        </div>
    );
}

export default TableroSenceDashboard;
