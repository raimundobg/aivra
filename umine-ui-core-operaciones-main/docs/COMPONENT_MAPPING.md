# Component Mapping: HTML -> Chakra UI

This document maps the elements from the original HTML design to the new React/Chakra UI architecture.

| HTML/Tailwind Block | React Component | Chakra UI Tokens / Props |
|---------------------|-----------------|--------------------------|
| Sidebar Nav | `SidebarNav` (Organism) | `bg: "bg.surface"`, `backdropBlur: "16px"` |
| Ambient Blobs | `BackgroundBlobs` (Atom) | `animate: "blob"`, `blur: "3xl"` |
| Content Cards | `UCard` / Inline | `bg: "bg.surface"`, `shadow: "glass"` |
| Color Swatches | `ColorSwatch` (Molecule) | `bg: "{colors.slate.xxx}"` |
| Charts | `ChartCard` (Organism) | Custom Chart.js integration |
| Theme Toggle | `ColorModeButton` (Snippet) | `useColorMode()` hook |
| Glass Effects | `Box` with props | `bg: "bg.surface"`, `border: "1px solid"`, `borderColor: "border.subtle"` |

## Visual Replacements
- **Tailwind `bg-white/70 backdrop-blur-lg`** -> `bg: "bg.surface"`, `backdropBlur: "16px"`.
- **Tailwind `border-white/50`** -> `borderColor: "border.subtle"`.
- **Tailwind `shadow-sm`** -> `boxShadow: "glass"`.
