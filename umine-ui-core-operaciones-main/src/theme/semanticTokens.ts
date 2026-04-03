export const semanticTokens = {
    colors: {
        bg: {
            canvas: {
                value: { _light: "{colors.slate.50}", _dark: "{colors.slate.950}" },
            },
            surface: {
                value: {
                    _light: "rgba(255, 255, 255, 0.7)",
                    _dark: "rgba(10, 15, 30, 0.6)",
                },
            },
            muted: {
                value: { _light: "{colors.slate.100}", _dark: "{colors.slate.900}" },
            }
        },
        fg: {
            default: {
                value: { _light: "{colors.slate.700}", _dark: "{colors.slate.200}" },
            },
            muted: {
                value: { _light: "{colors.slate.600}", _dark: "{colors.slate.300}" },
            },
            accent: {
                value: { _light: "{colors.cyan.600}", _dark: "{colors.cyan.300}" },
            },
            inverted: {
                value: { _light: "white", _dark: "{colors.slate.900}" },
            },
            brand: {
                value: "{colors.brand.primary}"
            }
        },
        border: {
            subtle: {
                value: {
                    _light: "rgba(0, 0, 0, 0.08)",
                    _dark: "rgba(255, 255, 255, 0.12)",
                },
            },
        },
        brand: {
            primary: { value: "{colors.cyan.500}" }, // Now Cyan
            secondary: { value: "{colors.umine.secondary}" },
            accent: { value: "{colors.green.500}" }, // Now Green
        },
        status: {
            success: {
                value: { _light: "{colors.green.600}", _dark: "{colors.green.400}" }
            },
            info: {
                value: { _light: "{colors.cyan.600}", _dark: "{colors.cyan.400}" }
            },
            warning: {
                value: { _light: "{colors.orange.600}", _dark: "{colors.orange.400}" }
            },
            error: {
                value: { _light: "{colors.red.600}", _dark: "{colors.red.400}" }
            },
            bg: {
                success: {
                    value: { _light: "{colors.green.50}", _dark: "rgba(34, 197, 94, 0.15)" }
                },
                info: {
                    value: { _light: "{colors.cyan.50}", _dark: "rgba(6, 182, 212, 0.15)" }
                },
                warning: {
                    value: { _light: "{colors.orange.50}", _dark: "rgba(245, 158, 11, 0.15)" }
                },
                error: {
                    value: { _light: "{colors.red.50}", _dark: "rgba(239, 68, 68, 0.15)" }
                }
            }
        },
        button: {
            primary: {
                bg: { value: "{colors.brand.primary}" },
                hover: {
                    value: {
                        _light: "color-mix(in srgb, {colors.brand.primary}, white 15%)",
                        _dark: "color-mix(in srgb, {colors.brand.primary}, white 12%)"
                    }
                },
                fg: { value: "{colors.fg.inverted}" }
            },
            secondary: {
                bg: { value: "transparent" },
                hover: {
                    value: {
                        _light: "color-mix(in srgb, {colors.brand.secondary}, transparent 92%)",
                        _dark: "color-mix(in srgb, {colors.brand.secondary}, transparent 88%)"
                    }
                },
                fg: { value: "{colors.brand.secondary}" },
                border: { value: "{colors.brand.secondary}" }
            },
            accent: {
                bg: { value: "{colors.brand.accent}" },
                hover: {
                    value: {
                        _light: "color-mix(in srgb, {colors.brand.accent}, white 15%)",
                        _dark: "color-mix(in srgb, {colors.brand.accent}, white 12%)"
                    }
                },
                fg: { value: "white" }
            }
        },
        heading: {
            primary: {
                value: { _light: "{colors.slate.900}", _dark: "white" }
            },
            secondary: {
                value: { _light: "{colors.slate.700}", _dark: "{colors.slate.200}" }
            }
        },
        description: {
            primary: {
                value: { _light: "{colors.slate.600}", _dark: "{colors.slate.400}" }
            },
            secondary: {
                value: { _light: "{colors.slate.500}", _dark: "{colors.slate.500}" }
            }
        }
    },
    shadows: {
        glass: {
            value: {
                _light: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
                _dark: "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
            },
        },
    },
    gradients: {
        glass: {
            value: {
                _light: "linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.05) 100%)",
                _dark: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%)",
            }
        }
    }
};
