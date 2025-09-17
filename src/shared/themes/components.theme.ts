// MUI

import type { Theme } from "@emotion/react";
import type { Components } from "@mui/material";

const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        transition: "all 0.5s ease", 
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
      },
    },
    defaultProps: {
      disableElevation: true,
    },
  },
  // Add more component overrides as needed...
};


export default components;