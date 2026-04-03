"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { system } from "../theme"
import {
    ColorModeProvider,
} from "../components/ui/color-mode"
import { type ReactNode } from "react"
import { CustomThemeProvider } from "../contexts/ThemeContext"

export function ThemeProvider({ children }: { children: ReactNode }) {
    return (
        <CustomThemeProvider>
            <ChakraProvider value={system}>
                <ColorModeProvider>{children}</ColorModeProvider>
            </ChakraProvider>
        </CustomThemeProvider>
    )
}
