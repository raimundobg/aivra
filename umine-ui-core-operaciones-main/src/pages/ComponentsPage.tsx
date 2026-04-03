import { Heading, Text, VStack, Container, Box, Separator } from "@chakra-ui/react";
import { ComponentShowcase } from "../organisms/ComponentShowcase";
import { useAnalytics } from "../hooks/useAnalytics";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const ComponentsPage = () => {
    const { track } = useAnalytics();
    const { t } = useTranslation();

    useEffect(() => {
        track("i18n_section_viewed", { section: "components" });
    }, [track]);

    return (
        <Container maxW="5xl" py="20" animation="fadeIn 0.5s ease-out forwards">
            <VStack align="stretch" spaceY="12">
                <Box>
                    <Heading as="h1" size="7xl" mb="6" fontFamily="heading" fontWeight="bold" letterSpacing="tight" color="heading.primary">
                        {t("components.title")}
                    </Heading>
                    <Box borderLeft="4px solid" borderColor="umine.accent" pl="6">
                        <Text fontSize="2xl" color="description.primary" lineHeight="relaxed" maxW="3xl">
                            {t("components.subtitle")}
                        </Text>
                    </Box>
                </Box>

                <Separator opacity="0.1" />

                <ComponentShowcase />
            </VStack>
        </Container>
    );
};
