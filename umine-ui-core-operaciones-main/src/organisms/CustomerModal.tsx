import React, { useState, useEffect } from 'react';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogActionTrigger,
    DialogCloseTrigger,
} from '../components/ui/dialog';
import {
    Button,
    Input,
    Stack,
    Field,
    createListCollection,
    SelectRoot,
    SelectTrigger,
    SelectValueText,
    SelectContent,
    SelectItem,
    SimpleGrid,
    Heading,
    Box,
    Separator,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useCustomers } from '../contexts/CustomerContext';
import type { Customer } from '../types/customer';

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerToEdit?: Customer;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, customerToEdit }) => {
    const { t } = useTranslation();
    const { addCustomer, updateCustomer, otics, accountManagers } = useCustomers();
    const isEditing = !!customerToEdit;

    const [formData, setFormData] = useState<Partial<Customer>>({
        name: '',
        industry: '',
        status: 'CLIENTE ACTIVO',
        otic: '',
        clientType: 'Cliente Plataforma',
        segment: '',
        comercialManager: '',
        comercialContact: '',
        coordinatorManager: '',
        coordinatorContact: '',
        platformType: 'PLATAFORMA PROPIA',
        adminUsername: '',
        password: '',
        appName: '',
        reportUrl: '',
        institutionId: '',
        phone: '',
        address: '',
        website: '',
        billingInfo: {
            taxId: '',
            address: '',
            email: ''
        },
        tags: [],
        socialMedia: [],
        aliases: []
    });

    useEffect(() => {
        if (customerToEdit) {
            setFormData({
                ...customerToEdit,
                aliases: customerToEdit.aliases || []
            });
        } else {
            setFormData({
                name: '',
                industry: '',
                status: 'CLIENTE ACTIVO',
                otic: '',
                clientType: 'Cliente Plataforma',
                segment: '',
                comercialManager: '',
                comercialContact: '',
                coordinatorManager: '',
                coordinatorContact: '',
                platformType: 'PLATAFORMA PROPIA',
                adminUsername: '',
                password: '',
                appName: '',
                reportUrl: '',
                institutionId: '',
                phone: '',
                address: '',
                website: '',
                billingInfo: {
                    taxId: '',
                    address: '',
                    email: ''
                },
                tags: [],
                socialMedia: [],
                aliases: []
            });
        }
    }, [customerToEdit, isOpen]);

    const handleChange = (field: string, value: any) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev[parent as keyof Customer] as any),
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = async () => {
        try {
            if (isEditing && customerToEdit?.id) {
                await updateCustomer(customerToEdit.id, formData);
            } else {
                await addCustomer(formData as any);
            }
            onClose();
        } catch (error) {
            console.error('Error saving customer:', error);
        }
    };

    const statusOptions = createListCollection({
        items: [
            { label: t('crm.status_labels.CLIENTE ACTIVO'), value: 'CLIENTE ACTIVO' },
            { label: t('crm.status_labels.CLIENTE INACTIVO'), value: 'CLIENTE INACTIVO' },
            { label: t('crm.status_labels.DADO DE BAJA'), value: 'DADO DE BAJA' },
            { label: t('crm.status_labels.ALIANZA'), value: 'ALIANZA' },
        ]
    });

    const industryOptions = createListCollection({
        items: [
            { label: t('crm.industry_labels.Retail'), value: 'Retail' },
            { label: t('crm.industry_labels.Minería'), value: 'Minería' },
            { label: t('crm.industry_labels.Banca'), value: 'Banca' },
            { label: t('crm.industry_labels.Bebidas'), value: 'Bebidas' },
            { label: t('crm.industry_labels.Educación'), value: 'Educación' },
            { label: t('crm.industry_labels.Tecnología'), value: 'Tecnología' },
            { label: t('crm.industry_labels.Salud'), value: 'Salud' },
            { label: t('crm.industry_labels.Seguros'), value: 'Seguros' },
            { label: t('crm.industry_labels.Servicios'), value: 'Servicios' },
            { label: t('crm.industry_labels.Otro'), value: 'Otro' },
        ]
    });

    const clientTypeOptions = createListCollection({
        items: [
            { label: t('crm.client_type_labels.Cliente Plataforma'), value: 'Cliente Plataforma' },
            { label: t('crm.client_type_labels.Cliente Spot'), value: 'Cliente Spot' },
            { label: t('crm.client_type_labels.Cliente Contenidos'), value: 'Cliente Contenidos' },
            { label: t('crm.client_type_labels.Plataforma Bloqueada'), value: 'Plataforma Bloqueada' },
        ]
    });

    const platformTypeOptions = createListCollection({
        items: [
            { label: t('crm.platform_type_labels.PLATAFORMA PROPIA'), value: 'PLATAFORMA PROPIA' },
            { label: t('crm.platform_type_labels.SIN PLATAFORMA'), value: 'SIN PLATAFORMA' },
        ]
    });

    const oticOptions = createListCollection({
        items: otics.map(o => ({ label: o.name, value: o.name }))
    });

    const accountManagerOptions = createListCollection({
        items: accountManagers.map(m => ({ label: m.name, value: m.name }))
    });

    const inputStyles = {
        variant: "outline" as const,
        borderRadius: "xl",
        border: "1px solid",
        borderColor: "border.subtle",
        bg: "whiteAlpha.50",
        _focus: { borderColor: "brand.primary", boxShadow: "0 0 0 1px {colors.brand.primary}" }
    };

    return (
        <DialogRoot
            open={isOpen}
            onOpenChange={(details) => !details.open && onClose()}
            size="xl"
            scrollBehavior="inside"
        >
            <DialogContent
                bg={{ _light: "white", _dark: "gray.900" }}
                border="1px solid"
                borderColor="border.subtle"
                boxShadow="2xl"
                borderRadius="2xl"
            >
                <DialogHeader>
                    <DialogTitle fontSize="2xl" fontFamily="heading">
                        {isEditing ? t('crm.edit_customer') : t('crm.add_customer')}
                    </DialogTitle>
                    <DialogCloseTrigger />
                </DialogHeader>

                <DialogBody px={6}>
                    <Stack gap={8}>
                        {/* Basic Info */}
                        <Box>
                            <Heading size="sm" mb={4} color="brand.primary" textTransform="uppercase" letterSpacing="wider">
                                {t('crm.basic_info')}
                            </Heading>
                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                <Field.Root required>
                                    <Field.Label>{t('crm.fields.name')}</Field.Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        {...inputStyles}
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>{t('crm.fields.industry')}</Field.Label>
                                    <SelectRoot
                                        collection={industryOptions}
                                        value={[formData.industry || '']}
                                        onValueChange={(details) => handleChange('industry', details.value[0])}
                                    >
                                        <SelectTrigger {...inputStyles}>
                                            <SelectValueText />
                                        </SelectTrigger>
                                        <SelectContent bg={{ _light: "white", _dark: "gray.900" }} zIndex="popover">
                                            {industryOptions.items.map((item) => (
                                                <SelectItem item={item} key={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>{t('crm.fields.status')}</Field.Label>
                                    <SelectRoot
                                        collection={statusOptions}
                                        value={[formData.status || '']}
                                        onValueChange={(details) => handleChange('status', details.value[0])}
                                    >
                                        <SelectTrigger {...inputStyles}>
                                            <SelectValueText />
                                        </SelectTrigger>
                                        <SelectContent bg={{ _light: "white", _dark: "gray.900" }} zIndex="popover">
                                            {statusOptions.items.map((item) => (
                                                <SelectItem item={item} key={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>{t('crm.fields.institution_id')}</Field.Label>
                                    <Input
                                        value={formData.institutionId}
                                        onChange={(e) => handleChange('institutionId', e.target.value)}
                                        {...inputStyles}
                                    />
                                </Field.Root>
                            </SimpleGrid>
                        </Box>

                        <Separator opacity={0.2} />

                        {/* Management Info */}
                        <Box>
                            <Heading size="sm" mb={4} color="brand.primary" textTransform="uppercase" letterSpacing="wider">
                                {t('crm.management_info')}
                            </Heading>
                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.otic')}</Field.Label>
                                    <SelectRoot
                                        collection={oticOptions}
                                        value={[formData.otic || '']}
                                        onValueChange={(details) => handleChange('otic', details.value[0])}
                                    >
                                        <SelectTrigger {...inputStyles}>
                                            <SelectValueText />
                                        </SelectTrigger>
                                        <SelectContent bg={{ _light: "white", _dark: "gray.900" }} zIndex="popover">
                                            {oticOptions.items.map((item) => (
                                                <SelectItem item={item} key={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.client_type')}</Field.Label>
                                    <SelectRoot
                                        collection={clientTypeOptions}
                                        value={[formData.clientType || '']}
                                        onValueChange={(details) => handleChange('clientType', details.value[0])}
                                    >
                                        <SelectTrigger {...inputStyles}>
                                            <SelectValueText />
                                        </SelectTrigger>
                                        <SelectContent bg={{ _light: "white", _dark: "gray.900" }} zIndex="popover">
                                            {clientTypeOptions.items.map((item) => (
                                                <SelectItem item={item} key={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.comercial_manager')}</Field.Label>
                                    <SelectRoot
                                        collection={accountManagerOptions}
                                        value={[formData.comercialManager || '']}
                                        onValueChange={(details) => {
                                            const selected = accountManagers.find(m => m.name === details.value[0]);
                                            handleChange('comercialManager', details.value[0]);
                                            if (selected) {
                                                handleChange('comercialContact', selected.email);
                                            }
                                        }}
                                    >
                                        <SelectTrigger {...inputStyles}>
                                            <SelectValueText />
                                        </SelectTrigger>
                                        <SelectContent bg={{ _light: "white", _dark: "gray.900" }} zIndex="popover">
                                            {accountManagerOptions.items.map((item) => (
                                                <SelectItem item={item} key={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.comercial_contact')}</Field.Label>
                                    <Input
                                        value={formData.comercialContact}
                                        onChange={(e) => handleChange('comercialContact', e.target.value)}
                                        {...inputStyles}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.coordinator_manager')}</Field.Label>
                                    <Input
                                        value={formData.coordinatorManager}
                                        onChange={(e) => handleChange('coordinatorManager', e.target.value)}
                                        {...inputStyles}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.coordinator_contact')}</Field.Label>
                                    <Input
                                        value={formData.coordinatorContact}
                                        onChange={(e) => handleChange('coordinatorContact', e.target.value)}
                                        {...inputStyles}
                                    />
                                </Field.Root>
                            </SimpleGrid>
                        </Box>

                        <Separator opacity={0.2} />

                        {/* Platform & Access */}
                        <Box>
                            <Heading size="sm" mb={4} color="brand.primary" textTransform="uppercase" letterSpacing="wider">
                                {t('crm.platform_info')}
                            </Heading>
                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.platform_type')}</Field.Label>
                                    <SelectRoot
                                        collection={platformTypeOptions}
                                        value={[formData.platformType || '']}
                                        onValueChange={(details) => handleChange('platformType', details.value[0])}
                                    >
                                        <SelectTrigger {...inputStyles}>
                                            <SelectValueText />
                                        </SelectTrigger>
                                        <SelectContent bg={{ _light: "white", _dark: "gray.900" }} zIndex="popover">
                                            {platformTypeOptions.items.map((item) => (
                                                <SelectItem item={item} key={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.domain')}</Field.Label>
                                    <Input
                                        value={formData.website}
                                        onChange={(e) => handleChange('website', e.target.value)}
                                        {...inputStyles}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.admin_username')}</Field.Label>
                                    <Input
                                        value={formData.adminUsername}
                                        onChange={(e) => handleChange('adminUsername', e.target.value)}
                                        {...inputStyles}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.password')}</Field.Label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                        {...inputStyles}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.app_name')}</Field.Label>
                                    <Input
                                        value={formData.appName}
                                        onChange={(e) => handleChange('appName', e.target.value)}
                                        {...inputStyles}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.report_url')}</Field.Label>
                                    <Input
                                        value={formData.reportUrl}
                                        onChange={(e) => handleChange('reportUrl', e.target.value)}
                                        {...inputStyles}
                                    />
                                </Field.Root>
                            </SimpleGrid>
                        </Box>

                        <Separator opacity={0.2} />

                        {/* Contact & Billing */}
                        <Box>
                            <Heading size="sm" mb={4} color="brand.primary" textTransform="uppercase" letterSpacing="wider">
                                {t('crm.contact_info')}
                            </Heading>
                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.phone')}</Field.Label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        {...inputStyles}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.address')}</Field.Label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => handleChange('address', e.target.value)}
                                        {...inputStyles}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.tax_id')}</Field.Label>
                                    <Input
                                        value={formData.billingInfo?.taxId}
                                        onChange={(e) => handleChange('billingInfo.taxId', e.target.value)}
                                        {...inputStyles}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>{t('crm.fields.email')}</Field.Label>
                                    <Input
                                        value={formData.billingInfo?.email}
                                        onChange={(e) => handleChange('billingInfo.email', e.target.value)}
                                        {...inputStyles}
                                    />
                                </Field.Root>
                            </SimpleGrid>
                        </Box>
                    </Stack>
                </DialogBody>

                <DialogFooter borderTop="1px solid" borderColor="border.subtle" px={6} py={4}>
                    <DialogActionTrigger asChild>
                        <Button variant="ghost" mr={3}>
                            {t('common.cancel')}
                        </Button>
                    </DialogActionTrigger>
                    <Button
                        colorScheme="brand"
                        onClick={handleSubmit}
                        bg="brand.primary"
                        color="white"
                        borderRadius="xl"
                        px={8}
                        _hover={{ bg: "brand.primary", opacity: 0.9, transform: "translateY(-1px)" }}
                    >
                        {t('common.save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    );
};
