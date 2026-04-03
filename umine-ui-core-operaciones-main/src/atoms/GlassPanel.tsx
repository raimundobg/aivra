import { Box } from "@chakra-ui/react";
import type { BoxProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface GlassPanelProps extends BoxProps {
    children: ReactNode;
}

export const GlassPanel = ({ children, ...props }: GlassPanelProps) => {
    return (
        <Box
            bg="bg.surface"
            backdropFilter="blur(16px)"
            borderRadius="2xl"
            border="1px solid"
            borderColor="border.subtle"
            shadow="sm"
            overflow="hidden"
            transition="all 0.3s ease-out"
            {...props}
        >
            {children}
        </Box>
    );
};
