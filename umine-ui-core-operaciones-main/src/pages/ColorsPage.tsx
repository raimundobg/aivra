import { SimpleGrid, Heading, Text, VStack, Container, Box, Flex, Badge, Button } from "@chakra-ui/react";
import { ClipboardIconButton, ClipboardRoot } from "../components/ui/clipboard";
import { useAnalytics } from "../hooks/useAnalytics";
import { useEffect } from "react";
import { useColorMode } from "../components/ui/color-mode";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";

interface ColorDisplayProps {
    name: string;
    token: string;
    description?: string;
}

const ColorDisplay = ({ name, token, description }: ColorDisplayProps) => {
    return (
        <ClipboardRoot value={token}>
            <VStack
                align="stretch"
                p="6"
                bg="bg.surface"
                borderRadius="2xl"
                border="1px solid"
                borderColor="border.subtle"
                spaceY="3"
                transition="all 0.2s"
                _hover={{ borderColor: "umine.accent" }}
                role="group"
            >
                <Box h="20" bg={token} borderRadius="xl" border="1px solid" borderColor="border.subtle" />
                <VStack align="start" spaceY="1">
                    <Text fontWeight="bold" fontSize="sm">{name}</Text>
                    <Flex align="center" gap="2" width="full">
                        <Text fontSize="xs" color="fg.muted" fontFamily="mono" flex="1" truncate>
                            {token}
                        </Text>
                        <ClipboardIconButton
                            variant="ghost"
                            size="xs"
                            colorPalette="cyan"
                        />
                    </Flex>
                    {description && <Text fontSize="xs" color="fg.muted">{description}</Text>}
                </VStack>
            </VStack>
        </ClipboardRoot>
    );
};

const GradientDisplay = ({ name, gradient }: { name: string; gradient: string }) => {
    return (
        <ClipboardRoot value={gradient}>
            <VStack
                align="stretch"
                p="6"
                bg="bg.surface"
                borderRadius="2xl"
                border="1px solid"
                borderColor="border.subtle"
                spaceY="3"
            >
                <Box h="20" bgGradient={gradient} borderRadius="xl" border="1px solid" borderColor="border.subtle" />
                <VStack align="start" spaceY="2">
                    <Text fontWeight="bold" fontSize="sm">{name}</Text>
                    <Flex align="center" gap="2" width="full">
                        <Text fontSize="xs" color="fg.muted" fontFamily="mono" flex="1" truncate>
                            {gradient}
                        </Text>
                        <ClipboardIconButton
                            variant="ghost"
                            size="xs"
                            colorPalette="cyan"
                        />
                    </Flex>
                </VStack>
            </VStack>
        </ClipboardRoot>
    );
};

export const ColorsPage = () => {
    const { track } = useAnalytics();
    const { colorMode } = useColorMode();
    const { t } = useTranslation();
    const { overlayTheme } = useTheme();

    useEffect(() => {
        track("i18n_section_viewed", { section: "colors" });
    }, [track]);

    return (
        <Container maxW="6xl" py="20" animation="fadeIn 0.5s ease-out forwards">
            <VStack align="stretch" spaceY="16">
                <Box>
                    <Flex justify="space-between" align="start" mb="6">
                        <Heading as="h1" size="7xl" fontFamily="heading" fontWeight="bold" letterSpacing="tight" color="heading.primary">
                            {t("colors.title")}
                        </Heading>
                        <Badge bg="brand.primary" color="button.primary.fg" size="lg" borderRadius="full" px="4">
                            {t("common.mode")} {colorMode === "dark" ? t("common.dark_mode") : t("common.light_mode")}
                        </Badge>
                        {overlayTheme && (
                            <Badge bg="brand.primary" color="button.primary.fg" size="lg" borderRadius="full" px="4" variant="solid" animation="pulse 2s infinite">
                                {t("common.brand_label")}: {overlayTheme.brandId}
                            </Badge>
                        )}
                    </Flex>
                    <Box borderLeft="4px solid" borderColor="umine.accent" pl="6">
                        <Text fontSize="2xl" color="description.primary" lineHeight="relaxed" maxW="3xl">
                            {t("colors.subtitle")}
                        </Text>
                    </Box>
                </Box>

                {/* Backgrounds */}
                <Box>
                    <Heading size="2xl" mb="8" fontFamily="heading" fontWeight="bold" pb="2" borderBottom="1px solid" borderColor="border.subtle" color="heading.secondary">
                        {t("colors.backgrounds")}
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
                        <ColorDisplay name={t("colors.bg_canvas")} token="bg.canvas" description={t("colors.bg_canvas_desc")} />
                        <ColorDisplay name={t("colors.bg_surface")} token="bg.surface" description={t("colors.bg_surface_desc")} />
                        <ColorDisplay name={t("colors.bg_muted")} token="bg.muted" description={t("colors.bg_muted_desc")} />
                    </SimpleGrid>
                </Box>

                {/* Foregrounds */}
                <Box>
                    <Heading size="2xl" mb="8" fontFamily="heading" fontWeight="bold" pb="2" borderBottom="1px solid" borderColor="border.subtle" color="heading.secondary">
                        {t("colors.foregrounds")}
                        {overlayTheme && (
                            <Badge ml="4" bg="brand.primary" color="button.primary.fg" fontSize="xs" px="3" py="1" borderRadius="full">
                                {overlayTheme.brandId}
                            </Badge>
                        )}
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
                        <ColorDisplay name={t("colors.fg_default")} token="fg.default" description={t("colors.fg_default_desc")} />
                        <ColorDisplay name={t("colors.fg_muted")} token="fg.muted" description={t("colors.fg_muted_desc")} />
                        <ColorDisplay name={t("colors.fg_accent")} token="fg.accent" description={t("colors.fg_accent_desc")} />
                        <ColorDisplay name={t("colors.fg_inverted")} token="fg.inverted" description={t("colors.fg_inverted_desc")} />
                        <ColorDisplay name={t("colors.fg_brand")} token="fg.brand" description={t("colors.fg_brand_desc")} />
                    </SimpleGrid>
                </Box>

                {/* Brand Colors */}
                <Box>
                    <Heading size="2xl" mb="8" fontFamily="heading" fontWeight="bold" pb="2" borderBottom="1px solid" borderColor="border.subtle" color="heading.secondary">
                        {t("colors.brand_colors")} {overlayTheme ? `(${overlayTheme.brandId})` : ""}
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
                        <ColorDisplay name={t("colors.brand_primary")} token="brand.primary" description={t("colors.brand_primary_desc")} />
                        <ColorDisplay name={t("colors.brand_secondary")} token="brand.secondary" description={t("colors.brand_secondary_desc")} />
                        <ColorDisplay name={t("colors.brand_accent")} token="brand.accent" description={t("colors.brand_accent_desc")} />
                    </SimpleGrid>
                </Box>

                {/* Active Brand Palette - Raw Values */}
                {overlayTheme && (
                    <Box>
                        <Heading size="2xl" mb="8" fontFamily="heading" fontWeight="bold" pb="2" borderBottom="1px solid" borderColor="border.subtle" color="heading.secondary">
                            Active Brand Palette: {overlayTheme.brandId}
                        </Heading>
                        <SimpleGrid columns={{ base: 1, md: 3 }} gap="6" mb="6">
                            <ColorDisplay
                                name="Primary (Raw)"
                                token={overlayTheme.palette.primary}
                                description="Brand primary color from palette"
                            />
                            <ColorDisplay
                                name="Secondary (Raw)"
                                token={overlayTheme.palette.secondary}
                                description="Brand secondary color from palette"
                            />
                            <ColorDisplay
                                name="Accent (Raw)"
                                token={overlayTheme.palette.accent}
                                description="Brand accent color from palette"
                            />
                        </SimpleGrid>

                        {overlayTheme.palette.neutrals && overlayTheme.palette.neutrals.length > 0 && (
                            <>
                                <Text fontWeight="bold" mb="4" fontSize="lg">Brand Neutrals</Text>
                                <SimpleGrid columns={{ base: 3, md: 5 }} gap="3">
                                    {overlayTheme.palette.neutrals.map((color, idx) => (
                                        <ColorDisplay
                                            key={idx}
                                            name={`Neutral ${idx + 1}`}
                                            token={color}
                                        />
                                    ))}
                                </SimpleGrid>
                            </>
                        )}
                    </Box>
                )}

                {/* Button States */}
                <Box>
                    <Heading size="2xl" mb="8" fontFamily="heading" fontWeight="bold" pb="2" borderBottom="1px solid" borderColor="border.subtle" color="heading.secondary">
                        {t("colors.system_buttons")}
                        {overlayTheme && (
                            <Badge ml="4" bg="brand.primary" color="button.primary.fg" fontSize="xs" px="3" py="1" borderRadius="full">
                                {overlayTheme.brandId}
                            </Badge>
                        )}
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
                        <VStack align="stretch" p="6" bg="bg.surface" borderRadius="2xl" border="1px solid" borderColor="border.subtle" spaceY="4">
                            <Text fontWeight="bold">{t("colors.button_primary_normal")}</Text>
                            <Button bg="button.primary.bg" color="button.primary.fg" size="lg" borderRadius="xl">
                                {t("colors.brand_primary")}
                            </Button>
                            <Text fontSize="xs" color="fg.muted" fontFamily="mono">bg: button.primary.bg</Text>
                            <Box h="12" bg="button.primary.bg" borderRadius="xl" border="1px solid" borderColor="border.subtle" />
                        </VStack>

                        <VStack align="stretch" p="6" bg="bg.surface" borderRadius="2xl" border="1px solid" borderColor="border.subtle" spaceY="4">
                            <Text fontWeight="bold">{t("colors.button_primary_hover")}</Text>
                            <Button bg="button.primary.hover" color="button.primary.fg" size="lg" borderRadius="xl">
                                {t("swiper.hover")}
                            </Button>
                            <Text fontSize="xs" color="fg.muted" fontFamily="mono">bg: button.primary.hover</Text>
                            <Box h="12" bg="button.primary.hover" borderRadius="xl" border="1px solid" borderColor="border.subtle" />
                        </VStack>
                    </SimpleGrid>
                </Box>

                {/* Borders */}
                <Box>
                    <Heading size="2xl" mb="8" fontFamily="heading" fontWeight="bold" pb="2" borderBottom="1px solid" borderColor="border.subtle" color="heading.secondary">
                        {t("colors.borders")}
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
                        <VStack align="stretch" p="6" bg="bg.surface" borderRadius="2xl" border="1px solid" borderColor="border.subtle" spaceY="4">
                            <Text fontWeight="bold">{t("colors.border_subtle")}</Text>
                            <Box h="20" border="2px solid" borderColor="border.subtle" borderRadius="xl" />
                            <Text fontSize="xs" color="fg.muted" fontFamily="mono">border.subtle</Text>
                        </VStack>
                    </SimpleGrid>
                </Box>

                {/* Gradients */}
                <Box>
                    <Heading size="2xl" mb="8" fontFamily="heading" fontWeight="bold" pb="2" borderBottom="1px solid" borderColor="border.subtle" color="heading.secondary">
                        {t("colors.gradients")}
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
                        <GradientDisplay
                            name={t("colors.gradient_glass")}
                            gradient="to-br"
                        />
                    </SimpleGrid>
                </Box>

                {/* Tags/Badges */}
                <Box>
                    <Heading size="2xl" mb="8" fontFamily="heading" fontWeight="bold" pb="2" borderBottom="1px solid" borderColor="border.subtle">
                        {t("colors.tags_badges")} {overlayTheme ? `(${overlayTheme.brandId})` : "(System)"}
                    </Heading>
                    <Flex gap="4" wrap="wrap">
                        <Badge bg="status.bg.success" color="status.success" size="lg" borderRadius="full" px="4">{t("common.success")}</Badge>
                        <Badge bg="status.bg.info" color="status.info" size="lg" borderRadius="full" px="4">{t("common.info")}</Badge>
                        <Badge bg="status.bg.warning" color="status.warning" size="lg" borderRadius="full" px="4">{t("common.warning")}</Badge>
                        <Badge bg="status.bg.error" color="status.error" size="lg" borderRadius="full" px="4">{t("common.error")}</Badge>
                        <Badge bg="brand.primary" color="button.primary.fg" size="lg" borderRadius="full" px="4">{t("common.brand_label")}</Badge>
                        <Badge bg="brand.accent" color="white" size="lg" borderRadius="full" px="4">{t("common.accent_label")}</Badge>
                    </Flex>
                </Box>

                {/* Raw Color Palette */}
                <Box>
                    <Heading size="2xl" mb="8" fontFamily="heading" fontWeight="bold" pb="2" borderBottom="1px solid" borderColor="border.subtle">
                        {t("colors.raw_palette")} {overlayTheme ? `(${overlayTheme.brandId})` : "(Umine System)"}
                    </Heading>

                    <VStack align="stretch" spaceY="8">
                        {overlayTheme && overlayTheme.palette.scales ? (
                            <>
                                {/* Brand Primary Scale */}
                                <Box>
                                    <Text fontWeight="bold" mb="4">Brand Primary Scale</Text>
                                    <SimpleGrid columns={{ base: 3, md: 6 }} gap="3">
                                        {Object.entries(overlayTheme.palette.scales.primary || {}).map(([key, color]) => (
                                            <ColorDisplay key={key} name={key} token={color as string} />
                                        ))}
                                    </SimpleGrid>
                                </Box>

                                {/* Brand Secondary Scale */}
                                <Box>
                                    <Text fontWeight="bold" mb="4">Brand Secondary Scale</Text>
                                    <SimpleGrid columns={{ base: 3, md: 6 }} gap="3">
                                        {Object.entries(overlayTheme.palette.scales.secondary || {}).map(([key, color]) => (
                                            <ColorDisplay key={key} name={key} token={color as string} />
                                        ))}
                                    </SimpleGrid>
                                </Box>

                                {/* Brand Accent Scale */}
                                <Box>
                                    <Text fontWeight="bold" mb="4">Brand Accent Scale</Text>
                                    <SimpleGrid columns={{ base: 3, md: 6 }} gap="3">
                                        {Object.entries(overlayTheme.palette.scales.accent || {}).map(([key, color]) => (
                                            <ColorDisplay key={key} name={key} token={color as string} />
                                        ))}
                                    </SimpleGrid>
                                </Box>
                            </>
                        ) : (
                            <>
                                {/* Umine System Defaults */}
                                <Box>
                                    <Text fontWeight="bold" mb="4">{t("colors.green_system")}</Text>
                                    <SimpleGrid columns={{ base: 3, md: 6 }} gap="3">
                                        <ColorDisplay name="50" token="green.50" />
                                        <ColorDisplay name="100" token="green.100" />
                                        <ColorDisplay name="200" token="green.200" />
                                        <ColorDisplay name="300" token="green.300" />
                                        <ColorDisplay name="400" token="green.400" />
                                        <ColorDisplay name="500" token="green.500" />
                                        <ColorDisplay name="600" token="green.600" />
                                        <ColorDisplay name="700" token="green.700" />
                                        <ColorDisplay name="800" token="green.800" />
                                        <ColorDisplay name="900" token="green.900" />
                                    </SimpleGrid>
                                </Box>

                                <Box>
                                    <Text fontWeight="bold" mb="4">{t("colors.cyan_umine")}</Text>
                                    <SimpleGrid columns={{ base: 3, md: 6 }} gap="3">
                                        <ColorDisplay name="400" token="cyan.400" />
                                        <ColorDisplay name="500" token="cyan.500" />
                                        <ColorDisplay name="600" token="cyan.600" />
                                        <ColorDisplay name="700" token="cyan.700" />
                                        <ColorDisplay name="800" token="cyan.800" />
                                        <ColorDisplay name="900" token="cyan.900" />
                                    </SimpleGrid>
                                </Box>

                                <Box>
                                    <Text fontWeight="bold" mb="4">{t("colors.slate_neutrals")}</Text>
                                    <SimpleGrid columns={{ base: 3, md: 6 }} gap="3">
                                        <ColorDisplay name="50" token="slate.50" />
                                        <ColorDisplay name="100" token="slate.100" />
                                        <ColorDisplay name="200" token="slate.200" />
                                        <ColorDisplay name="300" token="slate.300" />
                                        <ColorDisplay name="400" token="slate.400" />
                                        <ColorDisplay name="500" token="slate.500" />
                                        <ColorDisplay name="600" token="slate.600" />
                                        <ColorDisplay name="700" token="slate.700" />
                                        <ColorDisplay name="800" token="slate.800" />
                                        <ColorDisplay name="900" token="slate.900" />
                                    </SimpleGrid>
                                </Box>
                            </>
                        )}
                    </VStack>
                </Box>
            </VStack>
        </Container>
    );
};
