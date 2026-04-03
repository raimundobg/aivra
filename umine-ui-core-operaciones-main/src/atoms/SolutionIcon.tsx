import { Box, Flex } from "@chakra-ui/react";
import { type LucideIcon, Target } from "lucide-react";

interface SolutionIconProps {
    icon?: LucideIcon;
    size?: string | number;
}

export const SolutionIcon = ({ icon: IconComponent = Target, size = "10" }: SolutionIconProps) => {
    return (
        <Box position="relative" display="inline-block">
            {/* Outer Glow/Glass Ring */}
            <Flex
                w={size}
                h={size}
                borderRadius="2xl"
                bgGradient="to-br"
                gradientFrom="brand.primary/20"
                gradientTo="brand.accent/20"
                backdropBlur="8px"
                border="1px solid"
                borderColor="whiteAlpha.300"
                align="center"
                justify="center"
                shadow="glass"
                transition="all 0.3s"
                _hover={{ transform: "scale(1.05)", shadow: "xl" }}
            >
                {/* Inner Core */}
                <Flex
                    w="70%"
                    h="70%"
                    borderRadius="xl"
                    bgGradient="to-br"
                    gradientFrom="brand.primary"
                    gradientTo="purple-600"
                    align="center"
                    justify="center"
                    color="white"
                    shadow="lg"
                >
                    <IconComponent size="60%" />
                </Flex>
            </Flex>

            {/* Sparkle Accent */}
            <Box
                position="absolute"
                top="-1"
                right="-1"
                w="3"
                h="3"
                bg="umine.accent"
                borderRadius="full"
                shadow="0 0 10px {colors.umine.accent}"
                animation="pulse 2s infinite"
            />
        </Box>
    );
};
