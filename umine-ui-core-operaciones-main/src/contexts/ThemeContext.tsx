import { createContext, useContext, useState, useMemo, type ReactNode } from "react";
import { system } from "../theme";

export interface BrandThemeOverlay {
    brandId: string;
    palette: {
        primary: string;
        secondary: string;
        accent: string;
        neutrals: string[];
        scales?: {
            primary?: Record<string, string>;
            secondary?: Record<string, string>;
            accent?: Record<string, string>;
        };
    };
    semanticTokens: Record<string, any>;
    components?: Record<string, any>;
    preview?: {
        contrastScore: number;
        warnings: string[];
    };
    generatedBy?: string;
    createdAt?: string;
    description?: string;
    vibe?: string;
}

interface ThemeContextType {
    colorMode: "light" | "dark";
    setColorMode: (mode: "light" | "dark") => void;
    overlayTheme: BrandThemeOverlay | null;
    setOverlayTheme: (theme: BrandThemeOverlay | null) => void;
    getBaseTheme: () => typeof system;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};

export const CustomThemeProvider = ({ children }: { children: ReactNode }) => {
    const [colorMode, setColorMode] = useState<"light" | "dark">(
        (localStorage.getItem("chakra-ui-color-mode") as "light" | "dark") || "dark"
    );
    const [overlayTheme, setOverlayTheme] = useState<BrandThemeOverlay | null>(null);

    const value = useMemo(
        () => ({
            colorMode,
            setColorMode: (mode: "light" | "dark") => {
                setColorMode(mode);
                localStorage.setItem("chakra-ui-color-mode", mode);
            },
            overlayTheme,
            setOverlayTheme,
            getBaseTheme: () => system,
        }),
        [colorMode, overlayTheme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
