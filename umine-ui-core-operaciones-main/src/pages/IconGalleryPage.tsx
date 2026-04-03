import {
    Box,
    Heading,
    Text,
    VStack,
    Container,
    SimpleGrid,
} from "@chakra-ui/react";
import * as Icons from "lucide-react";
import { toaster, Toaster } from "../components/ui/toaster";
import { useAnalytics } from "../hooks/useAnalytics";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const iconCategories = [
    {
        name: "icons.cat_nav",
        icons: ["ArrowRight", "ChevronDown", "Menu", "X", "ExternalLink", "Search", "Settings", "Bell"]
    },
    {
        name: "icons.cat_action",
        icons: ["Trash2", "Copy", "Download", "Check", "AlertCircle", "Info", "HelpCircle", "Edit3"]
    },
    {
        name: "icons.cat_media",
        icons: ["Upload", "Download", "Play", "Music", "FileText", "Image", "Target", "Zap"]
    },
    {
        name: "icons.cat_design",
        icons: ["Palette", "Type", "Layout", "Monitor", "Smartphone", "Layers", "Box", "Diamond"]
    }
];

export const IconGalleryPage = () => {
    const { track } = useAnalytics();
    const { t } = useTranslation();

    useEffect(() => {
        track("i18n_section_viewed", { section: "icons" });
    }, [track]);

    const handleCopy = (name: string) => {
        navigator.clipboard.writeText(`<Icon as={${name}} />`);
        track("i18n_demo_interacted", { action: "copy_icon", icon: name });
        toaster.create({
            title: t("common.copied"),
            description: t("icons.copy_desc", { name }),
            type: "success",
        });
    };

    return (
        <Container maxW="5xl" py="20" animation="fadeIn 0.5s ease-out forwards">
            <Toaster />
            <VStack align="stretch" spaceY="12">
                <Box>
                    <Heading as="h1" size="7xl" mb="6" fontFamily="heading" fontWeight="bold" letterSpacing="tight" color="brand.primary">
                        {t("icons.title")}
                    </Heading>
                    <Box borderLeft="4px solid" borderColor="brand.accent" pl="6">
                        <Text fontSize="2xl" color="brand.secondary" lineHeight="relaxed" maxW="3xl">
                            {t("icons.subtitle")}
                        </Text>
                    </Box>
                </Box>

                {iconCategories.map((cat) => (
                    <Box key={cat.name}>
                        <Heading size="xl" mb="8" fontFamily="heading" fontWeight="bold" pb="2" borderBottom="1px solid" borderColor="border.subtle">
                            {t(cat.name)}
                        </Heading>
                        <SimpleGrid columns={{ base: 2, md: 4, lg: 8 }} gap="6">
                            {cat.icons.map((iconName) => {
                                const IconComponent = (Icons as any)[iconName];
                                return (
                                    <VStack
                                        key={iconName}
                                        p="6"
                                        borderRadius="2xl"
                                        bg="bg.surface"
                                        border="1px solid"
                                        borderColor="border.subtle"
                                        boxShadow="glass"
                                        cursor="pointer"
                                        _hover={{
                                            bg: "brand.primary",
                                            color: "button.primary.fg",
                                            transform: "translateY(-4px)"
                                        }}
                                        transition="all 0.3s"
                                        onClick={() => handleCopy(iconName)}
                                    >
                                        <IconComponent size={32} strokeWidth={1.5} />
                                        <Text fontSize="xs" fontWeight="bold" textAlign="center">
                                            {iconName}
                                        </Text>
                                    </VStack>
                                );
                            })}
                        </SimpleGrid>
                    </Box>
                ))}
            </VStack>
        </Container>
    );
};
