/**
 * TABLERO SENCE - Frontend API Service
 *
 * Servicio para conectar el frontend React con la API del Tablero SENCE.
 *
 * USO:
 *   import { tableroApi } from '@/services/tableroSenceApi';
 *
 *   // En un componente React:
 *   const stats = await tableroApi.getStats();
 *   const participants = await tableroApi.queryByCourse('6749253');
 *
 * CONFIGURACION:
 *   - Development: http://localhost:3001 (servidor local)
 *   - Production: URL de API Gateway AWS
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================
// Configuration
// ============================================

const API_BASE_URL = import.meta.env.VITE_TABLERO_API_URL || 'http://localhost:3001';

// ============================================
// Types
// ============================================

export interface TableroRecord {
    pk: string;
    sk: string;
    codSence: string;
    rut: string;
    idCliente: string | null;
    cliente: string | null;
    nombreCurso: string | null;
    nombres: string | null;
    apellidos: string | null;
    correoPersonal: string | null;
    conexSence: number | null;
    dj: number | null;
    conexBot: number | null;
    djBot: number | null;
    actualizarConex: number | null;
    actualizarDj: number | null;
    fechaInicio: string | null;
    fechaTermino: string | null;
    montoSence: number | null;
    montoAFacturar: number | null;
    estadoOc: string | null;
    coordinador: string | null;
    comercialACargo: string | null;
    // ... otros campos
    createdAt: string;
    updatedAt: string;
    [key: string]: any;
}

export interface TableroStats {
    totalRegistros: number;
    totalClientes: number;
    totalCursos: number;
    totalParticipantes: number;
    totalConectados: number;
    totalDjEmitidas: number;
    montoTotalSence: number;
    montoTotalFacturar: number;
}

export interface TableroQueryResult {
    success: boolean;
    items: TableroRecord[];
    count: number;
    lastEvaluatedKey?: any;
}

export interface BatchUpdateItem {
    codSence: string;
    rut: string;
    updates: Partial<TableroRecord>;
}

export interface TableroFilters {
    coordinador?: string;
    comercialACargo?: string;
    idCliente?: string;
    estadoOc?: string;
    mesInicio?: string;
    anioInicio?: number;
    conexSence?: number;
    dj?: number;
    limit?: number;
}

// ============================================
// API Client
// ============================================

class TableroSenceApiClient {
    private client: AxiosInstance;

    constructor(baseURL: string) {
        this.client = axios.create({
            baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            response => response,
            (error: AxiosError) => {
                console.error('Tablero API Error:', error.message);
                throw error;
            }
        );
    }

    // ========== Health ==========

    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        const response = await this.client.get('/tablero/health');
        return response.data;
    }

    // ========== Stats ==========

    async getStats(): Promise<TableroStats> {
        const response = await this.client.get('/tablero/stats');
        return response.data.stats;
    }

    // ========== Query Operations ==========

    async queryByCourse(codSence: string, limit?: number): Promise<TableroQueryResult> {
        const params = limit ? { limit } : {};
        const response = await this.client.get(`/tablero/course/${encodeURIComponent(codSence)}`, { params });
        return response.data;
    }

    async queryByClient(idCliente: string, limit?: number): Promise<TableroQueryResult> {
        const params = limit ? { limit } : {};
        const response = await this.client.get(`/tablero/client/${encodeURIComponent(idCliente)}`, { params });
        return response.data;
    }

    async queryByRut(rut: string, limit?: number): Promise<TableroQueryResult> {
        const params = limit ? { limit } : {};
        const response = await this.client.get(`/tablero/participant/${encodeURIComponent(rut)}`, { params });
        return response.data;
    }

    // ========== CRUD Operations ==========

    async getRecord(codSence: string, rut: string): Promise<TableroRecord | null> {
        try {
            const response = await this.client.get(
                `/tablero/${encodeURIComponent(codSence)}/${encodeURIComponent(rut)}`
            );
            return response.data.record;
        } catch (error: any) {
            if (error.response?.status === 404) return null;
            throw error;
        }
    }

    async createRecord(record: Partial<TableroRecord> & { codSence: string; rut: string; idCliente: string }): Promise<TableroRecord> {
        const response = await this.client.post('/tablero', record);
        return response.data.record;
    }

    async updateRecord(codSence: string, rut: string, updates: Partial<TableroRecord>): Promise<TableroRecord> {
        const response = await this.client.put(
            `/tablero/${encodeURIComponent(codSence)}/${encodeURIComponent(rut)}`,
            { updates }
        );
        return response.data.record;
    }

    async deleteRecord(codSence: string, rut: string): Promise<boolean> {
        await this.client.delete(
            `/tablero/${encodeURIComponent(codSence)}/${encodeURIComponent(rut)}`
        );
        return true;
    }

    // ========== Batch Operations ==========

    async batchUpdate(items: BatchUpdateItem[]): Promise<{ updated: number; failed: number }> {
        const response = await this.client.post('/tablero/batch-update', { items });
        return {
            updated: response.data.updated,
            failed: response.data.failed,
        };
    }

    // ========== Search ==========

    async search(filters: TableroFilters): Promise<TableroQueryResult> {
        const params = new URLSearchParams();

        if (filters.coordinador) params.append('coordinador', filters.coordinador);
        if (filters.comercialACargo) params.append('comercialACargo', filters.comercialACargo);
        if (filters.idCliente) params.append('idCliente', filters.idCliente);
        if (filters.estadoOc) params.append('estadoOc', filters.estadoOc);
        if (filters.mesInicio) params.append('mesInicio', filters.mesInicio);
        if (filters.anioInicio !== undefined) params.append('anioInicio', String(filters.anioInicio));
        if (filters.conexSence !== undefined) params.append('conexSence', String(filters.conexSence));
        if (filters.dj !== undefined) params.append('dj', String(filters.dj));
        if (filters.limit) params.append('limit', String(filters.limit));

        const response = await this.client.get(`/tablero/search?${params.toString()}`);
        return response.data;
    }

    // ========== Convenience Methods for Tablero ==========

    /**
     * Get all participants that need CONEX update (actualizarConex = 1)
     */
    async getPendingConexUpdates(limit = 100): Promise<TableroRecord[]> {
        const result = await this.search({ conexSence: 0, limit });
        return result.items.filter(r => r.conexBot === 1);
    }

    /**
     * Get all participants that need DJ update (actualizarDj = 1)
     */
    async getPendingDjUpdates(limit = 100): Promise<TableroRecord[]> {
        const result = await this.search({ dj: 0, limit });
        return result.items.filter(r => r.djBot === 1);
    }

    /**
     * Get summary by course
     */
    async getCourseSummary(codSence: string): Promise<{
        totalParticipantes: number;
        conectados: number;
        djEmitidas: number;
        pendientesConex: number;
        pendientesDj: number;
    }> {
        const result = await this.queryByCourse(codSence);
        const items = result.items;

        return {
            totalParticipantes: items.length,
            conectados: items.filter(r => r.conexSence === 1).length,
            djEmitidas: items.filter(r => r.dj === 1).length,
            pendientesConex: items.filter(r => r.actualizarConex === 1).length,
            pendientesDj: items.filter(r => r.actualizarDj === 1).length,
        };
    }

    /**
     * Run SENCE sync workflow (simulates Apps Script)
     * Returns stats about what was updated
     */
    async runSyncWorkflow(limit = 5): Promise<{
        processed: number;
        updated: number;
        flagsConex: number;
        flagsDj: number;
    }> {
        // Get unique course codes
        const allRecords = await this.search({ limit: 10000 });
        const courseSet = new Set<string>();
        allRecords.items.forEach(r => {
            if (r.codSence) courseSet.add(r.codSence);
        });

        const courses = Array.from(courseSet).slice(0, limit);
        let processed = 0;
        let updated = 0;
        let flagsConex = 0;
        let flagsDj = 0;

        for (const codSence of courses) {
            const participants = await this.queryByCourse(codSence);

            // Find incomplete rows
            const incomplete = participants.items.filter(
                p => p.conexSence !== 1 || p.dj !== 1
            );

            if (incomplete.length === 0) continue;

            processed++;

            // Simulate SENCE API response and update
            const updates = incomplete.map(record => {
                const excelConex = record.conexSence === 1 ? 1 : 0;
                const excelDj = record.dj === 1 ? 1 : 0;

                // Simulate: randomly mark some as connected/DJ
                const apiConex = record.conexBot === 1 || Math.random() > 0.5 ? 1 : 0;
                const apiDj = record.djBot === 1 || (apiConex === 1 && Math.random() > 0.4) ? 1 : 0;

                const flagConex = (apiConex === 1 && excelConex === 0) ? 1 : 0;
                const flagDj = (apiDj === 1 && excelDj === 0) ? 1 : 0;

                if (flagConex) flagsConex++;
                if (flagDj) flagsDj++;

                return {
                    codSence: record.codSence,
                    rut: record.rut,
                    updates: {
                        conexBot: apiConex,
                        djBot: apiDj,
                        botProcessed: new Date().toISOString(),
                        actualizarConex: flagConex,
                        actualizarDj: flagDj,
                    },
                };
            });

            const result = await this.batchUpdate(updates);
            updated += result.updated;
        }

        return { processed, updated, flagsConex, flagsDj };
    }

    /**
     * Export all data as CSV (downloads file)
     */
    async exportToCsv(): Promise<void> {
        const timestamp = new Date().toISOString().split('T')[0];
        const url = `${this.client.defaults.baseURL}/tablero/export`;

        // Create a link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `tablero_sence_${timestamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Sync a course with SENCE bot data
     */
    async syncCourseFromBot(
        codSence: string,
        botData: Array<{ rut: string; conexBot: number; djBot: number; numSesiones?: number }>
    ): Promise<{ updated: number; failed: number }> {
        const items: BatchUpdateItem[] = botData.map(data => ({
            codSence,
            rut: data.rut,
            updates: {
                conexBot: data.conexBot,
                djBot: data.djBot,
                botNumSesiones: data.numSesiones || null,
                botProcessed: new Date().toISOString(),
                // Mark for update if bot shows connected but Excel doesn't
                actualizarConex: data.conexBot === 1 ? 1 : null,
                actualizarDj: data.djBot === 1 ? 1 : null,
            },
        }));

        return this.batchUpdate(items);
    }
}

// ============================================
// Export Singleton Instance
// ============================================

export const tableroApi = new TableroSenceApiClient(API_BASE_URL);

// Also export the class for testing
export { TableroSenceApiClient };

// ============================================
// React Hook (optional)
// ============================================

import { useState, useEffect, useCallback } from 'react';

export function useTableroStats() {
    const [stats, setStats] = useState<TableroStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await tableroApi.getStats();
            setStats(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { stats, loading, error, refresh };
}

export function useTableroQuery(
    queryType: 'course' | 'client' | 'rut',
    id: string,
    limit?: number
) {
    const [data, setData] = useState<TableroRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            let result: TableroQueryResult;
            switch (queryType) {
                case 'course':
                    result = await tableroApi.queryByCourse(id, limit);
                    break;
                case 'client':
                    result = await tableroApi.queryByClient(id, limit);
                    break;
                case 'rut':
                    result = await tableroApi.queryByRut(id, limit);
                    break;
            }
            setData(result.items);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [queryType, id, limit]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { data, loading, error, refresh };
}
