import { Box, VStack, Text, Flex, Button, Heading, Badge } from "@chakra-ui/react";
import { NavItem } from "../molecules/NavItem";
import { Box as BoxIcon, BarChart3, TrendingUp, Users, LogIn, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../providers/AuthProvider";
import { Avatar } from "../components/ui/avatar";
import { useState } from "react";
import { UserSettingsModal } from "./UserSettingsModal";
import { useTheme } from "../contexts/ThemeContext";

const getNavItems = (t: any) => [
    { to: "/", label: t("nav.home"), icon: <BarChart3 size={18} />, end: true },
    { to: "/po/dashboard", label: t("dashboard.po_title"), icon: <TrendingUp size={18} />, end: true },
    { to: "/po", label: t("nav.po"), icon: <BoxIcon size={18} />, end: true },
    { to: "/clients", label: t("nav.customers"), icon: <Users size={18} />, end: true },
];

export const SidebarNav = () => {
    const { t } = useTranslation();
    const { user, login } = useAuth();
    const { overlayTheme } = useTheme();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const navItems = getNavItems(t);

    return (
        <Box
            as="nav"
            width={{ base: "full", md: "72" }}
            height="full"
            borderRight="1px solid"
            borderColor="border.subtle"
            bg="bg.surface"
            backdropBlur="20px"
            zIndex="20"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            transition="all 0.3s"
        >
            <Box overflowY="auto">
                <Flex p="8" align="center" gap="4">
                    <Flex
                        w="10"
                        h="10"
                        borderRadius="xl"
                        bg={{ base: "brand.primary", _dark: "brand.primary" }}
                        shadow="xl"
                        align="center"
                        justify="center"
                        color="white"
                        fontWeight="bold"
                        fontSize="xl"
                        fontFamily="heading"
                        border="1px solid"
                        borderColor={{ base: "brand.primary/50", _dark: "brand.primary/30" }}
                    >
                        U
                    </Flex>
                    <Heading
                        size="lg"
                        fontWeight="black"
                        fontFamily="heading"
                        letterSpacing="tight"
                        color={{ base: "brand.primary", _dark: "brand.accent" }}
                    >
                        Umine
                    </Heading>
                    {overlayTheme && (
                        <Badge
                            variant="solid"
                            bg="brand.primary"
                            color="button.primary.fg"
                            borderRadius="full"
                            fontSize="9px"
                            px="2"
                            animation="pulse 2s infinite"
                        >
                            {overlayTheme.brandId}
                        </Badge>
                    )}
                </Flex>

                <Box px="4" py="2">
                    <Text
                        fontSize="xs"
                        fontWeight="bold"
                        color="fg.muted"
                        textTransform="uppercase"
                        letterSpacing="widest"
                        mb="4"
                        px="4"
                    >
                        {t("nav.design_system_label")}
                    </Text>
                    <VStack spaceY="1" align="stretch" px="2" pb="8">
                        {navItems.map(({ to, ...item }) => (
                            <NavItem key={to} to={to} {...item} />
                        ))}
                    </VStack>
                </Box>
            </Box>

            <Box p="4" borderTop="1px solid" borderColor="border.subtle" bg="bg.surface">
                {user && (
                    <>
                        <Button
                            onClick={() => setIsSettingsOpen(true)}
                            variant="ghost"
                            width="full"
                            height="auto"
                            py="3"
                            px="3"
                            borderRadius="xl"
                            display="flex"
                            alignItems="center"
                            gap="3"
                            _hover={{ bg: "bg.subtle" }}
                            textAlign="left"
                            justifyContent="flex-start"
                        >
                            <Avatar
                                size="sm"
                                name={user.displayName || user.email || "User"}
                                src={user.photoURL || undefined}
                                border="2px solid"
                                borderColor="brand.primary"
                            />
                            <VStack align="start" gap="0" overflow="hidden" flex="1">
                                <Text fontSize="sm" fontWeight="bold" truncate w="full">
                                    {user.displayName || t("nav.user")}
                                </Text>
                                <Text fontSize="xs" color="fg.muted" truncate w="full">
                                    {t("nav.configure")}
                                </Text>
                            </VStack>
                            <Settings size={18} color="var(--chakra-colors-fg-muted)" />
                        </Button>

                        <UserSettingsModal
                            isOpen={isSettingsOpen}
                            onClose={() => setIsSettingsOpen(false)}
                        />
                    </>
                )}

                {!user && (
                    <Button
                        onClick={login}
                        variant="solid"
                        bg="button.primary.bg"
                        color="button.primary.fg"
                        width="full"
                        height="12"
                        borderRadius="xl"
                        gap="3"
                        _hover={{ bg: "button.primary.hover", shadow: "0 0 15px {colors.brand.primary}", transform: "translateY(-1px)" }}
                        transition="all 0.3s"
                    >
                        <LogIn size={18} />
                        <Text fontSize="sm" fontWeight="bold">{t("nav.login_google")}</Text>
                    </Button>
                )}
            </Box>
        </Box>
    );
};
