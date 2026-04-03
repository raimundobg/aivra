import axios from 'axios';

const API_URL = import.meta.env.VITE_URL_SERVICIOS;

export interface POAttachment {
    filename: string;
    contentType: string;
    s3Key: string;
}

export interface POEmailSource {
    from: string;
    subject: string;
    date: string | Date;
}

export interface POStudent {
    id: string;
    student_dni: string;
    student_name: string;
    tramo: string;
    value: number;
    student_email: string;
    objeciones: string[] | null;
}

export interface PurchaseOrder {
    id: string;
    order_number: string;
    client_name: string;
    course_name: string;
    sence_code: string;
    init_course: string;
    end_course: string;
    otic: string;
    otic_rol: string;
    tramo: string;
    total_amount: number;
    currency: string;
    status: 'PENDING_APPROVAL' | 'SUCCESS' | 'DUPLICATE_SKIPPED';
    objeciones: string[] | null;
    emailSource?: POEmailSource;
    attachments?: POAttachment[];
    students?: POStudent[];
    createdAt: number;
    updatedAt: number;
}

export const poService = {
    async checkNewOrders() {
        const response = await axios.post(`${API_URL}/v1/po/check`);
        return response.data;
    },

    async getPurchaseOrders(): Promise<PurchaseOrder[]> {
        const response = await axios.post(`${API_URL}/v1/po/get-po`);
        return response.data;
    },

    async getPODetail(id: string): Promise<PurchaseOrder> {
        const response = await axios.post(`${API_URL}/v1/po/details`, { id });
        return response.data;
    }
};
