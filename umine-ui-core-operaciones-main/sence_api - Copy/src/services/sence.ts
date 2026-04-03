import axios from 'axios';
import { SenceProgressPayload } from '../types';

const SENCE_API_URL = process.env.SENCE_API_URL || 'https://auladigital.sence.cl/gestor/API';

export const SenceApiService = {
    async sendProgress(payload: SenceProgressPayload) {
        try {
            const response = await axios.post(`${SENCE_API_URL}/avance-sic/enviarAvance`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error sending progress to Sence:', error);
            throw error;
        }
    },

    async checkHistory(rutOtec: string, idSistema: number, token: string) {
        try {
            const response = await axios.get(`${SENCE_API_URL}/avance-sic/historialEnvios`, {
                params: { rutOtec, idSistema, token },
            });
            return response.data;
        } catch (error) {
            console.error('Error checking Sence history:', error);
            throw error;
        }
    }
};
