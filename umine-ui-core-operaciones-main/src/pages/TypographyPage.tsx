import { Heading, Text, VStack, Container, Box, Separator } from "@chakra-ui/react";
import { useAnalytics } from "../hooks/useAnalytics";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const TypographyPage = () => {
    const { track } = useAnalytics();
    const { t } = useTranslation();

    useEffect(() => {
        track("i18n_section_viewed", { section: "typography" });
    }, [track]);

    return (
        <Container maxW="4xl" py="20" animation="fadeIn 0.5s ease-out forwards">
            <VStack align="stretch" spaceY="12">
                <Box>
                    <Heading as="h1" size="7xl" mb="6" fontFamily="heading" fontWeight="bold" letterSpacing="tight" color="brand.primary">
                        {t("typography.title")}
                    </Heading>
                    <Box borderLeft="4px solid" borderColor="brand.accent" pl="6">
                        <Text fontSize="2xl" color="brand.secondary" lineHeight="relaxed" maxW="3xl">
                            {t("typography.subtitle")}
                        </Text>
                    </Box>
                </Box>

                <Box
                    p="10"
                    borderRadius="3xl"
                    bg="bg.surface"
                    backdropBlur="16px"
                    border="1px solid"
                    borderColor="border.subtle"
                    boxShadow="glass"
                >
                    <VStack align="stretch" spaceY="10">
                        <Box>
                            <Text fontSize="sm" color="brand.primary" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" mb="4">
                                Display / Outfit Bold
                            </Text>
                            <Heading size="6xl" fontFamily="heading" fontWeight="bold" letterSpacing="tight" color="brand.primary">
                                Headline 1
                            </Heading>
                            <Text fontSize="sm" color="fg.muted" mt="2">
                                Size: 60px | Tracking: -0.02em | Line-height: 1.1
                            </Text>
                        </Box>

                        <Box>
                            <Text fontSize="sm" color="brand.secondary" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" mb="4">
                                Display / Outfit Semibold
                            </Text>
                            <Heading size="4xl" fontFamily="heading" fontWeight="semibold" letterSpacing="tight" color="brand.secondary">
                                Headline 2 - Section Title
                            </Heading>
                            <Text fontSize="sm" color="fg.muted" mt="2">
                                Size: 36px | Tracking: -0.01em
                            </Text>
                        </Box>

                        <Separator borderColor="border.subtle" opacity="0.5" />

                        <Box>
                            <Text fontSize="sm" color="brand.accent" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" mb="4">
                                Body / Inter Regular
                            </Text>
                            <Text fontSize="xl" color="fg.default" maxW="2xl" lineHeight="relaxed">
                                {t("typography.body_text")}
                            </Text>
                            <Text fontSize="sm" color="fg.muted" mt="2">
                                Size: 18px | Line-height: 1.6
                            </Text>
                        </Box>
                    </VStack>
                </Box>
            </VStack>
        </Container>
    );
};
