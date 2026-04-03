import { Box, Heading, Text, VStack, Container, Flex, Button, SimpleGrid } from "@chakra-ui/react";
import { Diamond } from "lucide-react";
import { useAnalytics } from "../hooks/useAnalytics";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const GlassPage = () => {
    const { track } = useAnalytics();
    const { t } = useTranslation();

    useEffect(() => {
        track("i18n_section_viewed", { section: "glass" });
    }, [track]);

    return (
        <Container maxW="6xl" py="20" animation="fadeIn 0.5s ease-out forwards">
            <VStack align="stretch" spaceY="12">
                <Box>
                    <Heading as="h1" size="7xl" mb="6" fontFamily="heading" fontWeight="black" letterSpacing="tight" color="brand.primary">
                        {t("glass.title")}
                    </Heading>
                    <Box borderLeft="4px solid" borderColor="brand.accent" pl="6">
                        <Text fontSize="2xl" color="brand.secondary" lineHeight="relaxed" maxW="3xl">
                            {t("glass.subtitle")}
                        </Text>
                    </Box>
                </Box>

                {/* Refined Glass Preview - Removed Multicolored Background */}
                <Box
                    p={{ base: "6", md: "20" }}
                    borderRadius="4xl"
                    bg="bg.muted"
                    border="1px solid"
                    borderColor="border.subtle"
                    position="relative"
                    overflow="hidden"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minHeight="500px"
                    boxShadow="inner"
                >
                    {/* Decorative Subtle Background Shapes */}
                    <Box position="absolute" top="10%" left="10%" w="200px" h="200px" bg="brand.primary/20" filter="blur(80px)" borderRadius="full" />
                    <Box position="absolute" bottom="10%" right="10%" w="300px" h="300px" bg="brand.accent/10" filter="blur(100px)" borderRadius="full" />

                    {/* Main Glass Card */}
                    <Box
                        p="12"
                        borderRadius="3xl"
                        bg="bg.surface"
                        backdropBlur="20px"
                        border="1px solid"
                        borderColor="border.subtle"
                        boxShadow="glass"
                        maxW="450px"
                        textAlign="center"
                        zIndex="10"
                        animation="float 6s infinite ease-in-out"
                    >
                        <Flex w="16" h="16" bg="brand.primary/10" borderRadius="full" align="center" justify="center" color="brand.primary" mx="auto" mb="8" border="1px solid" borderColor="brand.primary/20">
                            <Diamond size={32} />
                        </Flex>
                        <Heading size="3xl" mb="4" fontWeight="black">{t("glass.card_title")}</Heading>
                        <Text color="fg.muted" mb="8" fontSize="lg">
                            {t("glass.card_desc")}
                        </Text>
                        <Button size="xl" bg="button.primary.bg" color="button.primary.fg" borderRadius="full" px="10" _hover={{ bg: "button.primary.hover", shadow: "0 0 20px {colors.brand.primary}" }}>
                            {t("glass.card_btn")}
                        </Button>
                    </Box>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 3 }} gap="8">
                    <VStack p="8" bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle" align="start" boxShadow="glass">
                        <Heading size="md" mb="2" color="brand.primary">{t("glass.feat1_title")}</Heading>
                        <Text fontSize="sm" color="fg.muted">{t("glass.feat1_desc")}</Text>
                    </VStack>
                    <VStack p="8" bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle" align="start" boxShadow="glass">
                        <Heading size="md" mb="2" color="brand.primary">{t("glass.feat2_title")}</Heading>
                        <Text fontSize="sm" color="fg.muted">{t("glass.feat2_desc")}</Text>
                    </VStack>
                    <VStack p="8" bg="bg.surface" borderRadius="3xl" border="1px solid" borderColor="border.subtle" align="start" boxShadow="glass">
                        <Heading size="md" mb="2" color="brand.primary">{t("glass.feat3_title")}</Heading>
                        <Text fontSize="sm" color="fg.muted">{t("glass.feat3_desc")}</Text>
                    </VStack>
                </SimpleGrid>
            </VStack>

            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
        </Container>
    );
};
