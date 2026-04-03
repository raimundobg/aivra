import { Box, Heading, Text, VStack, Container, Flex, Button, Input, HStack, Badge, Table, IconButton } from "@chakra-ui/react";
import { Users, Search, Plus, Building2, ExternalLink, Filter, Edit2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useCustomers } from "../contexts/CustomerContext";
import { useState } from "react";
import { CustomerModal } from "../organisms/CustomerModal";
import type { Customer } from "../types/customer";

export const CustomersPage = () => {
    const { t } = useTranslation();
    const { customers } = useCustomers();
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.industry.toLowerCase().includes(search.toLowerCase()) ||
        (c.tags && c.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
    );

    const handleAdd = () => {
        setSelectedCustomer(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'CLIENTE ACTIVO': return 'green';
            case 'CLIENTE INACTIVO': return 'gray';
            case 'DADO DE BAJA': return 'red';
            case 'ALIANZA': return 'cyan';
            default: return 'gray';
        }
    };

    return (
        <Container maxW="6xl" py="10" animation="fadeIn 0.5s ease-out forwards">
            <VStack align="stretch" spaceY="10">
                {/* Header Section */}
                <Flex justify="space-between" align="center" borderLeft="4px solid" borderColor="brand.accent" pl="6">
                    <Box>
                        <Heading size="3xl" fontWeight="bold" mb="2">
                            {t("nav.customers")}
                        </Heading>
                        <Text color="fg.muted" fontSize="lg">
                            {t("dashboard.summary")}
                        </Text>
                    </Box>
                    <Button
                        borderRadius="xl"
                        bg="brand.primary"
                        color="white"
                        gap="3"
                        h="14"
                        px="8"
                        _hover={{ transform: "translateY(-2px)", shadow: "xl" }}
                        onClick={handleAdd}
                    >
                        <Plus size={20} />
                        {t("crm.add_customer")}
                    </Button>
                </Flex>

                {/* Filters & Search */}
                <Flex gap="4" bg="bg.surface" p="4" borderRadius="2xl" border="1px solid" borderColor="border.subtle" boxShadow="sm">
                    <Box flex="1" position="relative">
                        <Box position="absolute" left="4" top="50%" transform="translateY(-50%)" color="fg.muted">
                            <Search size={18} />
                        </Box>
                        <Input
                            placeholder={t("components.showcase.search_shortcut")}
                            size="lg"
                            pl="12"
                            borderRadius="xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </Box>
                    <Button variant="outline" size="lg" borderRadius="xl" gap="2">
                        <Filter size={18} />
                        {t("po_list.filter")}
                    </Button>
                </Flex>

                {/* Customers Table */}
                <Box
                    borderRadius="3xl"
                    overflow="hidden"
                    border="1px solid"
                    borderColor="border.subtle"
                    bg="bg.surface"
                    boxShadow="glass"
                >
                    <Table.Root variant="outline">
                        <Table.Header bg="bg.muted/30">
                            <Table.Row>
                                <Table.ColumnHeader py="6">{t("crm.fields.name")}</Table.ColumnHeader>
                                <Table.ColumnHeader>{t("crm.fields.industry")}</Table.ColumnHeader>
                                <Table.ColumnHeader>{t("crm.fields.status")}</Table.ColumnHeader>
                                <Table.ColumnHeader>{t("crm.fields.website")}</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="end">{t("po_list.actions")}</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {filteredCustomers.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={5} textAlign="center" py="20">
                                        <VStack gap="2">
                                            <Users size={48} strokeWidth={1} />
                                            <Text fontWeight="bold">{t("po_detail.no_students")}</Text>
                                        </VStack>
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <Table.Row key={customer.id} _hover={{ bg: "bg.muted/30" }}>
                                        <Table.Cell>
                                            <HStack gap="3">
                                                <Flex
                                                    w="10" h="10"
                                                    bg="brand.primary/10"
                                                    color="brand.primary"
                                                    borderRadius="lg"
                                                    align="center"
                                                    justify="center"
                                                >
                                                    <Building2 size={20} />
                                                </Flex>
                                                <Box>
                                                    <Text fontWeight="bold">{customer.name}</Text>
                                                    <Text fontSize="xs" color="fg.muted">{customer.institutionId}</Text>
                                                </Box>
                                            </HStack>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge variant="surface" colorPalette="blue" borderRadius="full" px="2">
                                                {t(`crm.industry_labels.${customer.industry}`, { defaultValue: customer.industry })}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge variant="subtle" colorPalette={getStatusBadgeColor(customer.status)} borderRadius="full" px="2">
                                                {t(`crm.status_labels.${customer.status || 'CLIENTE ACTIVO'}`, { defaultValue: customer.status })}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Link to={`#`} onClick={(e) => { e.preventDefault(); window.open(`https://${customer.website}`, '_blank') }}>
                                                <HStack gap="1" color="brand.primary" fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                                                    <Text truncate maxW="150px">{customer.website}</Text>
                                                    <ExternalLink size={12} />
                                                </HStack>
                                            </Link>
                                        </Table.Cell>
                                        <Table.Cell textAlign="end">
                                            <HStack gap="2" justify="flex-end">
                                                <IconButton
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(customer)}
                                                    aria-label="Edit customer"
                                                >
                                                    <Edit2 size={16} />
                                                </IconButton>
                                                <Link to={`/clients/${customer.id}`}>
                                                    <Button variant="ghost" size="sm" borderRadius="lg">
                                                        {t("dashboard.view")}
                                                    </Button>
                                                </Link>
                                            </HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            )}
                        </Table.Body>
                    </Table.Root>
                </Box>
            </VStack>

            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                customerToEdit={selectedCustomer}
            />
        </Container>
    );
};

