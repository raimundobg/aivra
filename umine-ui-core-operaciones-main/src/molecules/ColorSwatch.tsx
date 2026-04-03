import { Box, Text, VStack } from "@chakra-ui/react";

interface ColorSwatchProps {
    name: string;
    hex: string;
    bgClass: string;
}

export const ColorSwatch = ({ name, hex, bgClass }: ColorSwatchProps) => {
    return (
        <VStack
            p="3"
            borderRadius="xl"
            bg="bg.surface"
            backdropBlur="16px"
            border="1px solid"
            borderColor="border.subtle"
            boxShadow="glass"
            align="center"
            gap="3"
        >
            <Box
                w="full"
                h="20"
                borderRadius="lg"
                boxShadow="inner"
                bg={bgClass}
            />
            <VStack gap="0">
                <Text fontSize="sm" fontWeight="bold">
                    {name}
                </Text>
                <Text fontSize="xs" color="fg.muted" fontFamily="mono">
                    {hex}
                </Text>
            </VStack>
        </VStack>
    );
};
