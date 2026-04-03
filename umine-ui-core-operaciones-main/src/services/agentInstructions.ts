import { type BrandThemeOverlay } from "../contexts/ThemeContext";

/**
 * Generates a prompt for the AI agent based on the current theme and language.
 * This is a placeholder implementation.
 */
export const generateAgentPrompt = (overlayTheme: BrandThemeOverlay | null, t: any, language: string) => {
    const brandName = overlayTheme?.brandId || "Umine";
    const primaryColor = overlayTheme?.palette?.primary || "#10b981";

    return `System Instructions for ${brandName} AI Agent
Language: ${language}

You are an AI assistant for ${brandName}. 
Your primary goal is to help users maintain a consistent brand identity.

Current Brand Configuration:
- Brand ID: ${brandName}
- Primary Color: ${primaryColor}

${t("agent.prompt_instructions_placeholder", "Please following the brand guidelines provided in the design system.")}
`;
};
