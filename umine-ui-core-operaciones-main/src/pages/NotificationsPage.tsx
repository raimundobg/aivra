import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Grid,
    Button,
    Separator,
    Table,
    Badge,
    Flex
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Info, AlertTriangle, XCircle, Bell, Loader2 } from "lucide-react";
import { Alert } from "../components/ui/alert";
import { Status } from "../components/ui/status";
import { toaster } from "../components/ui/toaster";
import { GlassPanel } from "../atoms/GlassPanel";

export const NotificationsPage = () => {
    const { t } = useTranslation();

    const triggerToast = (type: "success" | "error" | "warning" | "info" | "loading") => {
        const messages = {
            success: t("notifications_page.playground.show_success"),
            info: t("notifications_page.playground.show_info"),
            warning: t("notifications_page.playground.show_warning"),
            error: t("notifications_page.playground.show_error"),
            loading: t("notifications_page.playground.show_loading")
        };

        toaster.create({
            title: t(`common.${type}`),
            description: messages[type],
            type: type === "loading" ? "info" : type,
        });
    };

    const CodeBlock = ({ code }: { code: string }) => (
        <Box bg="gray.900" color="brand.accent" p="4" borderRadius="xl" fontSize="xs" fontFamily="mono" overflowX="auto" border="1px solid" borderColor="whiteAlpha.200">
            <pre>{code}</pre>
        </Box>
    );

    return (
        <Container maxW="6xl" py="20" animation="fadeIn 0.5s ease-out forwards">
            <VStack align="stretch" spaceY="16">
                {/* Hero Section */}
                <VStack align="start" spaceY="4">
                    <Badge bg="brand.primary" color="button.primary.fg" variant="solid" px="3" py="1" borderRadius="full" textTransform="uppercase" letterSpacing="widest" fontSize="xs" fontWeight="bold">
                        {t("nav.design_system_label")}
                    </Badge>
                    <Heading as="h1" size="7xl" fontWeight="black" letterSpacing="tighter" color="heading.primary">
                        {t("notifications_page.title")}
                    </Heading>
                    <Text fontSize="xl" color="description.primary" maxW="3xl">
                        {t("notifications_page.subtitle")}
                    </Text>
                </VStack>

                <Separator borderColor="border.subtle" />

                {/* Conceptual Framework */}
                <Box>
                    <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap="12">
                        <VStack align="start" spaceY="4">
                            <Heading as="h2" size="3xl" fontWeight="black" color="heading.secondary">
                                {t("notifications_page.intro_title")}
                            </Heading>
                            <Text color="description.primary">
                                {t("notifications_page.intro_desc")}
                            </Text>
                        </VStack>
                        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="6">
                            <GlassPanel p="6" spaceY="4">
                                <Heading size="md" fontWeight="bold" display="flex" alignItems="center" gap="2" color="heading.secondary">
                                    <Bell size={20} /> Visibility
                                </Heading>
                                <Text fontSize="sm" color="description.primary">Important but not intrusive. Use subtle animations and high-contrast tokens.</Text>
                            </GlassPanel>
                            <GlassPanel p="6" spaceY="4">
                                <Heading size="md" fontWeight="bold" display="flex" alignItems="center" gap="2" color="heading.secondary">
                                    <Info size={20} /> Context
                                </Heading>
                                <Text fontSize="sm" color="description.primary">Place notifications where the action happened or in common system-wide areas.</Text>
                            </GlassPanel>
                        </Grid>
                    </Grid>
                </Box>

                {/* Semantic Types */}
                <VStack align="stretch" spaceY="8">
                    <Heading as="h3" size="3xl" fontWeight="black" color="heading.secondary">
                        {t("notifications_page.types.title")}
                    </Heading>
                    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" }} gap="6">
                        {/* Success */}
                        <GlassPanel p="6" spaceY="4" borderTop="4px solid" borderTopColor="status.success">
                            <HStack color="status.success">
                                <CheckCircle2 size={24} />
                                <Heading size="lg" fontWeight="bold">{t("notifications_page.types.success")}</Heading>
                            </HStack>
                            <Text fontSize="sm" color="fg.muted">{t("notifications_page.types.success_desc")}</Text>
                            <Alert colorPalette="gray" title={t("common.success")} bg="status.success/10" color="status.success">Action completed successfully.</Alert>
                            <Status value="success">System Ready</Status>
                        </GlassPanel>

                        {/* Info */}
                        <GlassPanel p="6" spaceY="4" borderTop="4px solid" borderTopColor="status.info">
                            <HStack color="status.info">
                                <Info size={24} />
                                <Heading size="lg" fontWeight="bold">{t("notifications_page.types.info")}</Heading>
                            </HStack>
                            <Text fontSize="sm" color="fg.muted">{t("notifications_page.types.info_desc")}</Text>
                            <Alert colorPalette="gray" title={t("common.info")} bg="status.info/10" color="status.info">New updates are available.</Alert>
                            <Status value="info">Scanning Portfolio</Status>
                        </GlassPanel>

                        {/* Warning */}
                        <GlassPanel p="6" spaceY="4" borderTop="4px solid" borderTopColor="status.warning">
                            <HStack color="status.warning">
                                <AlertTriangle size={24} />
                                <Heading size="lg" fontWeight="bold">{t("notifications_page.types.warning")}</Heading>
                            </HStack>
                            <Text fontSize="sm" color="fg.muted">{t("notifications_page.types.warning_desc")}</Text>
                            <Alert colorPalette="gray" title={t("common.warning")} bg="status.warning/10" color="status.warning">Unexpected behavior detected.</Alert>
                            <Status value="warning">Connection Unstable</Status>
                        </GlassPanel>

                        {/* Error */}
                        <GlassPanel p="6" spaceY="4" borderTop="4px solid" borderTopColor="status.error">
                            <HStack color="status.error">
                                <XCircle size={24} />
                                <Heading size="lg" fontWeight="bold">{t("notifications_page.types.error")}</Heading>
                            </HStack>
                            <Text fontSize="sm" color="fg.muted">{t("notifications_page.types.error_desc")}</Text>
                            <Alert colorPalette="gray" title={t("common.error")} bg="status.error/10" color="status.error">Failed to connect to the engine.</Alert>
                            <Status value="error">Service Down</Status>
                        </GlassPanel>

                        {/* Loading */}
                        <GlassPanel p="6" spaceY="4" borderTop="4px solid" borderTopColor="brand.primary">
                            <HStack color="brand.primary">
                                <Loader2 size={24} className="animate-spin" />
                                <Heading size="lg" fontWeight="bold">{t("notifications_page.types.loading")}</Heading>
                            </HStack>
                            <Text fontSize="sm" color="fg.muted">{t("notifications_page.types.loading_desc")}</Text>
                            <HStack bg="bg.muted" p="3" borderRadius="lg" w="full">
                                <Loader2 size={16} className="animate-spin" />
                                <Text fontSize="xs" fontWeight="bold">Processing AI theme...</Text>
                            </HStack>
                        </GlassPanel>
                    </Grid>
                </VStack>

                <Separator borderColor="border.subtle" />

                {/* Specific Components Documentation */}
                <VStack align="stretch" spaceY="20">
                    <Heading as="h3" size="4xl" fontWeight="black" color="heading.secondary">
                        {t("notifications_page.components.title")}
                    </Heading>

                    {/* Toast Section */}
                    <Box spaceY="8">
                        <VStack align="start" spaceY="2">
                            <Heading size="2xl" fontWeight="bold" color="heading.secondary">{t("notifications_page.components.toast_title")}</Heading>
                            <Text color="description.primary">{t("notifications_page.components.toast_desc")}</Text>
                        </VStack>
                        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap="10">
                            <VStack align="stretch" spaceY="6">
                                <GlassPanel p="6" spaceY="4">
                                    <Heading size="md" color="brand.primary">Usage Example</Heading>
                                    <CodeBlock code={`import { toaster } from "@/components/ui/toaster";\n\ntoaster.create({\n  title: "Action Saved",\n  description: "Changes applied successfully.",\n  type: "success",\n});`} />
                                </GlassPanel>
                                <Table.Root size="sm" variant="outline">
                                    <Table.Header bg="whiteAlpha.50">
                                        <Table.Row>
                                            <Table.ColumnHeader>Prop</Table.ColumnHeader>
                                            <Table.ColumnHeader>Type</Table.ColumnHeader>
                                            <Table.ColumnHeader>Description</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        <Table.Row><Table.Cell fontWeight="bold">title</Table.Cell><Table.Cell>string</Table.Cell><Table.Cell>Main heading of the toast.</Table.Cell></Table.Row>
                                        <Table.Row><Table.Cell fontWeight="bold">description</Table.Cell><Table.Cell>string</Table.Cell><Table.Cell>Secondary detail message.</Table.Cell></Table.Row>
                                        <Table.Row><Table.Cell fontWeight="bold">type</Table.Cell><Table.Cell>"info" | "success" | ...</Table.Cell><Table.Cell>Defines color and icon.</Table.Cell></Table.Row>
                                    </Table.Body>
                                </Table.Root>
                            </VStack>
                            <VStack align="stretch" spaceY="6">
                                <GlassPanel p="6" bg="status.success/5">
                                    <Heading size="sm" color="status.success" mb="2">DO</Heading>
                                    <Text fontSize="sm">Use for immediate feedback on user actions that aren't critical to stay on screen.</Text>
                                </GlassPanel>
                                <GlassPanel p="6" bg="status.error/5">
                                    <Heading size="sm" color="status.error" mb="2">DON'T</Heading>
                                    <Text fontSize="sm">Don't put complex actions or long paragraphs inside a toast. Keep it brief.</Text>
                                </GlassPanel>
                            </VStack>
                        </Grid>
                    </Box>

                    {/* Inline Alert Section */}
                    <Box spaceY="8">
                        <VStack align="start" spaceY="2">
                            <Heading size="2xl" fontWeight="bold" color="heading.secondary">{t("notifications_page.components.alert_title")}</Heading>
                            <Text color="description.primary">{t("notifications_page.components.alert_desc")}</Text>
                        </VStack>
                        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap="10">
                            <VStack align="stretch" spaceY="6">
                                <GlassPanel p="6" spaceY="4">
                                    <Heading size="md" color="cyan.500">Usage Example</Heading>
                                    <CodeBlock code={`import { Alert } from "@/components/ui/alert";\n\n<Alert colorPalette="blue" title="Maintenance">\n  The system will be offline for 5 minutes.\n</Alert>`} />
                                </GlassPanel>
                                <Alert colorPalette="blue" title="System Info">Note: This is a persistent inline alert.</Alert>
                            </VStack>
                            <VStack align="stretch" spaceY="6">
                                <GlassPanel p="6" bg="status.success/5">
                                    <Heading size="sm" color="status.success" mb="2">DO</Heading>
                                    <Text fontSize="sm">Use for persistent information that the user needs to refer to while working on a form or page.</Text>
                                </GlassPanel>
                                <GlassPanel p="6" bg="status.error/5">
                                    <Heading size="sm" color="status.error" mb="2">DON'T</Heading>
                                    <Text fontSize="sm">Don't stack more than two alerts in the same section. It creates visual fatigue.</Text>
                                </GlassPanel>
                            </VStack>
                        </Grid>
                    </Box>

                    {/* Banner Section */}
                    <Box spaceY="8">
                        <VStack align="start" spaceY="2">
                            <Heading size="2xl" fontWeight="bold" color="heading.secondary">{t("notifications_page.components.banner_title")}</Heading>
                            <Text color="description.primary">{t("notifications_page.components.banner_desc")}</Text>
                        </VStack>
                        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap="10">
                            <VStack align="stretch" spaceY="6">
                                <GlassPanel p="0" overflow="hidden">
                                    <Box bg="orange.500" color="white" p="3" textAlign="center" fontWeight="bold" fontSize="sm">
                                        <HStack justify="center" gap="4">
                                            <AlertTriangle size={16} />
                                            <Text>Limited Access: Your subscription expires in 2 days. Update now.</Text>
                                            <Button size="xs" variant="outline" color="white" borderColor="whiteAlpha.400">Renew</Button>
                                        </HStack>
                                    </Box>
                                    <Box p="6">
                                        <Heading size="sm" color="cyan.500" mb="4">Full-Width Implementation</Heading>
                                        <CodeBlock code={`// A Banner is a full-width Alert placed at the top of a container\n<Box w="full" bg="orange.500" p="3" position="sticky" top="0">\n  <BannerHeader />\n</Box>`} />
                                    </Box>
                                </GlassPanel>
                            </VStack>
                            <VStack align="stretch" spaceY="4">
                                <GlassPanel p="6" bg="status.success/5">
                                    <Heading size="sm" color="status.success" mb="2">DO</Heading>
                                    <Text fontSize="sm">Use for critical systemic messages that affect the entire user journey.</Text>
                                </GlassPanel>
                                <GlassPanel p="6" bg="status.error/5">
                                    <Heading size="sm" color="status.error" mb="2">DON'T</Heading>
                                    <Text fontSize="sm">Don't use banners for minor interactions. They are high-gravity components.</Text>
                                </GlassPanel>
                            </VStack>
                        </Grid>
                    </Box>
                </VStack>

                {/* Behavioral & UX Rules */}
                <Box>
                    <Heading as="h3" size="3xl" fontWeight="black" mb="8">
                        {t("notifications_page.ux_rules.title")}
                    </Heading>
                    <GlassPanel overflow="hidden">
                        <Table.Root size="lg" variant="outline">
                            <Table.Header bg="whiteAlpha.50">
                                <Table.Row>
                                    <Table.ColumnHeader color="brand.primary" fontWeight="black">Aspect</Table.ColumnHeader>
                                    <Table.ColumnHeader color="brand.primary" fontWeight="black">Guideline / Rule</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                <Table.Row>
                                    <Table.Cell fontWeight="bold">{t("notifications_page.ux_rules.duration_label")}</Table.Cell>
                                    <Table.Cell>
                                        <VStack align="start" gap="1">
                                            <Text fontSize="sm">{t("notifications_page.ux_rules.timeout_success")}</Text>
                                            <Text fontSize="sm">{t("notifications_page.ux_rules.timeout_error")}</Text>
                                        </VStack>
                                    </Table.Cell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.Cell fontWeight="bold">{t("notifications_page.ux_rules.stacking_label")}</Table.Cell>
                                    <Table.Cell fontSize="sm">{t("notifications_page.ux_rules.stacking_desc")}</Table.Cell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.Cell fontWeight="bold">{t("notifications_page.ux_rules.accessibility_label")}</Table.Cell>
                                    <Table.Cell fontSize="sm">{t("notifications_page.ux_rules.accessibility_desc")}</Table.Cell>
                                </Table.Row>
                            </Table.Body>
                        </Table.Root>
                    </GlassPanel>

                    <Alert colorPalette="blue" mt="8" title="Best Practice">
                        Don't use notifications for primary navigation or critical data that must be always visible. Notifications are for feedback and status updates.
                    </Alert>
                </Box>

                {/* Interactive Playground */}
                <VStack align="stretch" spaceY="8">
                    <Heading as="h3" size="4xl" fontWeight="black">
                        {t("notifications_page.playground.title")}
                    </Heading>
                    <GlassPanel p="10">
                        <Flex wrap="wrap" gap="4">
                            <Button
                                bg="status.success"
                                color="button.primary.fg"
                                _hover={{ bg: "status.success", opacity: 0.8 }}
                                onClick={() => triggerToast("success")}
                                borderRadius="xl"
                                fontWeight="bold"
                            >
                                <CheckCircle2 size={18} style={{ marginRight: '8px' }} />
                                {t("notifications_page.playground.show_success")}
                            </Button>
                            <Button
                                bg="status.info"
                                color="button.primary.fg"
                                _hover={{ bg: "status.info", opacity: 0.8 }}
                                onClick={() => triggerToast("info")}
                                borderRadius="xl"
                                fontWeight="bold"
                            >
                                <Info size={18} style={{ marginRight: '8px' }} />
                                {t("notifications_page.playground.show_info")}
                            </Button>
                            <Button
                                bg="status.warning"
                                color="button.primary.fg"
                                _hover={{ bg: "status.warning", opacity: 0.8 }}
                                onClick={() => triggerToast("warning")}
                                borderRadius="xl"
                                fontWeight="bold"
                            >
                                <AlertTriangle size={18} style={{ marginRight: '8px' }} />
                                {t("notifications_page.playground.show_warning")}
                            </Button>
                            <Button
                                bg="status.error"
                                color="button.primary.fg"
                                _hover={{ bg: "status.error", opacity: 0.8 }}
                                onClick={() => triggerToast("error")}
                                borderRadius="xl"
                                fontWeight="bold"
                            >
                                <XCircle size={18} style={{ marginRight: '8px' }} />
                                {t("notifications_page.playground.show_error")}
                            </Button>
                            <Button
                                variant="outline"
                                borderColor="brand.primary"
                                color="brand.primary"
                                _hover={{ bg: "brand.primary/10" }}
                                onClick={() => triggerToast("loading")}
                                borderRadius="xl"
                                fontWeight="bold"
                            >
                                <Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} />
                                {t("notifications_page.playground.show_loading")}
                            </Button>
                        </Flex>
                    </GlassPanel>
                </VStack>
            </VStack>
        </Container>
    );
};
