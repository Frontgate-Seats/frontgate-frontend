import { createTheme, extendTheme, type ThemeOptions } from "@mui/material";
import { darkPalette, lightPalette } from "../themes/palettes.theme";
import typography from "../themes/typography.theme";
import breakpoints from "../themes/breakpoints.theme";
import components from "../themes/components.theme";
import spacing from "../themes/spacings.theme";

export const getTheme = (): ReturnType<typeof createTheme> => {
  const themeOptions: ThemeOptions = extendTheme({
    colorSchemes: {
      light: {
        palette: lightPalette,
      },
      dark: {
        palette: darkPalette,
      },
    },
    cssVarPrefix: "frontgateseats",
    colorSchemeSelector: "class",
    typography,
    breakpoints,
    components,
    spacing,
  });

  return createTheme(themeOptions);
};
