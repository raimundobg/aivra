import { Box, Heading, Text, VStack, Container, Flex, Table, Button, HStack, Badge } from "@chakra-ui/react";
import { Eye, Filter, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { poService } from "../services/poService";
import type { PurchaseOrder } from "../services/poService";
import { Link } from "react-router-dom";

export const PurchaseOrdersPage = () => {
    const { t } = useTranslation();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await poService.getPurchaseOrders();
                setOrders(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching orders:", error);
                // Fallback mock data with new schema
                setOrders([
                    {
                        id: "1",
                        order_number: "PO-2024-001",
                        client_name: "Scotiabank",
                        course_name: "Liderazgo Efectivo",
                        sence_code: "123456789",
                        status: "SUCCESS",
                        total_amount: 15400.50,
                        currency: "CLP",
                        objeciones: ["Falta código SENCE"],
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        init_course: "2024-06-01",
                        end_course: "2024-06-15",
                        otic: "OTIC SOFOFA",
                        otic_rol: "123-K",
                        tramo: "100%"
                    },
                    {
                        id: "2",
                        order_number: "PO-2024-002",
                        client_name: "Mining Corp",
                        course_name: "Seguridad Industrial",
                        sence_code: "987654321",
                        status: "PENDING_APPROVAL",
                        total_amount: 8200.00,
                        currency: "CLP",
                        objeciones: null,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        init_course: "2024-07-01",
                        end_course: "2024-07-05",
                        otic: "OTIC CCHC",
                        otic_rol: "456-7",
                        tramo: "50%"
                    },
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "SUCCESS":
                return <Badge bg="status.bg.success" color="status.success" borderRadius="full" px="3">{t("po_list.status_success")}</Badge>;
            case "PENDING_APPROVAL":
                return <Badge bg="status.bg.warning" color="status.warning" borderRadius="full" px="3">{t("po_list.status_pending")}</Badge>;
            case "DUPLICATE_SKIPPED":
                return <Badge bg="status.bg.error" color="status.error" borderRadius="full" px="3">{t("po_list.status_duplicate")}</Badge>;
            default:
                return <Badge borderRadius="full" px="3">{status}</Badge>;
        }
    };

    return (
        <Container maxW="6xl" py="10" animation="fadeIn 0.5s ease-out forwards">
            <VStack align="stretch" spaceY="10">
                <Flex justify="space-between" align="center" borderLeft="4px solid" borderColor="brand.accent" pl="6">
                    <Box>
                        <Heading size="3xl" fontWeight="bold" mb="2">
                            {t("po_list.management_title")}
                        </Heading>
                        <Text color="fg.muted" fontSize="lg">
                            {t("po_list.management_subtitle")}
                        </Text>
                    </Box>
                    <Button variant="outline" borderRadius="xl" gap="2">
                        <Filter size={18} />
                        {t("po_list.filter")}
                    </Button>
                </Flex>

                <Box
                    borderRadius="3xl"
                    overflow="hidden"
                    border="1px solid"
                    borderColor="border.subtle"
                    bg="bg.surface"
                    backdropBlur="20px"
                    boxShadow="glass"
                >
                    <Table.Root variant="outline">
                        <Table.Header bg="bg.muted/30">
                            <Table.Row>
                                <Table.ColumnHeader py="6">{t("po_list.order_no")}</Table.ColumnHeader>
                                <Table.ColumnHeader>{t("po_list.client")}</Table.ColumnHeader>
                                <Table.ColumnHeader>{t("po_list.course")}</Table.ColumnHeader>
                                <Table.ColumnHeader>{t("po_list.sence")}</Table.ColumnHeader>
                                <Table.ColumnHeader>{t("po_list.status")}</Table.ColumnHeader>
                                <Table.ColumnHeader>{t("po_list.total")}</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="end">{t("po_list.actions")}</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {isLoading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={7} textAlign="center" py="10">
                                        <Text color="fg.muted">{t("common.loading")}</Text>
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                orders.map((order) => (
                                    <Table.Row key={order.id} _hover={{ bg: "bg.muted/30" }}>
                                        <Table.Cell>
                                            <VStack align="start" gap="0">
                                                <Text fontWeight="bold">{order.order_number}</Text>
                                                {order.objeciones && order.objeciones.length > 0 && (
                                                    <HStack color="status.error" gap="1">
                                                        <AlertTriangle size={12} />
                                                        <Text fontSize="10px" fontWeight="bold">{t("po_list.observations")}</Text>
                                                    </HStack>
                                                )}
                                            </VStack>
                                        </Table.Cell>
                                        <Table.Cell>{order.client_name}</Table.Cell>
                                        <Table.Cell maxW="200px" truncate>{order.course_name}</Table.Cell>
                                        <Table.Cell>{order.sence_code}</Table.Cell>
                                        <Table.Cell>
                                            {getStatusBadge(order.status)}
                                        </Table.Cell>
                                        <Table.Cell fontWeight="bold">
                                            ${order.total_amount.toLocaleString()} {order.currency}
                                        </Table.Cell>
                                        <Table.Cell textAlign="end">
                                            <Link to={`/po/${order.id}`}>
                                                <Button variant="ghost" size="sm" gap="2" borderRadius="lg">
                                                    <Eye size={16} />
                                                    {t("po_list.view_detail")}
                                                </Button>
                                            </Link>
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            )}
                        </Table.Body>
                    </Table.Root>
                </Box>
            </VStack>
        </Container>
    );
};
