import { createSystem, defineConfig, defaultConfig } from "@chakra-ui/react";
import { colors, fonts } from "./tokens";
import { semanticTokens } from "./semanticTokens";

const config = defineConfig({
    theme: {
        tokens: {
            colors,
            fonts,
        },
        semanticTokens,
        breakpoints: {
            sm: "320px",
            md: "768px",
            lg: "960px",
            xl: "1200px",
        },
        keyframes: {
            blob: {
                "0%": { transform: "translate(0px, 0px) scale(1)" },
                "33%": { transform: "translate(30px, -50px) scale(1.1)" },
                "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
                "100%": { transform: "translate(0px, 0px) scale(1)" },
            },
            fadeIn: {
                "0%": { opacity: "0", transform: "translateY(10px)" },
                "100%": { opacity: "1", transform: "translateY(0)" },
            },
        },
    },
});

export const system = createSystem(defaultConfig, config);
