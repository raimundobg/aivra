import { Box, Heading, Text, Flex, VStack, Button, Badge, IconButton } from "@chakra-ui/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import { motion } from "framer-motion";

// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/navigation";
// @ts-ignore
import "swiper/css/pagination";
// @ts-ignore
import "swiper/css/effect-fade";

import { useTranslation } from "react-i18next";
import { LivingOrb } from "../atoms/LivingOrb";
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export const SwiperShowcase = () => {
    const { t } = useTranslation();
    const { overlayTheme } = useTheme();
    // Random scales for backgrounds (50% - 70% coverage approximately)
    // Scaling values adjusted: 2.5 is ~50%, 3.5 is ~70% coverage relative to container
    const crystalScale = 2.5 + Math.random() * 1.0;

    return (
        <Box
            w="full"
            borderRadius="4xl"
            overflow="hidden"
            bg="bg.surface"
            border="1px solid"
            borderColor="border.subtle"
            boxShadow="glass"
            position="relative"
            className="Umine-swiper-container"
        >
            <Swiper
                modules={[Navigation, Pagination, Autoplay, EffectFade]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                navigation={{
                    nextEl: ".swiper-button-next-main",
                    prevEl: ".swiper-button-prev-main",
                }}
                pagination={{ clickable: true }}
                autoplay={{ delay: 8000 }}
                style={{ height: "600px" as any }}
            >
                {/* Slide 1: Hollywood Motion */}
                <SwiperSlide>
                    <Box h="full" w="full" position="relative" overflow="hidden">
                        <Box
                            position="absolute"
                            left="-10%"
                            top="-10%"
                            w="120%"
                            h="120%"
                            zIndex="0"
                            opacity="0.2"
                            pointerEvents="none"
                            animation="backgroundFloat 15s infinite ease-in-out"
                        >
                            <LivingOrb color={overlayTheme?.palette.accent || "#06b6d4"} scale={3} distort={0.6} />
                        </Box>

                        <Flex h="full" direction="column" justify="center" px={{ base: "8", md: "24" }} position="relative" zIndex="10">
                            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 1.2 }}>
                                <VStack align="start" spaceY="6" maxW="2xl">
                                    <Badge bg="brand.accent" color="white" variant="solid" borderRadius="full" px="3">{t("swiper.slide1_badge")}</Badge>
                                    <Heading
                                        size="7xl"
                                        fontWeight="black"
                                        letterSpacing="tighter"
                                        lineHeight="1"
                                        color="heading.primary"
                                        dangerouslySetInnerHTML={{ __html: t("swiper.slide1_title") }}
                                    />
                                    <Text fontSize="xl" color="description.primary" maxW="xl">
                                        {t("swiper.slide1_desc")}
                                    </Text>
                                    <Button
                                        size="xl"
                                        h="14"
                                        px="10"
                                        bg="button.primary.bg"
                                        color="button.primary.fg"
                                        borderRadius="xl"
                                        position="relative"
                                        zIndex="10"
                                        _hover={{
                                            bg: { _light: "green.300", _dark: "green.400" },
                                            transform: "translateY(-4px) scale(1.05)",
                                            boxShadow: "0 10px 20px rgba(34, 197, 94, 0.4)"
                                        }}
                                        transition="all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                                    >
                                        {t("swiper.slide1_btn")}
                                        <ArrowRight size={20} style={{ marginLeft: '12px' }} />
                                    </Button>
                                </VStack>
                            </motion.div>
                        </Flex>
                    </Box>
                </SwiperSlide>

                {/* Slide 2: Capas de Cristal - Randomized Scale 50-70% */}
                <SwiperSlide>
                    <Box h="full" w="full" position="relative" overflow="hidden">
                        <Box
                            position="absolute"
                            right="-20%"
                            bottom="-20%"
                            w="150%"
                            h="150%"
                            zIndex="0"
                            opacity="0.15"
                            pointerEvents="none"
                            animation="backgroundFloatReverse 20s infinite ease-in-out"
                        >
                            <LivingOrb color={overlayTheme?.palette.secondary || "#8b5cf6"} scale={crystalScale} distort={0.8} />
                        </Box>

                        <Flex h="full" direction="column" justify="center" px={{ base: "8", md: "24" }} position="relative" zIndex="10">
                            <VStack align="start" spaceY="6" maxW="2xl">
                                <Flex w="14" h="14" bg="brand.accent" borderRadius="2xl" align="center" justify="center" color="white" shadow="2xl">
                                    <Sparkles size={28} />
                                </Flex>
                                <Heading size="7xl" fontWeight="black" letterSpacing="tighter" color="heading.primary">
                                    {t("swiper.slide2_title")}
                                </Heading>
                                <Text fontSize="xl" color="description.primary">
                                    {t("swiper.slide2_desc")}
                                </Text>
                            </VStack>
                        </Flex>
                    </Box>
                </SwiperSlide>

                {/* Slide 3: Velocidad Total - Removed Icon */}
                <SwiperSlide>
                    <Box h="full" w="full" position="relative" overflow="hidden">
                        <Box
                            position="absolute"
                            left="50%"
                            top="50%"
                            transform="translate(-50%, -50%)"
                            w="120%"
                            h="120%"
                            zIndex="0"
                            opacity="0.25"
                            pointerEvents="none"
                        >
                            <LivingOrb color={overlayTheme?.palette.accent || "#06b6d4"} scale={2.2} distort={0.8} />
                        </Box>

                        <Flex h="full" direction="column" align="center" justify="center" px="8" textAlign="center" spaceY="10" position="relative" zIndex="10">
                            <VStack spaceY="8">
                                <Heading size="7xl" fontWeight="black" letterSpacing="widest" textTransform="uppercase" color="heading.primary">{t("swiper.slide3_title")}</Heading>
                                <Text fontSize="2xl" color="description.primary" maxW="3xl">
                                    {t("swiper.slide3_desc")}
                                </Text>
                                <Button
                                    size="xl"
                                    bg="button.secondary.bg"
                                    color="button.secondary.fg"
                                    borderColor="button.secondary.border"
                                    border="2px solid"
                                    h="14"
                                    px="12"
                                    borderRadius="xl"
                                    _hover={{
                                        bg: "button.secondary.hover",
                                        transform: "translateY(-4px)",
                                        boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
                                    }}
                                    transition="all 0.2s ease"
                                    mt="4"
                                >
                                    {t("swiper.slide3_btn")}
                                </Button>
                            </VStack>
                        </Flex>
                    </Box>
                </SwiperSlide>
            </Swiper>

            {/* Custom Navigation Buttons with Hover Effects */}
            <IconButton
                className="swiper-button-prev-main"
                position="absolute"
                left="6"
                top="50%"
                transform="translateY(-50%)"
                zIndex="20"
                variant="ghost"
                color="white"
                borderRadius="full"
                bg="brand.primary/30"
                backdropBlur="10px"
                border="1px solid"
                borderColor="brand.primary/50"
                _hover={{
                    bg: "brand.primary",
                    color: "white",
                    transform: "translateY(-50%) scale(1.1)"
                }}
                transition="all 0.3s"
            >
                <ChevronLeft size={32} />
            </IconButton>

            <IconButton
                className="swiper-button-next-main"
                position="absolute"
                right="6"
                top="50%"
                transform="translateY(-50%)"
                zIndex="20"
                variant="ghost"
                color="white"
                borderRadius="full"
                bg="brand.primary/30"
                backdropBlur="10px"
                border="1px solid"
                borderColor="brand.primary/50"
                _hover={{
                    bg: "brand.primary",
                    color: "white",
                    transform: "translateY(-50%) scale(1.1)"
                }}
                transition="all 0.3s"
            >
                <ChevronRight size={32} />
            </IconButton>

            <style>{`
        @keyframes backgroundFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, -30px) scale(1.05); }
        }
        @keyframes backgroundFloatReverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 40px) scale(0.95); }
        }
        .Umine-swiper-container .swiper-pagination-bullet { background: rgba(0, 255, 255, 0.2); width: 12px; height: 12px; }
        .Umine-swiper-container .swiper-pagination-bullet-active { background: #06b6d4; width: 30px; border-radius: 6px; }
        
        /* Fix para que los botones de las slides invisibles no bloqueen la activa */
        .swiper-slide:not(.swiper-slide-active) {
          pointer-events: none;
          visibility: hidden;
        }
        .swiper-slide-active {
          pointer-events: auto;
          visibility: visible;
        }
      `}</style>
        </Box>
    );
};
