import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

// MaliA design tokens: Moss #5F6F52 | Beige #E9DFD3 | Rose Gold #C6A28F | Cream #F9F4EF
const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50:  { value: '#f5f7f2' },
          100: { value: '#e8ede0' },
          200: { value: '#ccd9bc' },
          300: { value: '#a8be91' },
          400: { value: '#7f9e68' },
          500: { value: '#5F6F52' }, // Moss Green — primary
          600: { value: '#4a5740' },
          700: { value: '#37412f' },
          800: { value: '#252c1f' },
          900: { value: '#131710' },
        },
        accent: {
          100: { value: '#f5ede7' },
          200: { value: '#e8d5c8' },
          300: { value: '#d4b5a0' },
          400: { value: '#C6A28F' }, // Rose Gold — accent
          500: { value: '#b88a74' },
          600: { value: '#9a7059' },
        },
        beige: {
          50:  { value: '#fdfaf7' },
          100: { value: '#F9F4EF' }, // Cream — bg
          200: { value: '#F2E9E0' },
          300: { value: '#E9DFD3' }, // Beige — secondary
          400: { value: '#ddd0c4' },
          500: { value: '#c9b9a8' },
        },
      },
      fonts: {
        heading: { value: `'Outfit', sans-serif` },
        body:    { value: `'Inter', sans-serif` },
      },
      radii: {
        xl:  { value: '16px' },
        '2xl': { value: '24px' },
      },
    },
    semanticTokens: {
      colors: {
        'bg.canvas':  { value: { base: '{colors.beige.100}', _dark: '#0f1410' } },
        'bg.surface': { value: { base: '#ffffff',            _dark: '#1a2119' } },
        'bg.muted':   { value: { base: '{colors.beige.300}', _dark: '#243024' } },
        'bg.subtle':  { value: { base: '{colors.beige.200}', _dark: '#1e2b1e' } },

        'brand.solid': { value: { base: '{colors.brand.500}', _dark: '{colors.brand.400}' } },
        'brand.muted': { value: { base: '{colors.brand.100}', _dark: '{colors.brand.800}' } },
        'brand.text':  { value: { base: '{colors.brand.700}', _dark: '{colors.brand.200}' } },

        'accent.solid': { value: { base: '{colors.accent.400}', _dark: '{colors.accent.300}' } },
        'accent.muted': { value: { base: '{colors.accent.100}', _dark: '{colors.accent.500}' } },

        'border.default': { value: { base: 'rgba(95,111,82,0.15)', _dark: 'rgba(255,255,255,0.1)' } },
        'text.primary':   { value: { base: '#2D3319',             _dark: '#f0ede8' } },
        'text.muted':     { value: { base: '#7a7264',             _dark: '#a09890' } },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
