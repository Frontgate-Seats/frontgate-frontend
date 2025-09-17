// src/theme/palette.ts

import type { PaletteOptions } from "@mui/material";

// 🌞 LIGHT MODE - Soft, elegant & professional colors
export const lightPalette: PaletteOptions = {
    mode: 'light',
    primary: {
        main: '#469fcb', // Bold cherry red
        light: '#a6d1e6', // Soft rose red
        dark: '#215974', // Deep red
        contrastText: '#FFFFFF',
    },
    secondary: {
        main: '#51ca99', // Fresh emerald green
        light: '#b4e8d3', // Soft mint green
        dark: '#247655', // Deep jungle green
        contrastText: '#FFFFFF',
    },
    error: {
        main: '#FF3B30', // Vibrant warning red
        contrastText: '#FFFFFF',
    },
    warning: {
        main: '#FF8C00', // Deep warm orange
        contrastText: '#000000',
    },
    success: {
        main: '#34C759', // Bright lime green (iOS success)
        contrastText: '#000000',
    },
    info: {
        main: '#E63946', // Soft coral red
        contrastText: '#FFFFFF',
    },
    background: {
        default: '#F9FAFB', // Soft off-white
        paper: '#FFFFFF', // Clean card color
    },
    text: {
        primary: '#1C1E21', // Charcoal black
        secondary: '#4A5568', // Elegant gray
    },
};


// 🌙 DARK MODE - Futuristic, deep, and luxurious
export const darkPalette: PaletteOptions = {
    mode: 'dark',
    primary: {
        main: '#469fcb', // Bold cherry red
        light: '#a6d1e6', // Soft rose red
        dark: '#215974', // Deep red
        contrastText: '#FFFFFF',
    },
    secondary: {
        main: '#51ca99', // Fresh emerald green
        light: '#b4e8d3', // Soft mint green
        dark: '#247655', // Deep jungle green
        contrastText: '#FFFFFF',
    },
    error: {
        main: '#D72638',
        contrastText: '#FFFFFF',
    },
    warning: {
        main: '#FF8C00',
        contrastText: '#000000',
    },
    success: {
        main: '#34C759',
        contrastText: '#000000',
    },
    info: {
        main: '#E63946',
        contrastText: '#FFFFFF',
    },
    background: {
        default: '#121212', // Almost black, avoids eye strain
        paper: '#1E1E1E', // Slightly lifted dark surface
    },
    text: {
        primary: '#EDEDED', // Soft white
        secondary: '#A0A0A0', // Gentle gray
    },
};

