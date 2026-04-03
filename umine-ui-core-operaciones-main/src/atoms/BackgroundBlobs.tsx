import { Box } from "@chakra-ui/react";

export const BackgroundBlobs = () => {
    return (
        <Box
            position="fixed"
            inset="0"
            width="full"
            height="full"
            pointerEvents="none"
            zIndex="0"
            overflow="hidden"
        >
            <Box
                position="absolute"
                top="0"
                left="25%"
                width="24rem"
                height="24rem"
                bg={{ base: "brand.primary/30", _dark: "brand.primary/10" }}
                borderRadius="full"
                mixBlendMode={{ base: "multiply", _dark: "screen" }}
                filter="auto"
                blur="3xl"
                opacity="0.3"
                animation="blob 7s infinite"
            />
            <Box
                position="absolute"
                top="0"
                right="25%"
                width="24rem"
                height="24rem"
                bg={{ base: "brand.accent/30", _dark: "brand.accent/10" }}
                borderRadius="full"
                mixBlendMode={{ base: "multiply", _dark: "screen" }}
                filter="auto"
                blur="3xl"
                opacity="0.3"
                animation="blob 7s infinite"
                animationDelay="2s"
            />
            <Box
                position="absolute"
                bottom="-2rem"
                left="33%"
                width="24rem"
                height="24rem"
                bg={{ base: "brand.secondary/30", _dark: "brand.secondary/10" }}
                borderRadius="full"
                mixBlendMode={{ base: "multiply", _dark: "screen" }}
                filter="auto"
                blur="3xl"
                opacity="0.3"
                animation="blob 7s infinite"
                animationDelay="4s"
            />
        </Box>
    );
};
