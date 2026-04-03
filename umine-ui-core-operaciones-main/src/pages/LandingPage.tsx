import { Box, Heading, Text, VStack, Button, Flex } from "@chakra-ui/react";
import { LivingOrb } from "../atoms/LivingOrb";
import { LogIn } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { useColorMode } from "../components/ui/color-mode";
import { Sun, Moon } from "lucide-react";
import { LanguageSelector } from "../atoms/LanguageSelector";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";

export const LandingPage = () => {
    const { login } = useAuth();
    const { colorMode, toggleColorMode } = useColorMode();
    const { t } = useTranslation();
    const { overlayTheme } = useTheme();

    return (
        <Flex
            direction={{ base: "column", lg: "row" }}
            align="center"
            justify="center"
            minH="100vh"
            bg="bg.canvas"
            gap="10"
            p="8"
            animation="fadeIn 0.8s ease-out"
            position="relative"
        >
            {/* Header / Navbar */}
            <Flex
                position="absolute"
                top="0"
                left="0"
                right="0"
                px={{ base: "4", md: "8" }}
                py="6"
                justify="space-between"
                align="center"
                zIndex="20"
                w="full"
                maxW="1100px"
                mx="auto"
            >
                {/* Logo Section */}
                <Flex align="center" gap="3" flexShrink={0}>
                    <Flex
                        w="10"
                        h="10"
                        borderRadius="xl"
                        bg="brand.primary"
                        shadow="lg"
                        align="center"
                        justify="center"
                        color="white"
                        fontWeight="bold"
                        fontSize="xl"
                    >
                        U
                    </Flex>
                    <Heading
                        size="lg"
                        fontWeight="black"
                        letterSpacing="tight"
                        color="fg.default"
                    >
                        Umine
                    </Heading>
                </Flex>

                {/* Controls Section */}
                <Flex align="center" gap="4">
                    <LanguageSelector />
                    <Button
                        onClick={toggleColorMode}
                        variant="ghost"
                        size="sm"
                        borderRadius="xl"
                        bg={{ base: "whiteAlpha.200", _dark: "whiteAlpha.100" }}
                        _hover={{ bg: "brand.primary", color: "white" }}
                    >
                        {colorMode === "light" ? <Moon size={18} /> : <Sun size={18} />}
                    </Button>
                </Flex>
            </Flex>

            {/* Left Side: Text and Login Card */}
            <VStack align="start" flex="1" spaceY="6" maxW="lg" zIndex="10">
                <Box>
                    <Heading as="h1" size="6xl" fontWeight="black" letterSpacing="tighter" lineHeight="0.9" mb="4">
                        {t("landing.title")} <br />
                        <Box as="span" color="brand.primary">{t("landing.subtitle_highlight")}</Box>
                    </Heading>
                    <Box borderLeft="4px solid" borderColor="brand.primary" pl="4" mt="6">
                        <Text fontSize="xl" color="fg.muted" lineHeight="tall">
                            {t("landing.subtitle")}
                        </Text>
                    </Box>
                </Box>

                <Box
                    p="8"
                    bg="bg.surface"
                    borderRadius="2xl"
                    boxShadow="2xl"
                    border="1px solid"
                    borderColor="border.subtle"
                    backdropBlur="xl"
                    w="full"
                    maxW="sm"
                >
                    <VStack spaceY="5">
                        <Heading size="md" textAlign="center">{t("common.exclusive_access")}</Heading>
                        <Text fontSize="sm" color="fg.muted" textAlign="center">
                            {t("common.login_message")}
                        </Text>

                        <Button
                            size="lg"
                            width="full"
                            bg="brand.primary"
                            color="white"
                            _hover={{
                                bg: "brand.primary",
                                opacity: 0.9,
                                shadow: "lg",
                                transform: "translateY(-2px)"
                            }}
                            transition="all 0.3s"
                            onClick={login}
                        >
                            <LogIn size={20} style={{ marginRight: '8px' }} />
                            {t("common.login_google")}
                        </Button>
                    </VStack>
                </Box>
            </VStack>

            {/* Right Side: Giant Orb */}
            <Box
                w={{ base: "full", lg: "500px" }}
                h={{ base: "400px", lg: "600px" }}
                position="relative"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <LivingOrb scale={1.2} distort={0.4} color={overlayTheme?.palette.primary || (colorMode === "dark" ? "#10b981" : "#059669")} />
            </Box>
        </Flex>
    );
};
