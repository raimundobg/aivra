export interface BillingInfo {
    taxId: string;
    address: string;
    email: string;
}

export interface SocialMedia {
    platform: string;
    link: string;
}

export interface Contact {
    id: string;
    customerId: string;
    rut?: string;
    name: string;
    phone: string;
    email: string;
    position: string;
}

export interface Customer {
    id: string;
    institutionId?: string;
    name: string;
    industry: string;
    otic?: string;
    status: string;
    clientType?: string;
    segment?: string;
    comercialManager?: string;
    comercialContact?: string;
    coordinatorManager?: string;
    coordinatorContact?: string;
    platformType?: string;
    adminUsername?: string;
    password?: string;
    appName?: string;
    reportUrl?: string;
    phone: string;
    address: string;
    website: string;
    socialMedia: SocialMedia[];
    tags: string[];
    billingInfo: BillingInfo;
    aliases: string[];
    createdAt: number;
    updatedAt: number;
}
