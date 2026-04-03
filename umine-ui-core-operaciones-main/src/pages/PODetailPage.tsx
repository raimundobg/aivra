import { Box, Heading, Text, VStack, Container, Flex, Table, Button, Badge, Separator, SimpleGrid, HStack } from "@chakra-ui/react";
import { ArrowLeft, FileText, Download, Printer, User, Mail, Calendar, Info, AlertTriangle, Paperclip } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { poService } from "../services/poService";
import type { PurchaseOrder } from "../services/poService";

export const PODetailPage = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<PurchaseOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            if (!id) return;
            try {
                const data = await poService.getPODetail(id);
                setOrder(data);
            } catch (error) {
                console.error("Error fetching order detail:", error);
                // Fallback mock with new schema
                setOrder({
                    id: id || "1",
                    order_number: "PO-2024-001",
                    client_name: "Scotiabank",
                    course_name: "Liderazgo Efectivo y Comunicación en OTEC",
                    sence_code: "123456789",
                    status: "SUCCESS",
                    init_course: "2024-06-01",
                    end_course: "2024-06-15",
                    otic: "OTIC SOFOFA",
                    otic_rol: "123-K",
                    tramo: "100%",
                    total_amount: 15400.50,
                    currency: "CLP",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    objeciones: ["Falta código SENCE"],
                    emailSource: {
                        from: "operaciones@scotiabank.cl",
                        subject: "Orden de Compra #2024-001 - Capacitación",
                        date: "2024-05-15T14:30:00Z"
                    },
                    attachments: [
                        { filename: "OC_2024_001.pdf", contentType: "application/pdf", s3Key: "oc.pdf" }
                    ],
                    students: [
                        {
                            id: "s1",
                            student_dni: "12.345.678-9",
                            student_name: "Juan Pérez",
                            tramo: "100%",
                            value: 7700.25,
                            student_email: "juan.perez@email.com",
                            objeciones: null
                        },
                        {
                            id: "s2",
                            student_dni: "11.222.333-K",
                            student_name: "Maria García",
                            tramo: "100%",
                            value: 7700.25,
                            student_email: "maria.g@email.com",
                            objeciones: ["RUT repetido en este listado: 11.222.333-K"]
                        },
                    ]
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderDetail();
    }, [id]);

    if (isLoading) return <Container py="20"><Text>{t("common.loading")}</Text></Container>;
    if (!order) return <Container py="20"><Text>{t("common.error")}</Text></Container>;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "SUCCESS":
                return <Badge bg="status.bg.success" color="status.success" borderRadius="full" px="3">EXITOSO</Badge>;
            case "PENDING_APPROVAL":
                return <Badge bg="status.bg.warning" color="status.warning" borderRadius="full" px="3">PENDIENTE</Badge>;
            case "DUPLICATE_SKIPPED":
                return <Badge bg="status.bg.error" color="status.error" borderRadius="full" px="3">DUPLICADO</Badge>;
            default:
                return <Badge borderRadius="full" px="3">{status}</Badge>;
        }
    };

    return (
        <Container maxW="6xl" py="10" animation="fadeIn 0.5s ease-out forwards">
            <VStack align="stretch" spaceY="10">
                <Button variant="ghost" onClick={() => navigate(-1)} gap="2" alignSelf="start" borderRadius="lg">
                    <ArrowLeft size={18} />
                    {t("common.back")}
                </Button>

                {/* Header Section */}
                <Flex justify="space-between" align="start" wrap="wrap" gap="6">
                    <HStack gap="6" borderLeft="4px solid" borderColor="brand.accent" pl="6">
                        <Flex w="16" h="16" bg="brand.primary/10" borderRadius="2xl" align="center" justify="center" color="brand.primary">
                            <FileText size={32} />
                        </Flex>
                        <Box>
                            <Heading size="3xl" fontWeight="bold" mb="1">{order.order_number}</Heading>
                            <HStack gap="3">
                                <Text color="fg.muted" fontWeight="bold">{order.client_name}</Text>
                                <Separator orientation="vertical" h="4" />
                                {getStatusBadge(order.status)}
                            </HStack>
                        </Box>
                    </HStack>

                    <HStack gap="4">
                        <Button variant="outline" borderRadius="xl" gap="2" h="12"><Download size={18} /> Exportar</Button>
                        <Button variant="outline" borderRadius="xl" gap="2" h="12"><Printer size={18} /> Imprimir</Button>
                    </HStack>
                </Flex>

                {/* Objections Alert */}
                {order.objeciones && order.objeciones.length > 0 && (
                    <Box
                        p="6"
                        bg="status.bg.error/10"
                        border="1px solid"
                        borderColor="status.error"
                        borderRadius="2xl"
                        boxShadow="lg"
                    >
                        <HStack gap="4" align="start">
                            <AlertTriangle color="var(--chakra-colors-status-error)" size={24} />
                            <Box>
                                <Heading size="sm" color="status.error" mb="2">{t("po_detail.header_objections")}</Heading>
                                <VStack align="start" gap="1">
                                    {order.objeciones.map((obj, i) => (
                                        <Text key={i} fontSize="sm" fontWeight="medium">• {obj}</Text>
                                    ))}
                                </VStack>
                            </Box>
                        </HStack>
                    </Box>
                )}

                {/* Info Grid */}
                <SimpleGrid columns={{ base: 1, lg: 3 }} gap="8">
                    {/* Course Info */}
                    <Box p="8" bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle" boxShadow="glass">
                        <HStack mb="6" color="brand.primary">
                            <Info size={20} />
                            <Heading size="sm" textTransform="uppercase" letterSpacing="widest">{t("po_detail.course_info")}</Heading>
                        </HStack>
                        <VStack align="start" gap="4">
                            <Box>
                                <Text fontSize="xs" color="fg.muted" fontWeight="bold">{t("po_list.course")}</Text>
                                <Text fontWeight="bold">{order.course_name}</Text>
                            </Box>
                            <Box>
                                <Text fontSize="xs" color="fg.muted" fontWeight="bold">{t("po_list.sence")}</Text>
                                <Text fontWeight="bold">{order.sence_code}</Text>
                            </Box>
                            <HStack gap="8">
                                <Box>
                                    <Text fontSize="xs" color="fg.muted" fontWeight="bold">{t("po_detail.init_date")}</Text>
                                    <Text fontWeight="bold">{order.init_course}</Text>
                                </Box>
                                <Box>
                                    <Text fontSize="xs" color="fg.muted" fontWeight="bold">{t("po_detail.end_date")}</Text>
                                    <Text fontWeight="bold">{order.end_course}</Text>
                                </Box>
                            </HStack>
                        </VStack>
                    </Box>

                    {/* OTIC and Financials */}
                    <Box p="8" bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle" boxShadow="glass">
                        <HStack mb="6" color="brand.primary">
                            <User size={20} />
                            <Heading size="sm" textTransform="uppercase" letterSpacing="widest">{t("po_detail.otic_info")}</Heading>
                        </HStack>
                        <VStack align="start" gap="4" mb="8">
                            <Box>
                                <Text fontSize="xs" color="fg.muted" fontWeight="bold">{t("po_detail.otic_name")}</Text>
                                <Text fontWeight="bold">{order.otic}</Text>
                            </Box>
                            <Box>
                                <Text fontSize="xs" color="fg.muted" fontWeight="bold">{t("po_detail.otic_rol")}</Text>
                                <Text fontWeight="bold">{order.otic_rol}</Text>
                            </Box>
                        </VStack>
                        <Separator opacity="0.1" mb="6" />
                        <HStack justify="space-between">
                            <Box>
                                <Text fontSize="xs" color="fg.muted" fontWeight="bold">{t("po_detail.tramo_sence")}</Text>
                                <Badge bg="brand.primary/20" color="brand.primary" borderRadius="lg">{order.tramo}</Badge>
                            </Box>
                            <Box textAlign="right">
                                <Text fontSize="xs" color="fg.muted" fontWeight="bold">TOTAL</Text>
                                <Text fontSize="xl" fontWeight="black" color="brand.primary">${order.total_amount.toLocaleString()}</Text>
                            </Box>
                        </HStack>
                    </Box>

                    {/* Source and Attachments */}
                    <Box p="8" bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle" boxShadow="glass">
                        <HStack mb="6" color="brand.primary">
                            <Mail size={20} />
                            <Heading size="sm" textTransform="uppercase" letterSpacing="widest">{t("po_detail.email_source")}</Heading>
                        </HStack>
                        <VStack align="start" gap="3" mb="6">
                            <HStack>
                                <User size={14} color="gray" />
                                <Text fontSize="sm" truncate>{order.emailSource?.from}</Text>
                            </HStack>
                            <HStack>
                                <FileText size={14} color="gray" />
                                <Text fontSize="sm" fontStyle="italic" truncate>{order.emailSource?.subject}</Text>
                            </HStack>
                            <HStack>
                                <Calendar size={14} color="gray" />
                                <Text fontSize="sm">{order.emailSource?.date ? new Date(order.emailSource.date).toLocaleDateString() : '-'}</Text>
                            </HStack>
                        </VStack>
                        <Heading size="xs" mb="4" color="fg.muted">{t("po_detail.attachments")}</Heading>
                        <VStack align="stretch" gap="2">
                            {order.attachments?.map((att, i) => (
                                <HStack key={i} p="2" bg="bg.muted/30" borderRadius="lg" border="1px solid" borderColor="border.subtle">
                                    <Paperclip size={14} />
                                    <Text fontSize="xs" flex="1" truncate>{att.filename}</Text>
                                    <Button variant="ghost" size="xs"><Download size={14} /></Button>
                                </HStack>
                            ))}
                        </VStack>
                    </Box>
                </SimpleGrid>

                {/* Students Table */}
                <Box>
                    <HStack justify="space-between" mb="6">
                        <Heading size="xl" fontWeight="bold">{t("po_detail.students")}</Heading>
                        <Badge variant="surface" borderRadius="full" px="4">{order.students?.length || 0} Registrados</Badge>
                    </HStack>

                    <Box
                        borderRadius="3xl"
                        overflow="hidden"
                        border="1px solid"
                        borderColor="border.subtle"
                        bg="bg.surface"
                        backdropBlur="20px"
                        boxShadow="glass"
                    >
                        <Table.Root>
                            <Table.Header bg="bg.muted/30">
                                <Table.Row>
                                    <Table.ColumnHeader py="6">{t("po_detail.dni")}</Table.ColumnHeader>
                                    <Table.ColumnHeader>{t("po_detail.student_name")}</Table.ColumnHeader>
                                    <Table.ColumnHeader>{t("po_detail.tramo_sence")}</Table.ColumnHeader>
                                    <Table.ColumnHeader textAlign="end">{t("po_detail.value")}</Table.ColumnHeader>
                                    <Table.ColumnHeader>{t("po_detail.student_objections")}</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {order.students?.length === 0 ? (
                                    <Table.Row>
                                        <Table.Cell colSpan={5} textAlign="center" py="10">
                                            <Text color="fg.muted">{t("po_detail.no_students")}</Text>
                                        </Table.Cell>
                                    </Table.Row>
                                ) : order.students?.map((student) => (
                                    <Table.Row key={student.id} _hover={{ bg: student.objeciones ? "status.bg.error/5" : "bg.muted/30" }}>
                                        <Table.Cell fontWeight="bold">{student.student_dni}</Table.Cell>
                                        <Table.Cell>
                                            <Text fontWeight="medium">{student.student_name}</Text>
                                            <Text fontSize="xs" color="fg.muted">{student.student_email}</Text>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge variant="outline" size="sm" borderRadius="md">{student.tramo}</Badge>
                                        </Table.Cell>
                                        <Table.Cell textAlign="end" fontWeight="bold">
                                            ${student.value.toLocaleString()}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {student.objeciones && (
                                                <VStack align="start" gap="1">
                                                    {student.objeciones.map((obj, j) => (
                                                        <HStack key={j} color="status.error" gap="1">
                                                            <AlertTriangle size={12} />
                                                            <Text fontSize="xs" fontWeight="bold">{obj}</Text>
                                                        </HStack>
                                                    ))}
                                                </VStack>
                                            )}
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                </Box>
            </VStack>
        </Container>
    );
};
