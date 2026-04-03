# Umine | Core Operaciones Architecture

This project is the core operational platform for Umine, focused on purchase order extraction and management.

## Tech Stack
- **Vite**: Build tool and dev server.
- **React**: UI library.
- **TypeScript**: Type safety.
- **Chakra UI v3**: UI kit and design system foundation.
- **React Router**: SPA navigation.
- **Chart.js**: Data visualization.
- **Framer Motion**: Animations.

## Folder Structure
- `src/app`: Application shell and main configuration.
- `src/providers`: React Context providers (Theme, Analytics).
- `src/pages`: Distinct sections of the landing page.
- `src/templates`: Layout structures.
- `src/organisms`: Complex UI blocks (Sidebar, ChartCard).
- `src/molecules`: Smaller UI components (NavItem, ColorSwatch).
- `src/atoms`: Basic UI elements (BackgroundBlobs).
- `src/theme`: Chakra UI system definition (tokens, semantic tokens).

## Design Philosophy
The system follows a "Glassmorphism" aesthetic with high contrast and depth. Surfaces use semi-transparent backgrounds with blur effects, defined through semantic tokens in the Chakra theme.
