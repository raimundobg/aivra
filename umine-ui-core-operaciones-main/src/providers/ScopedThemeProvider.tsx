"use client"

import { ChakraProvider, createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { useMemo, type ReactNode } from "react";
import { type BrandThemeOverlay } from "../contexts/ThemeContext";
import { colors, fonts } from "../theme/tokens";
import { semanticTokens as baseSemanticTokens } from "../theme/semanticTokens";

interface ScopedThemeProviderProps {
    children: ReactNode;
    overlay: BrandThemeOverlay | null;
}

export function ScopedThemeProvider({ children, overlay }: ScopedThemeProviderProps) {
    const scopedSystem = useMemo(() => {
        if (!overlay || !overlay.palette) {
            console.log("ScopedThemeProvider: No overlay active, using default system.");
            return null;
        }

        try {
            console.log(`ScopedThemeProvider: Generating system for brand: ${overlay.brandId}`);
            // Ensure values exist or fallback to base to prevent crash in createSystem
            const p = overlay.palette;
            const primary = p.primary || "#000000";
            const secondary = p.secondary || "#000000";
            const accent = p.accent || "#000000";

            // Helper to resolve color references like "primary.800" or "neutrals[0]"
            const resolveColorReference = (ref: string): string => {
                if (typeof ref !== 'string') return ref;

                // Handle "primary.800" -> palette.scales.primary["800"]
                if (ref.includes('.') && !ref.startsWith('#') && !ref.startsWith('rgb')) {
                    const [color, shade] = ref.split('.');
                    if (color === 'primary' && p.scales?.primary?.[shade]) {
                        return p.scales.primary[shade];
                    }
                    if (color === 'secondary' && p.scales?.secondary?.[shade]) {
                        return p.scales.secondary[shade];
                    }
                    if (color === 'accent' && p.scales?.accent?.[shade]) {
                        return p.scales.accent[shade];
                    }
                }

                // Handle "neutrals[0]" -> palette.neutrals[0]
                if (ref.includes('[')) {
                    const match = ref.match(/(\w+)\[(\d+)\]/);
                    if (match && p.neutrals) {
                        const index = parseInt(match[2]);
                        if (p.neutrals[index]) {
                            return p.neutrals[index];
                        }
                    }
                }

                // Return as-is if not a reference
                return ref;
            };

            // Deep resolve all references in semantic tokens
            const resolveReferences = (obj: any): any => {
                if (typeof obj === 'string') {
                    return resolveColorReference(obj);
                }
                if (Array.isArray(obj)) {
                    return obj.map(resolveReferences);
                }
                if (obj && typeof obj === 'object') {
                    const resolved: any = {};
                    for (const [key, value] of Object.entries(obj)) {
                        resolved[key] = resolveReferences(value);
                    }
                    return resolved;
                }
                return obj;
            };

            // Build raw color tokens including brand scales
            const rawColorTokens: any = {
                ...colors,
                brand: {
                    primary: { value: primary },
                    secondary: { value: secondary },
                    accent: { value: accent },
                }
            };

            // Inject brand scales as raw tokens if available
            if (p.scales) {
                rawColorTokens.brandPrimary = {};
                rawColorTokens.brandSecondary = {};
                rawColorTokens.brandAccent = {};

                Object.entries(p.scales.primary || {}).forEach(([key, val]) => {
                    rawColorTokens.brandPrimary[key] = { value: val };
                });
                Object.entries(p.scales.secondary || {}).forEach(([key, val]) => {
                    rawColorTokens.brandSecondary[key] = { value: val };
                });
                Object.entries(p.scales.accent || {}).forEach(([key, val]) => {
                    rawColorTokens.brandAccent[key] = { value: val };
                });
            }

            // Deep merge core tokens with overlay
            const config = defineConfig({
                theme: {
                    tokens: {
                        colors: rawColorTokens,
                        fonts,
                    },
                    semanticTokens: {
                        ...baseSemanticTokens,
                        colors: {
                            ...baseSemanticTokens.colors,
                            // BACKGROUNDS
                            bg: {
                                ...baseSemanticTokens.colors?.bg,
                                brand: { value: primary },
                                accent: { value: accent }
                            },
                            // FOREGROUNDS (TEXT)
                            fg: {
                                ...baseSemanticTokens.colors?.fg,
                                brand: { value: "{colors.brand.primary}" },
                                accent: { value: "{colors.brand.accent}" }
                            },
                            // BORDERS
                            border: {
                                ...baseSemanticTokens.colors?.border,
                                brand: { value: "{colors.brand.primary}" },
                                accent: { value: "{colors.brand.accent}" }
                            },
                            // BRAND CORE
                            brand: {
                                primary: { value: primary },
                                secondary: { value: secondary },
                                accent: { value: accent },
                            },
                            // Inherit buttons from baseSemanticTokens and customize for brand
                            button: {
                                ...baseSemanticTokens.colors?.button,
                                primary: {
                                    bg: { value: "{colors.brand.primary}" },
                                    hover: {
                                        value: {
                                            base: p.scales?.primary?.["400"] || "color-mix(in srgb, {colors.brand.primary}, white 15%)",
                                            _dark: p.scales?.primary?.["400"] || "color-mix(in srgb, {colors.brand.primary}, white 12%)"
                                        }
                                    },
                                    fg: { value: "{colors.fg.inverted}" }
                                },
                                secondary: {
                                    bg: { value: "transparent" },
                                    fg: { value: "{colors.brand.secondary}" },
                                    border: { value: "{colors.brand.secondary}" },
                                    hover: {
                                        value: {
                                            base: "color-mix(in srgb, {colors.brand.secondary}, transparent 90%)",
                                            _dark: "color-mix(in srgb, {colors.brand.secondary}, transparent 80%)"
                                        }
                                    }
                                },
                                accent: {
                                    bg: { value: "{colors.brand.accent}" },
                                    hover: {
                                        value: {
                                            base: p.scales?.accent?.["600"] || "color-mix(in srgb, {colors.brand.accent}, black 10%)",
                                            _dark: p.scales?.accent?.["400"] || "color-mix(in srgb, {colors.brand.accent}, white 15%)"
                                        }
                                    },
                                    fg: { value: "white" }
                                }
                            },
                            // STATUS (for badges/tags)
                            status: {
                                success: { value: primary },
                                info: { value: accent },
                                warning: { value: secondary },
                                error: { value: "#ef4444" }
                            },
                            // HEADINGS (light/dark mode aware)
                            heading: {
                                primary: {
                                    value: {
                                        base: p.scales?.primary?.["900"] || "color-mix(in srgb, {colors.brand.primary}, black 40%)",
                                        _dark: p.scales?.primary?.["100"] || "color-mix(in srgb, {colors.brand.primary}, white 60%)"
                                    }
                                },
                                secondary: {
                                    value: {
                                        base: p.scales?.primary?.["700"] || "color-mix(in srgb, {colors.brand.primary}, black 20%)",
                                        _dark: p.scales?.primary?.["300"] || "color-mix(in srgb, {colors.brand.primary}, white 40%)"
                                    }
                                }
                            },
                            // DESCRIPTIONS (light/dark mode aware)
                            description: {
                                primary: {
                                    value: {
                                        base: p.scales?.secondary?.["700"] || secondary,
                                        _dark: p.scales?.secondary?.["300"] || secondary
                                    }
                                },
                                secondary: {
                                    value: {
                                        base: p.scales?.secondary?.["600"] || secondary,
                                        _dark: p.scales?.secondary?.["400"] || secondary
                                    }
                                }
                            }
                        }
                    },
                }
            });



            // Deep merge semantic tokens from AI if provided
            if (overlay.semanticTokens) {
                // First, resolve all references in the semantic tokens
                const resolvedSemanticTokens = resolveReferences(overlay.semanticTokens);

                console.log("ScopedThemeProvider: Resolved semantic tokens:", resolvedSemanticTokens);

                // Handle only nested structure (colors.brand.primary, not "colors.brand.primary")
                if (resolvedSemanticTokens.colors && typeof resolvedSemanticTokens.colors === 'object') {
                    // Deep merge color categories
                    Object.entries(resolvedSemanticTokens.colors).forEach(([category, tokens]) => {
                        if (tokens && typeof tokens === 'object') {
                            config.theme!.semanticTokens!.colors![category] = {
                                ...config.theme!.semanticTokens!.colors![category],
                                ...(tokens as any)
                            };
                        }
                    });
                }
            }

            console.log("ScopedThemeProvider: Final semanticTokens.colors.button:", config.theme!.semanticTokens!.colors!.button);
            console.log("ScopedThemeProvider: Successfully created new theme system.");
            return createSystem(defaultConfig, config);
        } catch (error) {
            console.error("Critical: Failed to create dynamic theme system:", error);
            return null; // Fallback to base system
        }
    }, [overlay]);

    if (!scopedSystem) return <>{children}</>;

    return (
        <ChakraProvider value={scopedSystem}>
            {children}
        </ChakraProvider>
    );
}
