import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogCloseTrigger,
    DialogBackdrop,
    VStack,
    Box,
    Flex,
    Text,
    Button,
    Separator,
} from "@chakra-ui/react";
import { useAuth } from "../providers/AuthProvider";
import { useColorMode } from "../components/ui/color-mode";
import { Avatar } from "../components/ui/avatar";
import { LogOut, Sun, Moon, Settings } from "lucide-react";
import { LanguageSelector } from "../atoms/LanguageSelector";
import { useTranslation } from "react-i18next";

interface UserSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UserSettingsModal = ({ isOpen, onClose }: UserSettingsModalProps) => {
    const { user, logout } = useAuth();
    const { colorMode, toggleColorMode } = useColorMode();
    const { t } = useTranslation();

    if (!user) return null;

    return (
        <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()} placement="center">
            <DialogBackdrop />
            <DialogContent
                bg="bg.surface"
                backdropFilter="blur(20px)"
                borderRadius="2xl"
                border="1px solid"
                borderColor="border.subtle"
                boxShadow="2xl"
                maxW="md"
                p="0"
                overflow="hidden"
            >
                <DialogHeader bg="bg.subtle" py="6" borderBottom="1px solid" borderColor="border.subtle">
                    <Flex align="center" justify="space-between">
                        <Flex align="center" gap="3">
                            <Settings size={20} />
                            <DialogTitle fontWeight="bold" fontSize="lg">
                                {t("common.settings.title") || "Configuración"}
                            </DialogTitle>
                        </Flex>
                        <DialogCloseTrigger />
                    </Flex>
                </DialogHeader>

                <DialogBody p="6">
                    <VStack align="stretch" gap="6">
                        {/* User Profile Section */}
                        <Box
                            p="4"
                            bg="cyan.500/10"
                            borderRadius="xl"
                            border="1px solid"
                            borderColor="cyan.500/20"
                        >
                            <Flex align="center" gap="4" w="full" overflow="hidden">
                                <Avatar
                                    size="lg"
                                    name={user.displayName || user.email || "User"}
                                    src={user.photoURL || undefined}
                                    border="2px solid"
                                    borderColor="cyan.500"
                                    flexShrink={0}
                                />
                                <VStack align="start" gap="0" overflow="hidden" flex="1" minW="0">
                                    <Text fontWeight="bold" fontSize="md" truncate w="full">{user.displayName || "Usuario Umine"}</Text>
                                    <Text fontSize="sm" color="fg.muted" truncate w="full">{user.email}</Text>
                                </VStack>
                            </Flex>
                        </Box>

                        <Separator opacity="0.5" />

                        {/* Settings Options */}
                        <VStack align="stretch" gap="3">
                            <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">
                                {t("common.preferences")}
                            </Text>

                            {/* Language */}
                            <Box>
                                <LanguageSelector />
                            </Box>

                            {/* Color Mode */}
                            <Button
                                onClick={toggleColorMode}
                                variant="outline"
                                width="full"
                                height="12"
                                justifyContent="flex-start"
                                px="4"
                                borderRadius="xl"
                                borderColor="border.subtle"
                                _hover={{ bg: "bg.subtle", borderColor: "cyan.500" }}
                            >
                                <Flex align="center" gap="3" w="full">
                                    {colorMode === "light" ? <Sun size={18} /> : <Moon size={18} />}
                                    <Text fontSize="sm" fontWeight="medium">
                                        {colorMode === "light" ? t("common.light_mode") : t("common.dark_mode")}
                                    </Text>
                                </Flex>
                            </Button>
                        </VStack>
                    </VStack>
                </DialogBody>

                <DialogFooter borderTop="1px solid" borderColor="border.subtle" p="4" bg="bg.subtle/50">
                    <Button
                        onClick={() => {
                            logout();
                            onClose();
                        }}
                        variant="ghost"
                        colorPalette="red"
                        width="full"
                        size="lg"
                        _hover={{ bg: "red.500/10", color: "red.500" }}
                    >
                        <LogOut size={18} style={{ marginRight: '8px' }} />
                        {t("common.logout")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    );
};
