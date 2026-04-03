import React, { useState, useMemo } from "react";
import {
    Box,
    Heading,
    Text,
    VStack,
    Container,
    Button,
    Input,
    Flex,
    Badge,
    HStack,
    Status,
    Tabs,
    Accordion,
    Table,
    Progress,
    Kbd,
} from "@chakra-ui/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Mousewheel } from "swiper/modules";
import { toaster, Toaster } from "../components/ui/toaster";
import { Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { useAnalytics } from "../hooks/useAnalytics";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/navigation";

interface ComponentExample {
    id: string;
    label: string;
    description: string;
    code: string;
    render: () => React.ReactElement;
}

export const PlaygroundPage = () => {
    const { t } = useTranslation();
    const { track } = useAnalytics();
    const [selectedId, setSelectedId] = useState("GlassCard");

    const componentExamples: ComponentExample[] = useMemo(() => [
        {
            id: "GlassCard",
            label: t("playground.examples.GlassCard.label"),
            description: t("playground.examples.GlassCard.desc"),
            code: `<Box 
  p="8" 
  borderRadius="3xl" 
  bg="bg.surface" 
  backdropBlur="16px" 
  border="1px solid" 
  borderColor="border.subtle"
  boxShadow="glass"
>
  <Heading size="md" mb="2" fontFamily="heading" fontWeight="bold">Card Title</Heading>
  <Text fontSize="sm" color="fg.muted">${t("playground.examples.GlassCard.content")}</Text>
</Box>`,
            render: () => (
                <Box
                    p="8"
                    borderRadius="3xl"
                    bg="bg.surface"
                    backdropBlur="16px"
                    border="1px solid"
                    borderColor="border.subtle"
                    boxShadow="glass"
                    maxW="400px"
                >
                    <Heading size="md" mb="2" fontFamily="heading" fontWeight="bold">{t("playground.examples.GlassCard.label")}</Heading>
                    <Text fontSize="sm" color="fg.muted">{t("playground.examples.GlassCard.content")}</Text>
                </Box>
            )
        },
        {
            id: "BadgesStatus",
            label: t("playground.examples.BadgesStatus.label"),
            description: t("playground.examples.BadgesStatus.desc"),
            code: `<HStack spaceX="4">
  <Badge borderRadius="full" px="3" colorPalette="cyan">New Release</Badge>
  <Badge borderRadius="full" px="3" colorPalette="green">Success</Badge>
  <Status.Root>
    <Status.Indicator />
    ${t("playground.examples.BadgesStatus.active")}
  </Status.Root>
</HStack>`,
            render: () => (
                <HStack spaceX="4" gap="4">
                    <Badge borderRadius="full" px="3" colorPalette="cyan">{t("components.showcase.new_release")}</Badge>
                    <Badge borderRadius="full" px="3" colorPalette="green">{t("common.success")}</Badge>
                    <Status.Root>
                        <Status.Indicator />
                        {t("playground.examples.BadgesStatus.active")}
                    </Status.Root>
                </HStack>
            )
        },
        {
            id: "PremiumTabs",
            label: t("playground.examples.PremiumTabs.label"),
            description: t("playground.examples.PremiumTabs.desc"),
            code: `<Tabs.Root defaultValue="tab-1" variant="enclosed">
  <Tabs.List bg="bg.muted" p="1" borderRadius="xl">
    <Tabs.Trigger value="tab-1" borderRadius="lg">Overview</Tabs.Trigger>
    <Tabs.Trigger value="tab-2" borderRadius="lg">Settings</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab-1" pt="4">
    <Text fontSize="sm" color="fg.muted">${t("playground.examples.PremiumTabs.overview_desc")}</Text>
  </Tabs.Content>
</Tabs.Root>`,
            render: () => (
                <Tabs.Root defaultValue="tab-1" variant="enclosed" maxW="300px">
                    <Tabs.List bg="bg.muted" p="1" borderRadius="xl">
                        <Tabs.Trigger value="tab-1" borderRadius="lg">{t("components.showcase.overview")}</Tabs.Trigger>
                        <Tabs.Trigger value="tab-2" borderRadius="lg">{t("common.settings.title")}</Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="tab-1" pt="4">
                        <Text fontSize="sm" color="fg.muted">{t("playground.examples.PremiumTabs.overview_desc")}</Text>
                    </Tabs.Content>
                </Tabs.Root>
            )
        },
        {
            id: "Accordion",
            label: t("playground.examples.Accordion.label"),
            description: t("playground.examples.Accordion.desc"),
            code: `<Accordion.Root collapsible>
  <Accordion.Item value="info" border="none">
    <Accordion.ItemTrigger p="4" _hover={{ bg: "bg.muted" }} borderRadius="xl">
      <Text fontWeight="bold">${t("playground.examples.Accordion.question")}</Text>
    </Accordion.ItemTrigger>
    <Accordion.ItemContent p="4" color="fg.muted">
      ${t("playground.examples.Accordion.answer")}
    </Accordion.ItemContent>
  </Accordion.Item>
</Accordion.Root>`,
            render: () => (
                <Accordion.Root defaultValue={["info"]} collapsible width={{ base: "full", md: "300px" }}>
                    <Accordion.Item value="info" border="none">
                        <Accordion.ItemTrigger p="4" _hover={{ bg: "bg.muted" }} borderRadius="xl">
                            <Text fontWeight="bold" fontSize="sm">{t("playground.examples.Accordion.question")}</Text>
                        </Accordion.ItemTrigger>
                        <Accordion.ItemContent p="4" color="fg.muted" fontSize="xs">
                            {t("playground.examples.Accordion.answer")}
                        </Accordion.ItemContent>
                    </Accordion.Item>
                </Accordion.Root>
            )
        },
        {
            id: "GlassInput",
            label: t("playground.examples.GlassInput.label"),
            description: t("playground.examples.GlassInput.desc"),
            code: `<Box position="relative">
  <Input placeholder="name@company.com" h="12" pl="10" borderRadius="xl" />
  <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="fg.muted">
    <Mail size={16} />
  </Box>
</Box>`,
            render: () => (
                <Box position="relative" width={{ base: "full", md: "300px" }}>
                    <Input placeholder="name@company.com" h="12" pl="10" borderRadius="xl" bg={{ base: "white/50", _dark: "slate.900/50" }} />
                    <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="fg.muted">
                        <Mail size={16} />
                    </Box>
                </Box>
            )
        },
        {
            id: "DataTable",
            label: t("playground.examples.DataTable.label"),
            description: t("playground.examples.DataTable.desc"),
            code: `<Table.Root variant="outline" size="sm">
  <Table.Header bg="bg.muted/50">
    <Table.Row>
      <Table.ColumnHeader>${t("components.showcase.client")}</Table.ColumnHeader>
      <Table.ColumnHeader>${t("components.showcase.status")}</Table.ColumnHeader>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell fontWeight="bold">Scotiabank</Table.Cell>
      <Table.Cell>Completed</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table.Root>`,
            render: () => (
                <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor="border.subtle" width="full">
                    <Table.Root variant="outline" size="sm">
                        <Table.Header bg="bg.muted/50">
                            <Table.Row>
                                <Table.ColumnHeader>{t("components.showcase.client")}</Table.ColumnHeader>
                                <Table.ColumnHeader>{t("components.showcase.status")}</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            <Table.Row>
                                <Table.Cell fontWeight="bold" fontSize="xs">Scotiabank</Table.Cell>
                                <Table.Cell fontSize="xs">{t("components.showcase.completed")}</Table.Cell>
                            </Table.Row>
                        </Table.Body>
                    </Table.Root>
                </Box>
            )
        },
        {
            id: "ProgressKbd",
            label: t("playground.examples.ProgressKbd.label"),
            description: t("playground.examples.ProgressKbd.desc"),
            code: `<VStack align="stretch" spaceY="4">
  <Progress.Root value={75} colorPalette="cyan" shape="rounded">
    <Progress.Track h="2"><Progress.Range /></Progress.Track>
  </Progress.Root>
  <HStack>
    <Kbd>⌘</Kbd> <Kbd>K</Kbd>
    <Text fontSize="xs">Search</Text>
  </HStack>
</VStack>`,
            render: () => (
                <VStack align="stretch" spaceY="4" width={{ base: "full", md: "300px" }}>
                    <Progress.Root value={75} colorPalette="cyan" shape="rounded">
                        <Progress.Track h="2"><Progress.Range /></Progress.Track>
                    </Progress.Root>
                    <HStack>
                        <Kbd>⌘</Kbd> <Kbd>K</Kbd>
                        <Text fontSize="xs" color="fg.muted">{t("components.showcase.search_shortcut")}</Text>
                    </HStack>
                </VStack>
            )
        }
    ], [t]);

    const selected = useMemo(() =>
        componentExamples.find(ex => ex.id === selectedId) || componentExamples[0]
        , [selectedId, componentExamples]);

    useEffect(() => {
        track("i18n_section_viewed", { section: "playground" });
    }, [track]);

    const handleSelect = (item: ComponentExample) => {
        setSelectedId(item.id);
        track("i18n_demo_interacted", { action: "select_component", component: item.id });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(selected.code);
        track("i18n_demo_interacted", { action: "copy_code", component: selected.id });
        toaster.create({
            title: t("common.copied"),
            description: t("playground.toast_desc"),
            type: "success",
        });
    };

    return (
        <Container maxW="6xl" py={{ base: "10", md: "20" }} animation="fadeIn 0.5s ease-out forwards">
            <Toaster />
            <VStack align="stretch" spaceY="12">
                <Box px={{ base: "4", md: "0" }}>
                    <Heading as="h1" size={{ base: "5xl", md: "7xl" }} mb="6" fontFamily="heading" fontWeight="black" letterSpacing="tight" color="brand.primary">
                        {t("playground.title")}
                    </Heading>
                    <Box borderLeft="4px solid" borderColor="brand.accent" pl="6">
                        <Text fontSize={{ base: "xl", md: "2xl" }} color="brand.secondary" lineHeight="relaxed" maxW="3xl">
                            {t("playground.subtitle")}
                        </Text>
                    </Box>
                </Box>

                {/* Horizontal Component Selector (Swiper) */}
                <Box position="relative" px="10">
                    <Swiper
                        modules={[Navigation, Mousewheel]}
                        spaceBetween={20}
                        slidesPerView={1}
                        navigation={{
                            nextEl: ".swiper-button-next-custom",
                            prevEl: ".swiper-button-prev-custom",
                        }}
                        mousewheel
                        breakpoints={{
                            640: { slidesPerView: 2 },
                            1024: { slidesPerView: 4 },
                        }}
                        style={{ padding: "10px 0" }}
                    >
                        {componentExamples.map((item) => (
                            <SwiperSlide key={item.id}>
                                <Button
                                    variant="ghost"
                                    height="20"
                                    w="full"
                                    flexDirection="column"
                                    borderRadius="2xl"
                                    bg={selected.id === item.id ? "brand.primary" : "bg.surface"}
                                    color={selected.id === item.id ? "button.primary.fg" : "fg.default"}
                                    border="1px solid"
                                    borderColor={selected.id === item.id ? "brand.primary" : "border.subtle"}
                                    _hover={{
                                        bg: selected.id === item.id ? "button.primary.hover" : "bg.muted/50",
                                        transform: "translateY(-4px)",
                                        boxShadow: "lg"
                                    }}
                                    onClick={() => handleSelect(item)}
                                    transition="all 0.3s"
                                    boxShadow="glass"
                                >
                                    <VStack align="center" gap="0">
                                        <Text fontWeight="black" fontSize="sm">{item.label}</Text>
                                        <Text fontSize="10px" opacity="0.6">{item.id}</Text>
                                    </VStack>
                                </Button>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    <IconButton
                        className="swiper-button-prev-custom"
                        position="absolute"
                        left="0"
                        top="50%"
                        transform="translateY(-50%)"
                        zIndex="10"
                        variant="ghost"
                        color="brand.primary"
                        _hover={{ bg: "brand.primary/10", transform: "translateY(-50%) scale(1.1)" }}
                    >
                        <ChevronLeft size={24} />
                    </IconButton>

                    <IconButton
                        className="swiper-button-next-custom"
                        position="absolute"
                        right="0"
                        top="50%"
                        transform="translateY(-50%)"
                        zIndex="10"
                        variant="ghost"
                        color="brand.primary"
                        _hover={{ bg: "brand.primary/10", transform: "translateY(-50%) scale(1.1)" }}
                    >
                        <ChevronRight size={24} />
                    </IconButton>
                </Box>

                <VStack align="stretch" spaceY="10" w="full">
                    {/* Preview Window */}
                    <Box
                        p={{ base: "6", md: "16" }}
                        borderRadius="4xl"
                        bgGradient="to-br"
                        gradientFrom={{ base: "white", _dark: "slate.800" }}
                        gradientTo={{ base: "brand.primary/10", _dark: "brand.primary/20" }}
                        border="1px solid"
                        borderColor="border.subtle"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        minHeight={{ base: "300px", md: "400px" }}
                        boxShadow="inner"
                        position="relative"
                        overflow="hidden"
                    >
                        <Box position="absolute" top="-10%" left="-10%" w="40%" h="40%" bg="brand.primary/10" filter="blur(60px)" borderRadius="full" />

                        <Box animation="fadeIn 0.3s ease-out" position="relative" zIndex="10" width="full" display="flex" justifyContent="center" px="4">
                            {React.createElement(selected.render)}
                        </Box>
                    </Box>

                    {/* Code Window */}
                    <Box
                        p={{ base: "6", md: "10" }}
                        borderRadius="3xl"
                        bg="bg.surface"
                        backdropBlur="20px"
                        border="1px solid"
                        borderColor="border.subtle"
                        boxShadow="glass"
                    >
                        <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "start", sm: "center" }} mb="6" gap="4">
                            <VStack align="start" gap="0">
                                <Text fontWeight="black" fontSize="lg" color="brand.primary">{t("playground.code_title")}</Text>
                                <Text fontSize="xs" color="fg.muted">{t("playground.code_desc")}</Text>
                            </VStack>
                            <Button size="sm" height="12" px="8" bg="button.primary.bg" color="button.primary.fg" borderRadius="full" onClick={handleCopy} w={{ base: "full", sm: "auto" }} _hover={{ bg: "button.primary.hover", shadow: "xl" }} fontWeight="black">
                                {t("playground.copy_btn")}
                            </Button>
                        </Flex>
                        <Box
                            as="pre"
                            p="6"
                            bg={{ base: "slate.900", _dark: "black" }}
                            color="brand.accent"
                            borderRadius="2xl"
                            fontSize={{ base: "xs", md: "sm" }}
                            fontFamily="mono"
                            overflowX="auto"
                            border="1px solid"
                            borderColor="whiteAlpha.100"
                            boxShadow="inner"
                            css={{
                                "&::-webkit-scrollbar": { height: "4px" },
                                "&::-webkit-scrollbar-thumb": { background: "rgba(0, 255, 255, 0.1)", borderRadius: "10px" },
                            }}
                        >
                            {selected.code}
                        </Box>
                    </Box>
                </VStack>
            </VStack>
        </Container>
    );
};

const IconButton = (props: any) => {
    const { children, ...rest } = props;
    return (
        <Button variant="ghost" p="0" minW="10" borderRadius="full" {...rest}>
            {children}
        </Button>
    );
};
