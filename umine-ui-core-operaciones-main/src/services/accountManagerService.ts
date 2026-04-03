import axios from 'axios';

const VITE_URL_SERVICIOS = import.meta.env.VITE_URL_SERVICIOS || '';

export interface AccountManager {
    name: string;
    email: string;
    phone: string;
}

export const accountManagerService = {
    getAccountManagers: async (): Promise<AccountManager[]> => {
        try {
            const response = await axios.get(`${VITE_URL_SERVICIOS}/account_manager_list`);
            return response.data;
        } catch (error) {
            console.error('Error fetching account managers:', error);
            // Fallback for local development or if lambda is not available
            return [
                { name: "Magdalena Illanes", email: "magdalena.illanes@umine.com", phone: "+56 9 6121 5298" },
                { name: "Ignacia Larrondo", email: "ignacia.larrondo@umine.com", phone: "+56 9 7707 0611" },
                { name: "Alfredo Gonzalez", email: "alfredo.gonzalez@umine.com", phone: "+56 9 6574 7395" },
                { name: "Alexis Escobar", email: "alexis.escobar@umine.com", phone: "+56 9 5668 0814" },
                { name: "Begoña Prenafeta", email: "begona.prenafeta@umine.com", phone: "+56 9 6170 4558" },
                { name: "Fernanda Ugarte", email: "fernanda.ugarte@umine.com", phone: "+56 9 4524 4145" },
                { name: "Gabriela Muñoz", email: "gabriela.muoz@umine.com", phone: "+56 9 5225 3503" },
                { name: "OP", email: "operaciones@umine.com", phone: "-" }
            ];
        }
    },
};
