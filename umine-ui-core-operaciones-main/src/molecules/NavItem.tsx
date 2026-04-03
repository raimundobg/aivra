import { Button, Text, Box } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { type ReactNode } from "react";

interface NavItemProps {
    to: string;
    label: string;
    icon: string | ReactNode;
    end?: boolean;
}

export const NavItem = ({ to, label, icon, end }: NavItemProps) => {
    return (
        <NavLink to={to} end={end} style={{ textDecoration: 'none', width: '100%' }}>
            {({ isActive }) => (
                <Button
                    variant="ghost"
                    width="full"
                    justifyContent="flex-start"
                    gap="3"
                    px="4"
                    py="6"
                    borderRadius="xl"
                    bg={isActive ? "brand.primary" : "transparent"}
                    color={isActive ? "button.primary.fg" : "fg.default"} // Ensures text is visible
                    boxShadow={isActive ? "md" : "none"}
                    _hover={{
                        bg: isActive ? "button.primary.hover" : { base: "brand.primary/10", _dark: "brand.primary/20" },
                        transform: "translateX(4px)",
                        color: isActive ? "button.primary.fg" : "brand.primary"
                    }}
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                >
                    <Box
                        fontSize="lg"
                        display="flex"
                        alignItems="center"
                        color={isActive ? "button.primary.fg" : "fg.default"}
                        transition="color 0.2s"
                    >
                        {icon}
                    </Box>
                    <Text fontWeight="bold" fontSize="sm">{label}</Text>
                </Button>
            )}
        </NavLink>
    );
};
