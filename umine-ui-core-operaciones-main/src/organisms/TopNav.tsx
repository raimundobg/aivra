import {
    Box,
    Flex,
    IconButton,
    Heading,
    Drawer,
    VStack,
} from "@chakra-ui/react";
import { Menu, X, LogIn } from "lucide-react";
import { useState } from "react";
import { SidebarNav } from "./SidebarNav";
import { useAuth } from "../providers/AuthProvider";
import { Avatar } from "../components/ui/avatar";

export const TopNav = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, login } = useAuth();

    return (
        <Box
            as="header"
            position="fixed"
            top="0"
            left="0"
            right="0"
            h="20"
            bg="bg.surface/80"
            backdropBlur="16px"
            borderBottom="1px solid"
            borderColor="border.subtle"
            zIndex="40"
            display={{ base: "block", md: "none" }}
        >
            <Flex h="full" align="center" justify="space-between" px="6">
                <Flex align="center" gap="3">
                    <Flex
                        w="8"
                        h="8"
                        borderRadius="lg"
                        bg="brand.primary"
                        align="center"
                        justify="center"
                        color="white"
                        fontWeight="bold"
                        fontSize="lg"
                        border="1px solid"
                        borderColor="whiteAlpha.400"
                    >
                        U
                    </Flex>
                    <Heading size="md" fontWeight="black" letterSpacing="tight" color="brand.primary">
                        Umine
                    </Heading>
                </Flex>

                <Flex align="center" gap="2">
                    {user ? (
                        <Avatar
                            size="xs"
                            name={user.displayName || user.email || "User"}
                            src={user.photoURL || undefined}
                            borderRadius="full"
                            onClick={() => setIsOpen(true)}
                        />
                    ) : (
                        <IconButton
                            aria-label="Login"
                            variant="ghost"
                            onClick={login}
                        >
                            <LogIn size={20} />
                        </IconButton>
                    )}
                    <IconButton
                        aria-label="Toggle Menu"
                        variant="ghost"
                        onClick={() => setIsOpen(true)}
                    >
                        <Menu size={24} />
                    </IconButton>
                </Flex>
            </Flex>

            <Drawer.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
                <Drawer.Backdrop />
                <Drawer.Content bg="bg.canvas" p="0" maxW="300px">
                    <Drawer.Header borderBottom="1px solid" borderColor="border.subtle" py="6" px="6">
                        <Flex justify="space-between" align="center" w="full">
                            <Heading size="md">MENÚ</Heading>
                            <IconButton variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                                <X size={20} />
                            </IconButton>
                        </Flex>
                    </Drawer.Header>
                    <Drawer.Body p="0" pt="2">
                        <VStack align="stretch" spaceY="0">
                            <SidebarNav />
                        </VStack>
                    </Drawer.Body>
                </Drawer.Content>
            </Drawer.Root>
        </Box>
    );
};
