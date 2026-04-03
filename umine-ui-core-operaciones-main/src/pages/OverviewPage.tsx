import { Box, Heading, Text, VStack, SimpleGrid, Container, Flex, Separator, Button } from "@chakra-ui/react";
import { ChartCard } from "../organisms/ChartCard";
import { SwiperShowcase } from "../organisms/SwiperShowcase";
import { Zap, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAnalytics } from "../hooks/useAnalytics";
import { useEffect } from "react";
import { motion } from "framer-motion";

export const OverviewPage = () => {
    const { t } = useTranslation();
    const { track } = useAnalytics();

    useEffect(() => {
        track("i18n_section_viewed", { section: "overview" });
    }, [track]);

    return (
        <Container maxW="6xl" py="20" animation="fadeIn 0.5s ease-out forwards">
            <VStack align="stretch" spaceY="16">
                {/* Hero Section */}
                <Box>
                    <Box borderLeft="4px solid" borderColor="brand.accent" pl="6" mb="12">
                        <Text fontSize="2xl" color="brand.secondary" lineHeight="relaxed" maxW="4xl">
                            {t("overview.hero")}
                        </Text>
                    </Box>

                    <SimpleGrid columns={{ base: 1, md: 3 }} gap="8">
                        <motion.div
                            whileHover={{ y: -8, scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <VStack p="10" bg="bg.surface" borderRadius="3xl" boxShadow="glass" align="start" spaceY="6" border="1px solid" borderColor="border.subtle" h="full">
                                <Flex w="12" h="12" bg={{ base: "brand.accent/10", _dark: "brand.accent/20" }} borderRadius="xl" align="center" justify="center" color="brand.accent">
                                    <Zap size={24} />
                                </Flex>
                                <Box>
                                    <Heading size="lg" mb="2" fontWeight="bold">{t("overview.minimalism")}</Heading>
                                    <Text color="fg.muted" fontSize="sm">{t("overview.minimalism_desc")}</Text>
                                </Box>
                            </VStack>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -8, scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <VStack p="10" bg="bg.surface" borderRadius="3xl" boxShadow="glass" align="start" spaceY="6" border="1px solid" borderColor="border.subtle" h="full">
                                <Flex w="12" h="12" bg={{ base: "brand.accent/10", _dark: "brand.accent/20" }} borderRadius="xl" align="center" justify="center" color="brand.accent">
                                    <Sparkles size={24} />
                                </Flex>
                                <Box>
                                    <Heading size="lg" mb="2" fontWeight="bold">{t("overview.depth")}</Heading>
                                    <Text color="fg.muted" fontSize="sm">{t("overview.depth_desc")}</Text>
                                </Box>
                            </VStack>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -8, scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <VStack p="10" bg="bg.surface" borderRadius="3xl" boxShadow="glass" align="start" spaceY="6" border="1px solid" borderColor="border.subtle" h="full">
                                <Flex w="12" h="12" bg={{ base: "brand.accent/10", _dark: "brand.accent/20" }} borderRadius="xl" align="center" justify="center" color="brand.accent">
                                    <Shield size={24} />
                                </Flex>
                                <Box>
                                    <Heading size="lg" mb="2" fontWeight="bold">{t("overview.accessibility")}</Heading>
                                    <Text color="fg.muted" fontSize="sm">{t("overview.accessibility_desc")}</Text>
                                </Box>
                            </VStack>
                        </motion.div>
                    </SimpleGrid>
                </Box>

                <Separator opacity="0.1" />

                {/* Swiper Showcase Section */}
                <Box>
                    <Heading size="3xl" mb="8" fontFamily="heading" fontWeight="bold">{t("overview.interactivity")}</Heading>
                    <SwiperShowcase />
                </Box>

                <Separator opacity="0.1" />

                {/* System Buttons Example Section */}
                <Box p="10" bg="bg.surface" borderRadius="4xl" border="1px solid" borderColor="border.subtle" boxShadow="glass">
                    <Heading size="xl" mb="8" fontWeight="bold">{t("overview.buttons")}</Heading>
                    <Flex gap="6">
                        <Button
                            size="xl"
                            bg="button.primary.bg"
                            color="button.primary.fg"
                            borderRadius="xl"
                            px="10"
                            h="14"
                            fontWeight="black"
                            _hover={{ bg: "button.primary.hover", transform: "translateY(-2px)" }}
                            transition="all 0.3s"
                        >
                            {t("overview.principal")}
                        </Button>
                        <Button
                            size="xl"
                            bg="button.secondary.bg"
                            color="button.secondary.fg"
                            borderColor="button.secondary.border"
                            border="2px solid"
                            borderRadius="xl"
                            px="10"
                            h="14"
                            fontWeight="bold"
                            _hover={{ bg: "button.secondary.hover", transform: "translateY(-2px)" }}
                            transition="all 0.3s"
                        >
                            {t("overview.secondary")}
                        </Button>
                    </Flex>
                </Box>

                <Separator opacity="0.1" />

                {/* Data Visualization Grid */}
                <Box>
                    <VStack align="start" spaceY="4" mb="10">
                        <Heading size="3xl" fontFamily="heading" fontWeight="bold">{t("overview.data_viz")}</Heading>
                        <Text color="fg.muted" fontSize="lg">{t("overview.data_viz_desc")}</Text>
                    </VStack>

                    <SimpleGrid columns={{ base: 1, md: 2 }} gap="8">
                        <ChartCard
                            type="line"
                            title={t("charts.weekly_adoption")}
                            description={t("charts.weekly_adoption_desc")}
                        />
                        <ChartCard
                            type="bar"
                            title={t("charts.performance_backend")}
                            description={t("charts.performance_backend_desc")}
                        />
                        <ChartCard
                            type="doughnut"
                            title={t("charts.platform_distribution")}
                            description={t("charts.platform_distribution_desc")}
                        />
                        <VStack
                            p="10"
                            bg={{ base: "brand.primary/10", _dark: "brand.primary/20" }}
                            borderRadius="3xl"
                            align="center"
                            justify="center"
                            color="brand.primary"
                            textAlign="center"
                            spaceY="6"
                            border="1px solid"
                            borderColor="brand.primary"
                            boxShadow="xl"
                        >
                            <Heading size="2xl" fontWeight="black">{t("overview.ready")}</Heading>
                            <Text fontWeight="medium" opacity="0.8">{t("overview.ready_desc")}</Text>
                            <Link to="/brand">
                                <Button
                                    bg="button.primary.bg"
                                    color="button.primary.fg"
                                    borderRadius="xl"
                                    h="12"
                                    px="8"
                                    _hover={{ bg: "button.primary.hover", transform: "translateY(-2px)" }}
                                    transition="all 0.3s"
                                    fontWeight="bold"
                                >
                                    {t("overview.access_builder")}
                                </Button>
                            </Link>
                        </VStack>
                    </SimpleGrid>
                </Box>
            </VStack>
        </Container>
    );
};
