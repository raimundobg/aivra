import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Filler,
    Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

export type ChartType = "line" | "bar" | "doughnut";

interface ChartCardProps {
    type?: ChartType;
    title: string;
    description: string;
}

const MotionBox = motion.create(Box);

export const ChartCard = ({ type = "line", title, description }: ChartCardProps) => {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const { overlayTheme } = useTheme();

    // Get brand colors - use overlay theme if available, otherwise use Umine defaults
    const brandPrimary = overlayTheme?.palette?.primary || "#10b981"; // green.500
    const brandSecondary = overlayTheme?.palette?.secondary || "#a855f7"; // purple.500
    const brandAccent = overlayTheme?.palette?.accent || "#06b6d4"; // cyan.500

    // Mouse reaction properties
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 100, damping: 30 });
    const springY = useSpring(y, { stiffness: 100, damping: 30 });

    const rotateX = useTransform(springY, [-0.5, 0.5], [5, -5]);
    const rotateY = useTransform(springX, [-0.5, 0.5], [-5, 5]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) / rect.width);
        y.set((e.clientY - centerY) / rect.height);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
    };

    const data = {
        labels: [
            t("charts.months.jan"),
            t("charts.months.feb"),
            t("charts.months.mar"),
            t("charts.months.apr"),
            t("charts.months.may"),
            t("charts.months.jun")
        ],
        datasets: [
            {
                fill: type === "line",
                label: t("charts.data_point"),
                data: type === "doughnut" ? [30, 20, 50] : [33, 53, 85, 41, 44, 65],
                borderColor: type === "line" ? brandPrimary : "transparent",
                backgroundColor: type === "doughnut"
                    ? [`${brandPrimary}cc`, `${brandSecondary}cc`, `${brandAccent}cc`]
                    : `${brandPrimary}80`,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                borderWidth: type === "line" ? 3 : 0,
                borderRadius: 8,
            },
        ],
    };

    if (type === "doughnut") {
        data.labels = [
            t("charts.categories.premium"),
            t("charts.categories.standard"),
            t("charts.categories.free")
        ];
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: type === "doughnut", position: "bottom" as const, labels: { color: "gray", boxWidth: 10, padding: 20 } },
            tooltip: {
                mode: "index" as const,
                intersect: false,
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                titleFont: { family: "Outfit", size: 14 },
                bodyFont: { family: "Inter", size: 12 },
                padding: 12,
                cornerRadius: 8,
            },
        },
        scales: {
            x: { display: type !== "doughnut", grid: { display: false }, ticks: { display: false } },
            y: { display: type !== "doughnut", grid: { display: false }, ticks: { display: false } },
        },
    };

    const renderChart = () => {
        switch (type) {
            case "bar": return <Bar data={data} options={options} />;
            case "doughnut": return <Doughnut data={data} options={options} />;
            default: return <Line data={data} options={options} />;
        }
    };

    return (
        <MotionBox
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                perspective: 1000,
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            p="10"
            borderRadius="3xl"
            bg="bg.surface"
            backdropBlur="20px"
            border="1px solid"
            borderColor="border.subtle"
            boxShadow={isHovered ? "2xl" : "glass"}
            position="relative"
            overflow="hidden"
            display="flex"
            flexDirection="column"
        >
            <VStack align="start" spaceY="1" mb="6" position="relative" zIndex="10">
                <Heading size="2xl" fontFamily="heading" fontWeight="bold" letterSpacing="tight">
                    {title}
                </Heading>
                <Text color="fg.muted" fontSize="sm">
                    {description}
                </Text>
            </VStack>

            <Box h="200px" position="relative" mb={type === 'doughnut' ? '4' : '0'}>
                {renderChart()}
            </Box>

            {/* Decorative Gradient Overlay */}
            <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                bgGradient="radial(circle at 50% 50%, transparent 70%, {colors.bg.surface} 100%)"
                pointerEvents="none"
            />
        </MotionBox>
    );
};
