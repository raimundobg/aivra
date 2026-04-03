import axios from 'axios';

const API_URL = import.meta.env.VITE_URL_SERVICIOS;

export interface Otic {
    name: string;
    desc: string;
}

export const oticService = {
    async getOtics(): Promise<Otic[]> {
        // En un entorno real esto llamaría a la lambda desplegada.
        // Por ahora simulamos el POST a la URL base + el path proyectado.
        try {
            const response = await axios.post(`${API_URL}/v1/customer/otic-list`);
            return response.data;
        } catch (error) {
            console.error('Error fetching OTICs from Lambda:', error);
            // Fallback en caso de que no esté desplegada la lambda aún en el entorno local/dev
            return [
                { name: 'DIRECTO', desc: 'Facturación Directa' },
                { name: 'PROFORMA', desc: 'OTIC Proforma' }
            ];
        }
    }
};
