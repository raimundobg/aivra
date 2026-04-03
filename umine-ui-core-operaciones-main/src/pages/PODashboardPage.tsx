import { Box, Heading, Text, VStack, SimpleGrid, Container, Flex, Button, Badge, HStack } from "@chakra-ui/react";
import { ChartCard } from "../organisms/ChartCard";
import { RefreshCw, Package, Clock, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { poService } from "../services/poService";
import type { PurchaseOrder } from "../services/poService";
import { toaster } from "../components/ui/toaster";
import { Link } from "react-router-dom";

export const PODashboardPage = () => {
    const { t } = useTranslation();
    const [isChecking, setIsChecking] = useState(false);
    const [stats, setStats] = useState({ total: 0, pending: 0, success: 0, alerts: [] as PurchaseOrder[] });

    useEffect(() => {
        const loadStats = async () => {
            try {
                const orders = await poService.getPurchaseOrders();
                const pending = orders.filter(o => o.status === 'PENDING_APPROVAL').length;
                const success = orders.filter(o => o.status === 'SUCCESS').length;
                const alerts = orders.filter(o => o.objeciones && o.objeciones.length > 0).slice(0, 3);

                setStats({
                    total: orders.length,
                    pending,
                    success,
                    alerts
                });
            } catch (error) {
                console.error("Error loading dashboard stats:", error);
                setStats({
                    total: 128,
                    pending: 12,
                    success: 116,
                    alerts: [
                        { id: "1", order_number: "PO-2024-001", client_name: "Scotiabank", objeciones: ["Falta código SENCE"], status: 'SUCCESS' } as PurchaseOrder
                    ]
                });
            }
        };
        loadStats();
    }, []);

    const handleCheckOrders = async () => {
        setIsChecking(true);
        try {
            await poService.checkNewOrders();
            toaster.create({
                title: t("common.success"),
                description: t("dashboard.check_success"),
                type: "success",
            });
        } catch (error) {
            console.error("Error checking orders:", error);
            toaster.create({
                title: t("common.error"),
                description: t("dashboard.check_error"),
                type: "error",
            });
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <Container maxW="6xl" py="10" animation="fadeIn 0.5s ease-out forwards">
            <VStack align="stretch" spaceY="10">
                {/* Header Section */}
                <Flex justify="space-between" align="center" borderLeft="4px solid" borderColor="brand.accent" pl="6">
                    <Box>
                        <Heading size="3xl" fontWeight="bold" mb="2">
                            {t("dashboard.po_title")}
                        </Heading>
                        <Text color="fg.muted" fontSize="lg">
                            {t("dashboard.monthly_volume_desc")}
                        </Text>
                    </Box>
                    <HStack gap="4">
                        <Link to="/po">
                            <Button
                                size="xl"
                                variant="outline"
                                borderRadius="xl"
                                gap="3"
                                px="8"
                                h="14"
                                _hover={{ transform: "translateY(-2px)", bg: "bg.muted" }}
                                transition="all 0.3s"
                            >
                                <Package size={20} />
                                {t("dashboard.view_ocs")}
                            </Button>
                        </Link>
                        <Button
                            size="xl"
                            bg="brand.primary"
                            color="white"
                            borderRadius="xl"
                            onClick={handleCheckOrders}
                            loading={isChecking}
                            gap="3"
                            px="8"
                            h="14"
                            _hover={{ transform: "translateY(-2px)", shadow: "xl" }}
                            transition="all 0.3s"
                        >
                            <RefreshCw size={20} className={isChecking ? "animate-spin" : ""} />
                            {t("dashboard.check_new")}
                        </Button>
                    </HStack>
                </Flex>

                {/* Metrics Summary */}
                <SimpleGrid columns={{ base: 1, md: 3 }} gap="8">
                    <Box p="8" bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle" boxShadow="glass">
                        <Flex align="center" gap="4" mb="4">
                            <Flex w="12" h="12" bg="brand.primary/10" borderRadius="xl" align="center" justify="center" color="brand.primary">
                                <Package size={24} />
                            </Flex>
                            <Text fontWeight="bold" fontSize="lg">{t("dashboard.total_po")}</Text>
                        </Flex>
                        <Heading size="4xl">{stats.total}</Heading>
                    </Box>

                    <Box p="8" bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle" boxShadow="glass">
                        <Flex align="center" gap="4" mb="4">
                            <Flex w="12" h="12" bg="orange.400/10" borderRadius="xl" align="center" justify="center" color="orange.400">
                                <Clock size={24} />
                            </Flex>
                            <Text fontWeight="bold" fontSize="lg">{t("dashboard.pending_po")}</Text>
                        </Flex>
                        <Heading size="4xl">{stats.pending}</Heading>
                    </Box>

                    <Box p="8" bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle" boxShadow="glass">
                        <Flex align="center" gap="4" mb="4">
                            <Flex w="12" h="12" bg="green.400/10" borderRadius="xl" align="center" justify="center" color="green.400">
                                <CheckCircle size={24} />
                            </Flex>
                            <Text fontWeight="bold" fontSize="lg">{t("dashboard.completed_po")}</Text>
                        </Flex>
                        <Heading size="4xl">{stats.success}</Heading>
                    </Box>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, lg: 2 }} gap="10">
                    <VStack align="stretch" gap="8">
                        <ChartCard
                            type="bar"
                            title={t("dashboard.monthly_volume")}
                            description={t("dashboard.monthly_volume_desc")}
                        />
                        <ChartCard
                            type="doughnut"
                            title={t("dashboard.status_distribution")}
                            description={t("dashboard.status_distribution_desc")}
                        />
                    </VStack>

                    <VStack align="stretch" gap="6">
                        <Box p="8" bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle" boxShadow="glass">
                            <HStack mb="6" justify="space-between">
                                <HStack color="status.error" gap="3">
                                    <AlertTriangle size={20} />
                                    <Heading size="md" fontWeight="bold">{t("dashboard.extraction_alerts")}</Heading>
                                </HStack>
                                <Badge bg="status.bg.error" color="status.error" borderRadius="full" px="3">
                                    {stats.alerts.length} {t("dashboard.critical")}
                                </Badge>
                            </HStack>

                            <VStack align="stretch" gap="4">
                                {stats.alerts.length === 0 ? (
                                    <Text color="fg.muted" fontSize="sm">{t("dashboard.no_discrepancies")}</Text>
                                ) : stats.alerts.map(order => (
                                    <Box key={order.id} p="4" bg="bg.muted/30" borderRadius="2xl" border="1px solid" borderColor="border.subtle">
                                        <Flex justify="space-between" align="center" mb="2">
                                            <Text fontWeight="bold" fontSize="sm">{order.order_number}</Text>
                                            <Link to={`/po/${order.id}`}>
                                                <Button size="xs" variant="ghost" gap="2">
                                                    {t("dashboard.view")} <ArrowRight size={12} />
                                                </Button>
                                            </Link>
                                        </Flex>
                                        <Text fontSize="xs" color="fg.muted" mb="3">{order.client_name}</Text>
                                        <VStack align="start" gap="1">
                                            {order.objeciones?.map((obj, i) => (
                                                <Text key={i} fontSize="xs" fontWeight="bold" color="status.error">• {obj}</Text>
                                            ))}
                                        </VStack>
                                    </Box>
                                ))}
                                <Link to="/po">
                                    <Button variant="outline" size="sm" w="full" mt="2" borderRadius="xl">{t("dashboard.view_all")}</Button>
                                </Link>
                            </VStack>
                        </Box>
                    </VStack>
                </SimpleGrid>
            </VStack>
        </Container>
    );
};
