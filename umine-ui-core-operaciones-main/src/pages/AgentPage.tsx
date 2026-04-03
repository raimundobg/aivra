import { Heading, Text, VStack, Container, Box, Button } from "@chakra-ui/react";
import { toaster, Toaster } from "../components/ui/toaster";
import { useAnalytics } from "../hooks/useAnalytics";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { generateAgentPrompt } from "../services/agentInstructions";

export const AgentPage = () => {
    const { track } = useAnalytics();
    const { i18n, t } = useTranslation();
    const { overlayTheme } = useTheme();

    useEffect(() => {
        track("i18n_section_viewed", { section: "agent" });
    }, [track]);

    const fullPrompt = useMemo(() => {
        return generateAgentPrompt(overlayTheme, t, i18n.language);
    }, [t, overlayTheme, i18n.language]);

    const handleCopy = () => {
        navigator.clipboard.writeText(fullPrompt);
        toaster.create({
            title: t("common.copied"),
            description: t("common.copied"),
            type: "success",
        });
    };

    return (
        <Container maxW="4xl" py="20" animation="fadeIn 0.5s ease-out forwards">
            <Toaster />
            <VStack align="stretch" spaceY="12">
                <Box>
                    <Heading as="h1" size="7xl" mb="6" fontFamily="heading" fontWeight="bold" letterSpacing="tight" color="heading.primary">
                        {t("agent.title")}
                    </Heading>
                    <Box borderLeft="4px solid" borderColor="umine.accent" pl="6">
                        <Text fontSize="2xl" color="description.primary" lineHeight="relaxed" maxW="3xl">
                            {t("agent.subtitle")}
                        </Text>
                    </Box>
                </Box>

                <Box
                    position="relative"
                    p="10"
                    borderRadius="3xl"
                    bg="bg.surface"
                    backdropBlur="16px"
                    border="1px solid"
                    borderColor="border.subtle"
                    boxShadow="glass"
                    overflow="hidden"
                >
                    <Button
                        position="absolute"
                        top="6"
                        right="6"
                        size="sm"
                        height="10"
                        px="6"
                        bg="umine.accent"
                        color="white"
                        borderRadius="lg"
                        onClick={handleCopy}
                        zIndex="10"
                        _hover={{ transform: "translateY(-1px)" }}
                    >
                        {t("agent.copy_btn")}
                    </Button>
                    <Box
                        as="pre"
                        bg={{ base: "slate.100", _dark: "slate.800" }}
                        p="8"
                        borderRadius="2xl"
                        overflowX="auto"
                        fontSize="sm"
                        fontFamily="mono"
                        whiteSpace="pre-wrap"
                        maxHeight="600px"
                        overflowY="auto"
                        border="1px solid"
                        borderColor="border.subtle"
                        boxShadow="inner"
                        css={{
                            "&::-webkit-scrollbar": { width: "8px" },
                            "&::-webkit-scrollbar-track": { background: "transparent" },
                            "&::-webkit-scrollbar-thumb": {
                                background: "rgba(156, 163, 175, 0.3)",
                                borderRadius: "4px"
                            },
                        }}
                    >
                        {fullPrompt}
                    </Box>
                </Box>
                <Text fontSize="md" color="description.primary" textAlign="center" fontWeight="medium">
                    {t("agent.footer")}
                </Text>
            </VStack>
        </Container>
    );
};
