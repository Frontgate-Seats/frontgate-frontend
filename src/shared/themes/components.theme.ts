// MUI

import type { Theme } from "@emotion/react";
import type { Components } from "@mui/material";

const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        transition: `
          opacity 0.3s ease-in-out,
          height 0.3s ease-in-out,
          width 0.3s ease-in-out,
          padding 0.3s ease-in-out,
          margin 0.3s ease-in-out,
          box-shadow 0.3s ease-in-out
        `,
      },
      "*": {
        transition: `
          opacity 0.3s ease-in-out,
          height 0.3s ease-in-out,
          width 0.3s ease-in-out,
          padding 0.3s ease-in-out,
          margin 0.3s ease-in-out,
          box-shadow 0.3s ease-in-out
        `,
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: "none",
      },
    },
    defaultProps: {
      disableElevation: true,
    },
  },
  // Add more component overrides as needed...
};

export default components;
