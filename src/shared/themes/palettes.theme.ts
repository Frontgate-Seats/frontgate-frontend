// src/theme/palette.ts
import type { PaletteOptions } from "@mui/material";
import { alpha } from "@mui/material/styles";

// 🌞 LIGHT MODE - Soft, elegant & professional colors
export const lightPalette: PaletteOptions = {
  mode: "light",
  primary: {
    main: "#2978B5", // brand[400] – strong, professional blue
    light: "#65A5D6", // brand[200] – soft highlight
    dark: "#1B4F73", // brand[700] – deep blue
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#51CA99", // green[400] – fresh accent
    light: "#A5E0C5", // green[200] – gentle highlight
    dark: "#247655", // green[700] – dark green
    contrastText: "#FFFFFF",
  },
  error: {
    main: "#D72638", // red[400] – vibrant warning
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#FF8C00", // orange[400] – warm attention
    contrastText: "#000000",
  },
  success: {
    main: "#34C759", // green[400] – bright success
    contrastText: "#000000",
  },
  info: {
    main: "#469FCB", // brand[300] – informative blue
    contrastText: "#FFFFFF",
  },
  grey: {
    50: "#F6F7FA",
    100: "#ECEFF4",
    200: "#DDE1E8",
    300: "#C5CAD4",
    400: "#AAB0C2",
    500: "#7F8696",
    600: "#6B7080",
    700: "#4A5568",
    800: "#2A2E37",
    900: "#121417",
  },
  divider: alpha("#AAB0C2", 0.4),
  background: {
    default: "#FFFFFF",
    paper: "#F9FAFB",
  },
  text: {
    primary: "#1C1E21",
    secondary: "#4A5568",
  },
  action: {
    hover: alpha("#AAB0C2", 0.2),
    selected: alpha("#AAB0C2", 0.3),
  },
};

// 🌙 DARK MODE - Futuristic, deep, and luxurious
export const darkPalette: PaletteOptions = {
  mode: "dark",
  primary: {
    main: "#2978B5",
    light: "#65A5D6",
    dark: "#1B4F73",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#51CA99",
    light: "#A5E0C5",
    dark: "#247655",
    contrastText: "#FFFFFF",
  },
  error: {
    main: "#D72638",
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#FF8C00",
    contrastText: "#000000",
  },
  success: {
    main: "#34C759",
    contrastText: "#000000",
  },
  info: {
    main: "#469FCB",
    contrastText: "#FFFFFF",
  },
  grey: {
    50: "#EDEDED",
    100: "#D6D6D6",
    200: "#B0B0B0",
    300: "#8A8A8A",
    400: "#6B6B6B",
    500: "#4A4A4A",
    600: "#333333",
    700: "#1E1E1E",
    800: "#121212",
    900: "#0A0A0A",
  },
  divider: alpha("#4A4A4A", 0.6),
  background: {
    default: "#121212",
    paper: "#1E1E1E",
  },
  text: {
    primary: "#EDEDED",
    secondary: "#A0A0A0",
  },
  action: {
    hover: alpha("#4A4A4A", 0.2),
    selected: alpha("#4A4A4A", 0.3),
  },
};
