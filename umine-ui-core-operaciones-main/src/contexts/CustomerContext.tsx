import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import localforage from 'localforage';
import type { Customer, Contact } from '../types/customer';
import { oticService } from '../services/oticService';
import { accountManagerService, type AccountManager } from '../services/accountManagerService';

interface CustomerContextType {
    customers: Customer[];
    contacts: Contact[];
    addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    addContact: (contact: Omit<Contact, 'id'>) => Promise<void>;
    updateContact: (id: string, contact: Partial<Contact>) => Promise<void>;
    deleteContact: (id: string) => Promise<void>;
    getCustomerById: (id: string) => Customer | undefined;
    getContactsByCustomerId: (customerId: string) => Contact[];
    otics: { name: string, desc: string }[];
    isLoadingOtics: boolean;
    accountManagers: AccountManager[];
    isLoadingAccountManagers: boolean;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const CUSTOMERS_STORAGE_KEY = 'umine_crm_customers';
const CONTACTS_STORAGE_KEY = 'umine_crm_contacts';

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [otics, setOtics] = useState<{ name: string, desc: string }[]>([]);
    const [isLoadingOtics, setIsLoadingOtics] = useState(true);
    const [accountManagers, setAccountManagers] = useState<AccountManager[]>([]);
    const [isLoadingAccountManagers, setIsLoadingAccountManagers] = useState(true);

    useEffect(() => {
        const loadOtics = async () => {
            try {
                const data = await oticService.getOtics();
                setOtics(data);
            } catch (error) {
                console.error("Error loading OTICs:", error);
            } finally {
                setIsLoadingOtics(false);
            }
        };

        const loadAccountManagers = async () => {
            try {
                const data = await accountManagerService.getAccountManagers();
                setAccountManagers(data);
            } catch (error) {
                console.error("Error loading Account Managers:", error);
            } finally {
                setIsLoadingAccountManagers(false);
            }
        };

        const loadData = async () => {
            const savedCustomers = await localforage.getItem<Customer[]>(CUSTOMERS_STORAGE_KEY);
            const savedContacts = await localforage.getItem<Contact[]>(CONTACTS_STORAGE_KEY);

            if (savedCustomers) {
                const migratedCustomers = savedCustomers.map(c => ({
                    ...c,
                    status: c.status || 'CLIENTE ACTIVO',
                    clientType: c.clientType || 'Cliente Plataforma'
                }));
                setCustomers(migratedCustomers);
            } else {
                // Initial dummy data
                const initialCustomers: Customer[] = [
                    {
                        id: '882',
                        institutionId: '882',
                        name: 'ADIDAS',
                        industry: 'Retail',
                        status: 'CLIENTE ACTIVO',
                        otic: 'PROFORMA',
                        clientType: 'Cliente Plataforma',
                        comercialManager: 'Ignacia Larrondo',
                        comercialContact: 'ignacia.larrondo@umine.com',
                        coordinatorManager: 'FRANCISCA ROJAS',
                        coordinatorContact: 'francisca.rojas@umine.com',
                        platformType: 'PLATAFORMA PROPIA',
                        website: 'adidas.umine.com',
                        adminUsername: 'adidas_admin',
                        password: 'umine2025#',
                        phone: '+56 9 7707 0611',
                        address: 'Santiago, Chile',
                        socialMedia: [],
                        tags: ['Retail', 'Active'],
                        aliases: [],
                        billingInfo: { taxId: '-', address: '-', email: 'Francisco.Munoz@externals.adidas.com' },
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    },
                    {
                        id: '850',
                        institutionId: '850',
                        name: 'CCU',
                        industry: 'Beverages',
                        status: 'CLIENTE ACTIVO',
                        otic: 'CCC',
                        clientType: 'Cliente Plataforma',
                        comercialManager: 'Magdalena Illanes',
                        comercialContact: 'magdalena.illanes@umine.com',
                        coordinatorManager: 'YOCELYN CISTERNAS',
                        coordinatorContact: 'yocelyn.cisternas@umine.com',
                        platformType: 'PLATAFORMA PROPIA',
                        website: 'formacionccu.cl',
                        adminUsername: 'admin_ccu_1',
                        password: 'umine2025#',
                        appName: 'Formación CCU',
                        phone: '+56 9 7759 8505',
                        address: 'Santiago, Chile',
                        socialMedia: [],
                        tags: ['Large Corp', 'CCC'],
                        aliases: [],
                        billingInfo: { taxId: '-', address: '-', email: 'FGONZALE@ccu.cl' },
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    },
                    {
                        id: '900',
                        institutionId: '900',
                        name: 'Banco de Chile',
                        industry: 'Banking',
                        status: 'CLIENTE ACTIVO',
                        otic: 'SOFOFA',
                        clientType: 'Cliente Plataforma',
                        comercialManager: 'Alfredo Gonzalez',
                        comercialContact: 'alfredo.gonzalez@umine.com',
                        coordinatorManager: 'GABRIELA MUNOZ',
                        coordinatorContact: 'gabriela.munoz@umine.com',
                        platformType: 'PLATAFORMA PROPIA',
                        website: 'bancochile.cl',
                        adminUsername: 'banchile_admin',
                        password: 'umine2025#',
                        appName: 'Campus Banco de Chile',
                        phone: '+56 2 2637 1111',
                        address: 'Santiago, Chile',
                        socialMedia: [],
                        tags: ['Banking', 'SOFOFA'],
                        aliases: [],
                        billingInfo: { taxId: '-', address: '-', email: 'capacitacion@bancochile.cl' },
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    },
                    {
                        id: '950',
                        institutionId: '950',
                        name: 'Scotiabank Chile',
                        industry: 'Banking',
                        status: 'CLIENTE ACTIVO',
                        otic: 'SENCE',
                        clientType: 'Cliente Plataforma',
                        comercialManager: 'Begoña Prenafeta',
                        comercialContact: 'begona.prenafeta@umine.com',
                        coordinatorManager: 'GABRIELA MUNOZ',
                        coordinatorContact: 'gabriela.munoz@umine.com',
                        platformType: 'PLATAFORMA PROPIA',
                        website: 'www.scotiabank.cl',
                        adminUsername: 'scotia_admin',
                        password: 'umine2025#',
                        appName: 'Academia Scotiabank',
                        phone: '+56 2 2692 7000',
                        address: 'Morandé 226, Santiago',
                        socialMedia: [],
                        tags: ['Tier 1', 'Banking', 'SENCE'],
                        aliases: [],
                        billingInfo: { taxId: '-', address: '-', email: 'formacion@scotiabank.cl' },
                        createdAt: 1770034800000, // Roughly Feb 3 2026
                        updatedAt: Date.now()
                    }
                ];
                setCustomers(initialCustomers);
                await localforage.setItem(CUSTOMERS_STORAGE_KEY, initialCustomers);
            }

            if (savedContacts) {
                setContacts(savedContacts);
            } else {
                const initialContacts: Contact[] = [
                    {
                        id: 'c1',
                        customerId: '882',
                        name: 'Francisco Muñoz',
                        email: 'Francisco.Munoz@externals.adidas.com',
                        phone: '9 7801 9355',
                        position: 'Human Resources',
                    },
                    {
                        id: 'c2',
                        customerId: '850',
                        name: 'Felipe Gonzalez Frez',
                        email: 'FGONZALE@ccu.cl',
                        phone: '9 7759 8505',
                        position: 'Jefe de Formación',
                    }
                ];
                setContacts(initialContacts);
                await localforage.setItem(CONTACTS_STORAGE_KEY, initialContacts);
            }
        };

        loadData();
        loadOtics();
        loadAccountManagers();
    }, []);

    const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newCustomer: Customer = {
            ...customerData,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        const updated = [...customers, newCustomer];
        setCustomers(updated);
        await localforage.setItem(CUSTOMERS_STORAGE_KEY, updated);
    };

    const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
        const updated = customers.map(c =>
            c.id === id ? { ...c, ...customerData, updatedAt: Date.now() } : c
        );
        setCustomers(updated);
        await localforage.setItem(CUSTOMERS_STORAGE_KEY, updated);
    };

    const deleteCustomer = async (id: string) => {
        const updated = customers.filter(c => c.id !== id);
        setCustomers(updated);
        await localforage.setItem(CUSTOMERS_STORAGE_KEY, updated);
        // Also delete associated contacts
        const updatedContacts = contacts.filter(con => con.customerId !== id);
        setContacts(updatedContacts);
        await localforage.setItem(CONTACTS_STORAGE_KEY, updatedContacts);
    };

    const addContact = async (contactData: Omit<Contact, 'id'>) => {
        const newContact: Contact = {
            ...contactData,
            id: Math.random().toString(36).substr(2, 9),
        };
        const updated = [...contacts, newContact];
        setContacts(updated);
        await localforage.setItem(CONTACTS_STORAGE_KEY, updated);
    };

    const updateContact = async (id: string, contactData: Partial<Contact>) => {
        const updated = contacts.map(c =>
            c.id === id ? { ...c, ...contactData } : c
        );
        setContacts(updated);
        await localforage.setItem(CONTACTS_STORAGE_KEY, updated);
    };

    const deleteContact = async (id: string) => {
        const updated = contacts.filter(c => c.id !== id);
        setContacts(updated);
        await localforage.setItem(CONTACTS_STORAGE_KEY, updated);
    };

    const getCustomerById = (id: string) => customers.find(c => c.id === id);

    const getContactsByCustomerId = (customerId: string) =>
        contacts.filter(c => c.customerId === customerId);

    return (
        <CustomerContext.Provider value={{
            customers,
            contacts,
            addCustomer,
            updateCustomer,
            deleteCustomer,
            addContact,
            updateContact,
            deleteContact,
            getCustomerById,
            getContactsByCustomerId,
            otics,
            isLoadingOtics,
            accountManagers,
            isLoadingAccountManagers
        }}>
            {children}
        </CustomerContext.Provider>
    );
};

export const useCustomers = () => {
    const context = useContext(CustomerContext);
    if (!context) {
        throw new Error('useCustomers must be used within a CustomerProvider');
    }
    return context;
};
