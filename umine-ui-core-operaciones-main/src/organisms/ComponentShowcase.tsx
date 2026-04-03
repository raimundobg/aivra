import {
    Box,
    Heading,
    Text,
    VStack,
    SimpleGrid,
    Button,
    Flex,
    Badge,
    Tabs,
    Accordion,
    Table,
    HStack,
    Status,
    Progress,
    Kbd,
    Field,
    Input,
    Textarea
} from "@chakra-ui/react";
import {
    CheckCircle2,
    Clock,
    MoreVertical,
    Mail
} from "lucide-react";
import { useTranslation } from "react-i18next";

export const ComponentShowcase = () => {
    const { t } = useTranslation();
    return (
        <VStack align="stretch" spaceY="16">
            {/* Badges & Status */}
            <Box>
                <Heading size="xl" mb="6" fontFamily="heading" fontWeight="bold">{t("components.showcase.badges_status")}</Heading>
                <HStack spaceX="4" wrap="wrap" gap="4">
                    <Badge borderRadius="full" px="3" bg="status.bg.info" color="status.info">{t("components.showcase.new_release")}</Badge>
                    <Badge borderRadius="full" px="3" bg="status.bg.success" color="status.success">{t("common.success")}</Badge>
                    <Badge borderRadius="full" px="3" bg="status.bg.warning" color="status.warning">{t("components.showcase.under_review")}</Badge>
                    <Badge borderRadius="full" px="3" variant="outline" borderColor="brand.accent" color="brand.accent">Beta</Badge>
                    <Status.Root>
                        <Status.Indicator bg="status.success" />
                        {t("components.showcase.system_active")}
                    </Status.Root>
                    <Status.Root>
                        <Status.Indicator bg="status.info" />
                        {t("components.showcase.syncing")}
                    </Status.Root>
                </HStack>
            </Box>

            {/* Tabs Layout */}
            <Box>
                <Heading size="xl" mb="6" fontFamily="heading" fontWeight="bold">{t("components.showcase.tabs_cats")}</Heading>
                <Tabs.Root defaultValue="tab-1" variant="enclosed" maxW="md">
                    <Tabs.List bg="bg.muted" p="1" borderRadius="xl">
                        <Tabs.Trigger value="tab-1" borderRadius="lg">{t("components.showcase.overview")}</Tabs.Trigger>
                        <Tabs.Trigger value="tab-2" borderRadius="lg">{t("common.settings.title")}</Tabs.Trigger>
                        <Tabs.Trigger value="tab-3" borderRadius="lg">{t("components.showcase.history")}</Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="tab-1" pt="4">
                        <Text fontSize="sm" color="fg.muted">{t("components.showcase.overview_desc")}</Text>
                    </Tabs.Content>
                    <Tabs.Content value="tab-2" pt="4">
                        <Text fontSize="sm" color="fg.muted">{t("components.showcase.settings_desc")}</Text>
                    </Tabs.Content>
                    <Tabs.Content value="tab-3" pt="4">
                        <Text fontSize="sm" color="fg.muted">{t("components.showcase.history_desc")}</Text>
                    </Tabs.Content>
                </Tabs.Root>
            </Box>

            {/* Accordion / FAQ */}
            <Box mt="8">
                <Heading size="xl" mb="6" fontFamily="heading" fontWeight="bold">{t("components.showcase.acc_faq")}</Heading>
                <Accordion.Root defaultValue={["info"]} collapsible>
                    <Accordion.Item value="info" border="none">
                        <Accordion.ItemTrigger p="4" _hover={{ bg: "bg.muted" }} borderRadius="xl">
                            <HStack flex="1" justify="space-between">
                                <Text fontWeight="bold">{t("components.showcase.glass_q")}</Text>
                            </HStack>
                        </Accordion.ItemTrigger>
                        <Accordion.ItemContent p="4" color="fg.muted">
                            {t("components.showcase.glass_a")}
                        </Accordion.ItemContent>
                    </Accordion.Item>
                    <Accordion.Item value="config" border="none" mt="2">
                        <Accordion.ItemTrigger p="4" _hover={{ bg: "bg.muted" }} borderRadius="xl">
                            <HStack flex="1" justify="space-between">
                                <Text fontWeight="bold">{t("components.showcase.display_config")}</Text>
                            </HStack>
                        </Accordion.ItemTrigger>
                        <Accordion.ItemContent p="4" color="fg.muted">
                            {t("components.showcase.display_config_desc")}
                        </Accordion.ItemContent>
                    </Accordion.Item>
                </Accordion.Root>
            </Box>

            {/* Forms & Validation */}
            <Box>
                <Heading size="xl" mb="6" fontFamily="heading" fontWeight="bold">{t("components.showcase.inputs_forms")}</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="8">
                    <VStack align="stretch" spaceY="6">
                        <Field.Root>
                            <Field.Label fontWeight="bold">{t("components.showcase.email_label")}</Field.Label>
                            <Box position="relative">
                                <Input placeholder="name@company.com" h="12" pl="10" borderRadius="xl" />
                                <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="fg.muted">
                                    <Mail size={16} />
                                </Box>
                            </Box>
                        </Field.Root>
                        <Field.Root>
                            <Field.Label fontWeight="bold">{t("components.showcase.bio_label")}</Field.Label>
                            <Textarea placeholder={t("components.showcase.bio_placeholder")} borderRadius="xl" />
                            <Field.HelperText>{t("components.showcase.bio_helper")}</Field.HelperText>
                        </Field.Root>
                    </VStack>
                    <VStack align="stretch" spaceY="4">
                        <Text fontWeight="bold" fontSize="sm">{t("components.showcase.sys_progress")}</Text>
                        <Progress.Root value={75} shape="rounded">
                            <Progress.Track h="2" bg="bg.muted">
                                <Progress.Range bg="brand.primary" />
                            </Progress.Track>
                        </Progress.Root>
                        <Flex justify="space-between">
                            <HStack>
                                <Kbd>⌘</Kbd> <Kbd>K</Kbd>
                                <Text fontSize="xs" color="fg.muted">{t("components.showcase.search_shortcut")}</Text>
                            </HStack>
                            <Text fontSize="xs" fontWeight="bold">{t("components.showcase.up_to_date")}</Text>
                        </Flex>
                    </VStack>
                </SimpleGrid>
            </Box>

            {/* Data Table */}
            <Box>
                <Heading size="xl" mb="6" fontFamily="heading" fontWeight="bold">{t("components.showcase.data_tables")}</Heading>
                <Box
                    borderRadius="2xl"
                    overflow="hidden"
                    border="1px solid"
                    borderColor="border.subtle"
                    bg="bg.surface"
                    backdropBlur="16px"
                >
                    <Table.Root variant="outline" size="sm">
                        <Table.Header bg="bg.muted/50">
                            <Table.Row>
                                <Table.ColumnHeader>{t("components.showcase.client")}</Table.ColumnHeader>
                                <Table.ColumnHeader>{t("components.showcase.status")}</Table.ColumnHeader>
                                <Table.ColumnHeader>{t("components.showcase.progress")}</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="end">{t("components.showcase.actions")}</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {[
                                { name: "Scotiabank", status: "completed", progress: 100 },
                                { name: "Mining Corp", status: "processing", progress: 45 },
                                { name: "UMine Internal", status: "pending", progress: 12 }
                            ].map((row) => (
                                <Table.Row key={row.name} _hover={{ bg: "bg.muted/30" }}>
                                    <Table.Cell fontWeight="bold">{row.name}</Table.Cell>
                                    <Table.Cell>
                                        <HStack spaceX="1">
                                            {row.status === "completed" ? <CheckCircle2 size={14} color="green" /> : <Clock size={14} color="orange" />}
                                            <Text fontSize="xs" textTransform="capitalize">{t(`components.showcase.${row.status}`)}</Text>
                                        </HStack>
                                    </Table.Cell>
                                    <Table.Cell w="150px">
                                        <Progress.Root value={row.progress}>
                                            <Progress.Track h="1" bg="bg.muted">
                                                <Progress.Range bg={row.status === 'completed' ? 'status.success' : 'brand.primary'} />
                                            </Progress.Track>
                                        </Progress.Root>
                                    </Table.Cell>
                                    <Table.Cell textAlign="end">
                                        <Button variant="ghost" size="xs" p="1"><MoreVertical size={14} /></Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Box>
            </Box>
        </VStack>
    );
};
