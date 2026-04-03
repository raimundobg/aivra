import {
    Box, Heading, Text, VStack, SimpleGrid, Container, Flex,
    Button, Badge, HStack, Avatar, Table, Tabs, Icon, Separator,
    Grid, GridItem, Link as ChakraLink
} from "@chakra-ui/react";
import {
    Building2, Phone, Mail, Globe, Linkedin, Twitter,
    Tag, CreditCard, Users, Briefcase, History, ArrowLeft,
    Plus, Edit, MessageSquare
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useCustomers } from "../contexts/CustomerContext";
import { useEffect, useState } from "react";
import { poService } from "../services/poService";
import type { PurchaseOrder } from "../services/poService";
import { CustomerModal } from "../organisms/CustomerModal";
import { useTranslation } from "react-i18next";
import AccountManagerModal from "../organisms/AccountManagerModal";

export const CustomerDetailPage = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getCustomerById, getContactsByCustomerId, updateCustomer, accountManagers } = useCustomers();
    const [customerPOs, setCustomerPOs] = useState<PurchaseOrder[]>([]);
    const [isLoadingPOs, setIsLoadingPOs] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
    const [newAlias, setNewAlias] = useState("");

    const customer = getCustomerById(id || "");
    const contacts = getContactsByCustomerId(id || "");

    const handleAddAlias = async () => {
        if (!customer || !newAlias.trim()) return;
        const aliasesToAdd = newAlias.split(',').map(a => a.trim()).filter(a => a !== "");
        const currentAliases = customer.aliases || [];
        const updatedAliases = [...new Set([...currentAliases, ...aliasesToAdd])];

        await updateCustomer(customer.id, { aliases: updatedAliases });
        setNewAlias("");
    };

    const handleRemoveAlias = async (aliasToRemove: string) => {
        if (!customer) return;
        const updatedAliases = (customer.aliases || []).filter(a => a !== aliasToRemove);
        await updateCustomer(customer.id, { aliases: updatedAliases });
    };

    useEffect(() => {
        const fetchPOs = async () => {
            if (!customer) return;
            setIsLoadingPOs(true);
            try {
                const allPOs = await poService.getPurchaseOrders();
                // Filter POs by customer name (in a real app, use customerId)
                const filtered = allPOs.filter(po =>
                    po.client_name.toLowerCase().includes(customer.name.toLowerCase())
                );
                setCustomerPOs(filtered);
            } catch (error) {
                console.error("Error fetching customer POs:", error);
            } finally {
                setIsLoadingPOs(false);
            }
        };
        fetchPOs();
    }, [customer]);

    if (!customer) {
        return (
            <Container py="20" textAlign="center">
                <VStack gap="4">
                    <Heading>{t("common.error")}</Heading>
                    <Button onClick={() => navigate("/clients")}>{t("common.back")}</Button>
                </VStack>
            </Container>
        );
    }

    return (
        <Container maxW="7xl" py="8" animation="fadeIn 0.5s ease-out forwards">
            <VStack align="stretch" spaceY="8">
                {/* Navigation & Header */}
                <Flex justify="space-between" align="center">
                    <Button variant="ghost" onClick={() => navigate("/clients")} gap="2">
                        <ArrowLeft size={18} /> {t("common.back")}
                    </Button>
                    <HStack gap="3">
                        <Button variant="outline" borderRadius="xl" gap="2" onClick={() => setIsEditModalOpen(true)}>
                            <Edit size={16} /> {t("common.edit")}
                        </Button>
                        <Button bg="brand.primary" color="white" borderRadius="xl" gap="2">
                            <Plus size={16} /> Nueva PO
                        </Button>
                        <Button variant="surface" colorPalette="blue" borderRadius="xl" gap="2">
                            <History size={16} /> {t("po_list.title")}
                        </Button>
                    </HStack>
                </Flex>

                {isEditModalOpen && (
                    <CustomerModal
                        customerToEdit={customer}
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                    />
                )}

                <AccountManagerModal
                    manager={accountManagers.find(m => m.name === customer?.comercialManager) || null}
                    isOpen={isManagerModalOpen}
                    onClose={() => setIsManagerModalOpen(false)}
                />


                {/* Header Profile */}
                <Box bg="bg.surface" p="10" borderRadius="3xl" border="1px solid" borderColor="border.subtle" mb="12" position="relative" overflow="hidden">
                    <Flex align="start" gap="10" position="relative" zIndex="1" direction={{ base: "column", md: "row" }}>
                        <Avatar.Root size="2xl" flexShrink="0" borderRadius="3xl" bg="brand.primary/5" border="1px solid" borderColor="brand.primary/20" p="4" w="40" h="40">
                            <Building2 size={64} color="var(--chakra-colors-brand-primary)" />
                        </Avatar.Root>

                        <VStack align="start" flex="1" gap="2">
                            <HStack>
                                <Heading size="3xl" fontWeight="black">{customer.name}</Heading>
                                <Badge colorPalette="blue" variant="surface" borderRadius="full" px="3">
                                    {t(`crm.industry_labels.${customer.industry}`, { defaultValue: customer.industry })}
                                </Badge>
                                <Badge colorPalette="purple" variant="surface" borderRadius="full" px="3">
                                    {customer.clientType && customer.clientType !== 'undefined'
                                        ? t(`crm.client_type_labels.${customer.clientType}`, { defaultValue: customer.clientType })
                                        : t("crm.client_type_labels.Cliente Plataforma")}
                                </Badge>
                                <Badge
                                    colorPalette={
                                        customer.status === 'CLIENTE ACTIVO' ? 'green' :
                                            customer.status === 'DADO DE BAJA' ? 'red' :
                                                customer.status === 'ALIANZA' ? 'cyan' : 'gray'
                                    }
                                    variant="subtle"
                                    borderRadius="full"
                                    px="3"
                                >
                                    {t(`crm.status_labels.${customer.status || 'CLIENTE ACTIVO'}`, { defaultValue: customer.status })}
                                </Badge>
                            </HStack>
                            <Text color="fg.muted" fontSize="lg" maxW="2xl">
                                {customer.address}
                            </Text>
                            <HStack gap="6" mt="2" flexWrap="wrap">
                                <HStack gap="2" color="fg.muted">
                                    <Phone size={16} /> <Text fontSize="sm">{customer.phone}</Text>
                                </HStack>
                                <HStack gap="2" color="fg.muted">
                                    <Globe size={16} />
                                    <ChakraLink href={`https://${customer.website}`} target="_blank" fontSize="sm" _hover={{ color: "brand.primary" }}>
                                        {customer.website}
                                    </ChakraLink>
                                </HStack>
                                <HStack gap="2">
                                    {customer.socialMedia.map((social, i) => (
                                        <Badge key={i} variant="plain" p="0">
                                            {social.platform === 'LinkedIn' ? <Linkedin size={18} /> : <Twitter size={18} />}
                                        </Badge>
                                    ))}
                                </HStack>
                            </HStack>

                            {/* Account Manager Info */}
                            {customer.comercialManager && (
                                <Box
                                    mt="4"
                                    p="4"
                                    bg="bg.muted/30"
                                    borderRadius="2xl"
                                    border="1px solid"
                                    borderColor="border.subtle"
                                    w="full"
                                    cursor="pointer"
                                    onClick={() => setIsManagerModalOpen(true)}
                                    _hover={{ bg: "bg.muted/50", borderColor: "brand.primary/30", transform: "translateY(-2px)" }}
                                    transition="all 0.2s"
                                >
                                    <HStack gap="4">
                                        <Avatar.Root size="sm">
                                            <Avatar.Fallback name={customer.comercialManager} />
                                        </Avatar.Root>
                                        <VStack align="start" gap="0">
                                            <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase">{t("crm.fields.account_manager")}</Text>
                                            <Text fontWeight="bold">{customer.comercialManager}</Text>
                                            <HStack gap="4" mt="1">
                                                <HStack gap="1" color="fg.muted" fontSize="xs">
                                                    <Mail size={12} /> {customer.comercialContact}
                                                </HStack>
                                                {(() => {
                                                    const manager = accountManagers.find(m => m.name === customer.comercialManager);
                                                    return manager && manager.phone !== '-' && (
                                                        <HStack gap="1" color="fg.muted" fontSize="xs">
                                                            <Phone size={12} /> {manager.phone}
                                                        </HStack>
                                                    );
                                                })()}
                                            </HStack>
                                        </VStack>
                                    </HStack>
                                </Box>
                            )}
                        </VStack>
                        <VStack align={{ base: "stretch", md: "end" }} gap="4">
                            <Box textAlign={{ md: "right" }}>
                                <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase">{t("crm.fields.customer_since")}</Text>
                                <Heading size="md" color="brand.primary">
                                    {new Date(customer.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                </Heading>
                            </Box>
                            <Box textAlign={{ md: "right" }}>
                                <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase">{t("crm.kpis.total_pos")}</Text>
                                <Heading size="2xl" color="brand.primary">$452.8k</Heading>
                            </Box>
                            <HStack gap="1" flexWrap="wrap" justify={{ md: "flex-end" }}>
                                {customer.tags.map(tag => (
                                    <Badge key={tag} variant="subtle" colorPalette="gray">{tag}</Badge>
                                ))}
                            </HStack>
                        </VStack>
                    </Flex>
                </Box>

                {/* Main Content Tabs */}
                <Tabs.Root defaultValue="dashboard" variant="enclosed" borderRadius="xl">
                    <Tabs.List bg="bg.muted/20" p="1" borderRadius="2xl" border="none">
                        <Tabs.Trigger value="dashboard" py="3" px="6" borderRadius="xl">
                            <BarChart3 size={18} style={{ marginRight: '8px' }} /> {t("crm.tabs.dashboard")}
                        </Tabs.Trigger>
                        <Tabs.Trigger value="contacts" py="3" px="6" borderRadius="xl">
                            <Users size={18} style={{ marginRight: '8px' }} /> {t("crm.tabs.contacts")}
                        </Tabs.Trigger>
                        <Tabs.Trigger value="pos" py="3" px="6" borderRadius="xl">
                            <History size={18} style={{ marginRight: '8px' }} /> {t("crm.tabs.pos")}
                        </Tabs.Trigger>
                        <Tabs.Trigger value="billing" py="3" px="6" borderRadius="xl">
                            <CreditCard size={18} style={{ marginRight: '8px' }} /> {t("crm.tabs.billing")}
                        </Tabs.Trigger>
                        <Tabs.Trigger value="aliases" py="3" px="6" borderRadius="xl">
                            <Tag size={18} style={{ marginRight: '8px' }} /> {t("crm.tabs.aliases")}
                        </Tabs.Trigger>
                    </Tabs.List>

                    <Tabs.Content value="dashboard" py="6">
                        <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
                            <KPICard title={t("crm.kpis.total_pos")} value={customerPOs.length.toString()} icon={<History />} />
                            <KPICard title={t("crm.kpis.avg_ticket")} value="$12.4k" icon={<Briefcase />} />
                            <KPICard title={t("crm.kpis.active_projects")} value="4" icon={<Tag />} />
                        </SimpleGrid>
                        <Flex
                            mt="8" p="8" bg="bg.surface" borderRadius="3xl" border="1px solid"
                            borderColor="border.subtle" h="300px" align="center" justify="center"
                        >
                            <VStack color="fg.muted">
                                <BarChart3 size={48} strokeWidth={1} />
                                <Text>{t("crm.kpis.history_chart")}</Text>
                            </VStack>
                        </Flex>
                    </Tabs.Content>

                    <Tabs.Content value="contacts" py="6">
                        <Box bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle" overflow="hidden">
                            <Table.Root variant="outline">
                                <Table.Header bg="bg.muted/30">
                                    <Table.Row>
                                        <Table.ColumnHeader py="4">{t("crm.fields.name")}</Table.ColumnHeader>
                                        <Table.ColumnHeader>{t("crm.fields.role")}</Table.ColumnHeader>
                                        <Table.ColumnHeader>{t("crm.fields.contact")}</Table.ColumnHeader>
                                        <Table.ColumnHeader>{t("crm.fields.tax_id")}</Table.ColumnHeader>
                                        <Table.ColumnHeader textAlign="end">{t("po_list.actions")}</Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {contacts.map((contact) => (
                                        <Table.Row key={contact.id}>
                                            <Table.Cell>
                                                <HStack gap="3">
                                                    <Avatar.Root size="sm">
                                                        <Avatar.Fallback name={contact.name} />
                                                    </Avatar.Root>
                                                    <Text fontWeight="bold">{contact.name}</Text>
                                                </HStack>
                                            </Table.Cell>
                                            <Table.Cell>{contact.position}</Table.Cell>
                                            <Table.Cell>
                                                <VStack align="start" gap="0">
                                                    <HStack gap="1" color="fg.muted" fontSize="xs">
                                                        <Mail size={12} /> {contact.email}
                                                    </HStack>
                                                    <HStack gap="1" color="fg.muted" fontSize="xs">
                                                        <Phone size={12} /> {contact.phone}
                                                    </HStack>
                                                </VStack>
                                            </Table.Cell>
                                            <Table.Cell fontSize="xs">{contact.rut || "-"}</Table.Cell>
                                            <Table.Cell textAlign="end">
                                                <Button variant="ghost" size="sm"><MessageSquare size={16} /></Button>
                                                <Button variant="ghost" size="sm" color="status.error"><Edit size={16} /></Button>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        </Box>
                    </Tabs.Content>

                    <Tabs.Content value="pos" py="6">
                        <Box bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle" overflow="hidden">
                            <Table.Root variant="outline">
                                <Table.Header bg="bg.muted/30">
                                    <Table.Row>
                                        <Table.ColumnHeader py="4">{t("crm.fields.reference")}</Table.ColumnHeader>
                                        <Table.ColumnHeader>{t("crm.fields.course")}</Table.ColumnHeader>
                                        <Table.ColumnHeader>{t("crm.fields.date")}</Table.ColumnHeader>
                                        <Table.ColumnHeader>{t("po_list.status")}</Table.ColumnHeader>
                                        <Table.ColumnHeader textAlign="end">{t("crm.fields.amount")}</Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {isLoadingPOs ? (
                                        <Table.Row>
                                            <Table.Cell colSpan={5} textAlign="center" py="10">Cargando...</Table.Cell>
                                        </Table.Row>
                                    ) : customerPOs.length === 0 ? (
                                        <Table.Row>
                                            <Table.Cell colSpan={5} textAlign="center" py="10">No hay POs asociadas.</Table.Cell>
                                        </Table.Row>
                                    ) : customerPOs.map((po) => (
                                        <Table.Row key={po.id} _hover={{ bg: "bg.muted/10" }}>
                                            <Table.Cell>
                                                <Link to={`/po/${po.id}`}>
                                                    <Text fontWeight="bold" color="brand.primary">{po.order_number}</Text>
                                                </Link>
                                            </Table.Cell>
                                            <Table.Cell maxW="200px" truncate>{po.course_name}</Table.Cell>
                                            <Table.Cell fontSize="sm">{new Date(po.createdAt).toLocaleDateString()}</Table.Cell>
                                            <Table.Cell>
                                                <Badge
                                                    colorPalette={po.status === 'SUCCESS' ? 'green' : 'orange'}
                                                    variant="surface" borderRadius="full" px="2"
                                                >
                                                    {po.status}
                                                </Badge>
                                            </Table.Cell>
                                            <Table.Cell textAlign="end" fontWeight="bold">
                                                ${po.total_amount.toLocaleString()} {po.currency}
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        </Box>
                    </Tabs.Content>

                    <Tabs.Content value="billing" py="6">
                        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="8">
                            <GridItem>
                                <Box p="6" bg="bg.surface" borderRadius="2xl" border="1px solid" borderColor="border.subtle">
                                    <Heading size="sm" mb="4">{t("crm.headers.tax_data")}</Heading>
                                    <VStack align="stretch" gap="3">
                                        <InfoRow label={t("crm.fields.tax_id")} value={customer.billingInfo.taxId} />
                                        <InfoRow label={t("crm.fields.name")} value={customer.name} />
                                        <InfoRow label={t("crm.fields.industry")} value={t(`crm.industry_labels.${customer.industry}`, { defaultValue: customer.industry })} />
                                        <InfoRow label={t("crm.fields.address")} value={customer.billingInfo.address} />
                                    </VStack>
                                </Box>
                            </GridItem>
                            <GridItem>
                                <Box p="6" bg="bg.surface" borderRadius="2xl" border="1px solid" borderColor="border.subtle">
                                    <Heading size="sm" mb="4">{t("crm.headers.billing_channel")}</Heading>
                                    <VStack align="stretch" gap="3">
                                        <InfoRow label={t("crm.fields.email")} value={customer.billingInfo.email} />
                                        <InfoRow label={t("crm.billing_info.payment_method")} value="Transferencia (30 días)" />
                                        <Separator my="2" />
                                        <HStack justify="space-between">
                                            <Text fontSize="sm" color="fg.muted">{t("crm.billing_info.pending_docs")}</Text>
                                            <Badge colorPalette="red">2 {t("dashboard.critical")}</Badge>
                                        </HStack>
                                    </VStack>
                                </Box>
                            </GridItem>
                        </Grid>
                    </Tabs.Content>

                    <Tabs.Content value="aliases" py="6">
                        <Box p="8" bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle">
                            <VStack align="stretch" gap="6">
                                <Box>
                                    <Heading size="md" mb="2">{t("crm.alias_management.title")}</Heading>
                                    <Text color="fg.muted" fontSize="sm">{t("crm.alias_management.subtitle")}</Text>
                                </Box>

                                <HStack gap="3">
                                    <Box flex="1">
                                        <input
                                            value={newAlias}
                                            onChange={(e) => setNewAlias(e.target.value)}
                                            placeholder={t("crm.alias_management.placeholder")}
                                            style={{
                                                width: '100%',
                                                padding: '10px 16px',
                                                borderRadius: '12px',
                                                border: '1px solid var(--chakra-colors-border-subtle)',
                                                backgroundColor: 'var(--chakra-colors-bg-muted)',
                                                outline: 'none'
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddAlias()}
                                        />
                                    </Box>
                                    <Button colorPalette="blue" borderRadius="xl" px="8" onClick={handleAddAlias}>
                                        {t("crm.alias_management.add_btn")}
                                    </Button>
                                </HStack>

                                <Box>
                                    <HStack gap="2" flexWrap="wrap">
                                        {customer.aliases && customer.aliases.length > 0 ? (
                                            customer.aliases.map((alias) => (
                                                <Badge
                                                    key={alias}
                                                    variant="surface"
                                                    colorPalette="blue"
                                                    borderRadius="full"
                                                    px="3"
                                                    py="1"
                                                    display="flex"
                                                    alignItems="center"
                                                    gap="2"
                                                >
                                                    {alias}
                                                    <Box
                                                        as="span"
                                                        cursor="pointer"
                                                        onClick={() => handleRemoveAlias(alias)}
                                                        opacity="0.6"
                                                        _hover={{ opacity: 1 }}
                                                    >
                                                        ×
                                                    </Box>
                                                </Badge>
                                            ))
                                        ) : (
                                            <Text color="fg.muted" fontSize="sm" fontStyle="italic">
                                                {t("crm.alias_management.no_aliases")}
                                            </Text>
                                        )}
                                    </HStack>
                                </Box>
                            </VStack>
                        </Box>
                    </Tabs.Content>
                </Tabs.Root>
            </VStack>
        </Container>
    );
};

const KPICard = ({ title, value, icon }: any) => (
    <Box p="6" bg="bg.surface" borderRadius="2xl" border="1px solid" borderColor="border.subtle">
        <HStack gap="4">
            <Box color="brand.primary" bg="brand.primary/10" p="3" borderRadius="xl">
                {icon}
            </Box>
            <VStack align="start" gap="0">
                <Text fontSize="xs" color="fg.muted" fontWeight="bold" textTransform="uppercase">{title}</Text>
                <Heading size="xl">{value}</Heading>
            </VStack>
        </HStack>
    </Box>
);

const InfoRow = ({ label, value }: { label: string, value: string }) => (
    <Flex justify="space-between" fontSize="sm">
        <Text color="fg.muted">{label}</Text>
        <Text fontWeight="medium">{value}</Text>
    </Flex>
);

const BarChart3 = ({ size, style, strokeWidth }: any) => <Icon as={History} size={size} style={style} strokeWidth={strokeWidth} />;
