import { Box, Heading, Text, VStack, SimpleGrid, Container, Flex, Button, Badge, HStack, Avatar, Table } from "@chakra-ui/react";
import { ChartCard } from "../organisms/ChartCard";
import { Users, Building2, BarChart3, ArrowUpRight, TrendingUp, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export const DashboardPage = () => {
    const { t } = useTranslation();

    // Dummy data for clients
    const topClients = [
        { name: "Scotiabank Chile", industry: "Banking", poCount: 45, status: "Active", revenue: "$125.4k" },
        { name: "Anglo American", industry: "Mining", poCount: 32, status: "Active", revenue: "$98.2k" },
        { name: "Walmart Latam", industry: "Retail", poCount: 28, status: "On Hold", revenue: "$45.0k" },
        { name: "Enel Distribución", industry: "Energy", poCount: 15, status: "Active", revenue: "$32.1k" },
    ];

    return (
        <Container maxW="6xl" py="10" animation="fadeIn 0.5s ease-out forwards">
            <VStack align="stretch" spaceY="10">
                {/* Header Section */}
                <Flex justify="space-between" align="center" borderLeft="4px solid" borderColor="brand.accent" pl="6">
                    <Box>
                        <Heading size="3xl" fontWeight="bold" mb="2">
                            {t("dashboard.general_title")}
                        </Heading>
                        <Text color="fg.muted" fontSize="lg">
                            {t("dashboard.summary")}
                        </Text>
                    </Box>
                    <HStack gap="4">
                        <Button variant="outline" borderRadius="xl" gap="2" h="12">
                            <Globe size={18} />
                            {t("dashboard.global_report")}
                        </Button>
                    </HStack>
                </Flex>

                {/* General Metrics */}
                <SimpleGrid columns={{ base: 1, md: 4 }} gap="6">
                    <MetricCard
                        icon={<Building2 size={24} />}
                        label={t("dashboard.companies")}
                        value="24"
                        change="+12%"
                        color="blue.400"
                    />
                    <MetricCard
                        icon={<Users size={24} />}
                        label={t("dashboard.active_users")}
                        value="1,240"
                        change="+5.4%"
                        color="purple.400"
                    />
                    <MetricCard
                        icon={<BarChart3 size={24} />}
                        label={t("dashboard.total_po")}
                        value="128"
                        change="+18%"
                        color="brand.primary"
                    />
                    <MetricCard
                        icon={<TrendingUp size={24} />}
                        label={t("dashboard.revenue_est")}
                        value="$315k"
                        change="+22%"
                        color="green.400"
                    />
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, lg: 3 }} gap="8">
                    {/* Top Clients Table */}
                    <Box gridColumn={{ lg: "span 2" }} p="8" bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle" boxShadow="glass">
                        <Flex justify="space-between" align="center" mb="6">
                            <Heading size="md" fontWeight="bold">{t("dashboard.top_clients")}</Heading>
                            <Button variant="ghost" size="sm" color="brand.primary">{t("dashboard.view_all")}</Button>
                        </Flex>
                        <Table.Root variant="outline" size="sm">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>{t("dashboard.company")}</Table.ColumnHeader>
                                    <Table.ColumnHeader>{t("dashboard.courses_po")}</Table.ColumnHeader>
                                    <Table.ColumnHeader>{t("po_list.status")}</Table.ColumnHeader>
                                    <Table.ColumnHeader textAlign="end">{t("dashboard.billing")}</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {topClients.map((client, i) => (
                                    <Table.Row key={i} _hover={{ bg: "bg.muted/30" }}>
                                        <Table.Cell>
                                            <HStack gap="3">
                                                <Avatar.Root size="sm">
                                                    <Avatar.Fallback name={client.name} />
                                                </Avatar.Root>
                                                <Box>
                                                    <Text fontWeight="bold" fontSize="sm">{client.name}</Text>
                                                    <Text fontSize="xs" color="fg.muted">{client.industry}</Text>
                                                </Box>
                                            </HStack>
                                        </Table.Cell>
                                        <Table.Cell fontWeight="medium">{client.poCount}</Table.Cell>
                                        <Table.Cell>
                                            <Badge
                                                variant="surface"
                                                bg={client.status === "Active" ? "status.bg.success" : "status.bg.warning"}
                                                color={client.status === "Active" ? "status.success" : "status.warning"}
                                                borderRadius="full"
                                                px="2"
                                            >
                                                {client.status === "Active" ? t("dashboard.active") : t("dashboard.on_hold")}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell textAlign="end" fontWeight="bold">{client.revenue}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>

                    {/* Operations Quick Link */}
                    <Box p="8" bg="brand.primary" color="white" borderRadius="3xl" boxShadow="xl" position="relative" overflow="hidden">
                        <Box position="absolute" top="-10" right="-10" w="40" h="40" bg="white/10" borderRadius="full" />
                        <VStack align="start" h="full" justify="space-between">
                            <Box>
                                <Heading size="lg" mb="2">{t("dashboard.core_operations_title")}</Heading>
                                <Text opacity="0.8" fontSize="sm" mb="6">
                                    {t("dashboard.core_operations_desc")}
                                </Text>
                            </Box>
                            <Link to="/po/dashboard" style={{ width: '100%' }}>
                                <Button w="full" bg="white" color="brand.primary" borderRadius="xl" h="12" gap="2" _hover={{ transform: "scale(1.02)" }}>
                                    {t("dashboard.view_ocs")} <ArrowUpRight size={18} />
                                </Button>
                            </Link>
                        </VStack>
                    </Box>
                </SimpleGrid>

                {/* Secondary Charts */}
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="8">
                    <ChartCard
                        type="line"
                        title={t("dashboard.customer_growth")}
                        description={t("dashboard.new_companies_vs_prev")}
                    />
                    <Box p="8" bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle" boxShadow="glass">
                        <Heading size="md" mb="6">{t("dashboard.recent_activity")}</Heading>
                        <VStack align="stretch" gap="4">
                            {[
                                { user: "Admin", action: t("dashboard.activity.action_approved") + " PO-2024-001", time: t("dashboard.activity.time_min") + " 5 min" },
                                { user: "Sistema", action: t("dashboard.activity.action_extracted") + " 12 nuevos estudiantes", time: t("dashboard.activity.time_min") + " 15 min" },
                                { user: "M. Soto", action: t("dashboard.activity.action_created") + " Anglo American", time: t("dashboard.activity.time_hour") + " 1 hora" },
                            ].map((act, i) => (
                                <HStack key={i} gap="4">
                                    <Box w="2" h="2" bg="brand.accent" borderRadius="full" />
                                    <Box flex="1">
                                        <Text fontSize="sm"><Text as="span" fontWeight="bold">{act.user}</Text> {act.action}</Text>
                                        <Text fontSize="xs" color="fg.muted">{act.time}</Text>
                                    </Box>
                                </HStack>
                            ))}
                        </VStack>
                    </Box>
                </SimpleGrid>
            </VStack>
        </Container>
    );
};

const MetricCard = ({ icon, label, value, change, color }: any) => (
    <Box p="6" bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle" boxShadow="glass">
        <Flex align="center" gap="3" mb="4">
            <Box color={color}>{icon}</Box>
            <Text fontWeight="bold" fontSize="sm" color="fg.muted">{label}</Text>
        </Flex>
        <Flex align="baseline" gap="3">
            <Heading size="2xl">{value}</Heading>
            <Text fontSize="xs" fontWeight="bold" color="green.400">{change}</Text>
        </Flex>
    </Box>
);
