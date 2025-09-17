import { createTheme, type PaletteOptions, type ThemeOptions } from "@mui/material";
import { darkPalette, lightPalette } from "../themes/palettes.theme";
import typography from "../themes/typography.theme";
import breakpoints from "../themes/breakpoints.theme";
import components from "../themes/components.theme";
import spacing from "../themes/spacings.theme";

export const getPalette = (mode: 'light' | 'dark'): PaletteOptions =>
    mode === 'light' ? lightPalette : darkPalette;

export const getTheme = (mode: 'light' | 'dark'): ReturnType<typeof createTheme> => {
  const themeOptions: ThemeOptions = {
    palette: getPalette(mode),
    typography,
    breakpoints,
    components,
    spacing,
  };

  return createTheme(themeOptions);
};
