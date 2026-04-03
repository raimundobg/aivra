import { Box, Flex } from "@chakra-ui/react";
import { SidebarNav } from "../organisms/SidebarNav";
import { TopNav } from "../organisms/TopNav";
import { BackgroundBlobs } from "../atoms/BackgroundBlobs";
import { type ReactNode } from "react";

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
    return (
        <Flex h="100vh" bg="bg.canvas" color="fg.default" overflow="hidden" position="relative">
            <BackgroundBlobs />

            {/* Mobile TopNav */}
            <TopNav />

            {/* Sidebar for Desktop */}
            <Box display={{ base: "none", md: "block" }}>
                <SidebarNav />
            </Box>

            {/* Main Content Area */}
            <Box
                flex="1"
                overflowY="auto"
                position="relative"
                zIndex="1"
                pt={{ base: "20", md: "0" }}
                css={{
                    "&::-webkit-scrollbar": { width: "4px" },
                    "&::-webkit-scrollbar-track": { background: "transparent" },
                    "&::-webkit-scrollbar-thumb": { background: "rgba(100, 100, 100, 0.1)", borderRadius: "10px" },
                }}
            >
                {children}
            </Box>
        </Flex>
    );
};
