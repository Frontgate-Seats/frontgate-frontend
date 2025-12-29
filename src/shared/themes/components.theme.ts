// MUI

import type { Theme } from "@emotion/react";
import type { Components } from "@mui/material";

const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        transition: `
          opacity 0.1s ease-in-out,
          height 0.1s ease-in-out,
          width 0.1s ease-in-out,
          padding 0.1s ease-in-out,
          margin 0.1s ease-in-out,
          box-shadow 0.1s ease-in-out
        `,
      },
      "*": {
        transition: `
          opacity 0.1s ease-in-out,
          height 0.1s ease-in-out,
          width 0.1s ease-in-out,
          padding 0.1s ease-in-out,
          margin 0.1s ease-in-out,
          box-shadow 0.1s ease-in-out
        `,
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: "none",
        padding: "6px 12px",
      },
      sizeSmall: {
        padding: "4px 8px",
      },
      sizeLarge: {
        padding: "8px 16px",
      },
    },
    defaultProps: {
      disableElevation: true,
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        padding: "12px",
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: "12px",
        "&:last-child": {
          paddingBottom: "12px",
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        height: "28px",
      },
      sizeSmall: {
        height: "24px",
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        "& .MuiInputBase-root": {
          fontSize: "14px",
        },
      },
    },
  },
  MuiFormControlLabel: {
    styleOverrides: {
      root: {
        marginLeft: "0px",
        marginRight: "12px",
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      sizeSmall: {
        "& .MuiSvgIcon-root": {
          fontSize: "1rem",
        },
      },
    },
  },
  // Add more component overrides as needed...
};

export default components;
