import {
    Button,
    Text,
    VStack,
    Flex,
    Box,
    Portal
} from "@chakra-ui/react";
import {
    DialogRoot,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogCloseTrigger
} from "../components/ui/dialog";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { useAnalytics } from "../hooks/useAnalytics";

interface LanguageSelectorProps {
    variant?: "header" | "vertical";
}

export const LanguageSelector = ({ variant = "header" }: LanguageSelectorProps) => {
    const { i18n, t } = useTranslation();
    const { track } = useAnalytics();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        track("i18n_language_changed", { lang: lng });
    };

    const LanguageButtons = () => (
        <VStack width="full" spaceY="3" align="stretch">
            <Button
                variant={i18n.language === 'en' ? "solid" : "ghost"}
                width="full"
                height="14"
                borderRadius="2xl"
                onClick={() => changeLanguage('en')}
                bg={i18n.language === 'en' ? "button.primary.bg" : "bg.muted/20"}
                color={i18n.language === 'en' ? "button.primary.fg" : "fg.default"}
                _hover={{
                    bg: i18n.language === 'en' ? "button.primary.hover" : "bg.muted/40",
                    transform: "translateY(-2px) scale(1.02)",
                    shadow: "md"
                }}
                transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                justifyContent="space-between"
                px="6"
            >
                <Text fontSize="md" fontWeight="bold">English</Text>
                {i18n.language === 'en' && <Check size={20} />}
            </Button>
            <Button
                variant={i18n.language === 'es' ? "solid" : "ghost"}
                width="full"
                height="14"
                borderRadius="2xl"
                onClick={() => changeLanguage('es')}
                bg={i18n.language === 'es' ? "button.primary.bg" : "bg.muted/20"}
                color={i18n.language === 'es' ? "button.primary.fg" : "fg.default"}
                _hover={{
                    bg: i18n.language === 'es' ? "button.primary.hover" : "bg.muted/40",
                    transform: "translateY(-2px) scale(1.02)",
                    shadow: "md"
                }}
                transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                justifyContent="space-between"
                px="6"
            >
                <Text fontSize="md" fontWeight="bold">Español</Text>
                {i18n.language === 'es' && <Check size={20} />}
            </Button>
        </VStack>
    );

    if (variant === "vertical") {
        return <LanguageButtons />;
    }

    return (
        <DialogRoot placement="center" motionPreset="slide-in-bottom">
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    borderRadius="xl"
                    bg={{ base: "slate.200/50", _dark: "slate.800/50" }}
                    color="fg.default"
                    _hover={{
                        bg: "brand.primary",
                        color: "button.primary.fg",
                        transform: "translateY(-1px)",
                        shadow: "md"
                    }}
                    transition="all 0.3s"
                    boxShadow="sm"
                    px="3"
                    h="10"
                >
                    <Globe size={18} />
                    <Text fontSize="xs" fontWeight="bold" display={{ base: "none", md: "block" }} ml="2">
                        {i18n.language.toUpperCase()}
                    </Text>
                </Button>
            </DialogTrigger>
            <Portal>
                <DialogContent
                    bg="bg.surface"
                    backdropFilter="blur(20px)"
                    border="1px solid"
                    borderColor="brand.primary/20"
                    borderRadius="3xl"
                    p="6"
                    boxShadow="glass"
                    animation="fadeIn 0.3s ease-out"
                >
                    <DialogCloseTrigger color="fg.muted" />
                    <DialogHeader borderBottom="0" pb="4">
                        <Flex align="center" gap="3">
                            <Box p="2" bg="brand.primary/10" borderRadius="lg" color="brand.primary">
                                <Globe size={20} />
                            </Box>
                            <DialogTitle fontSize="xl" fontWeight="black" color="heading.primary">
                                {t("common.select_language")}
                            </DialogTitle>
                        </Flex>
                    </DialogHeader>
                    <DialogBody pt="2" pb="6">
                        <Text fontSize="sm" color="description.secondary" mb="6">
                            {t("common.select_language_description")}
                        </Text>
                        <LanguageButtons />
                    </DialogBody>
                </DialogContent>
            </Portal>
        </DialogRoot>
    );
};
