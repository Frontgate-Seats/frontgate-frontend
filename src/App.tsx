import React, { useMemo } from "react";

// MUI
import { ThemeProvider, CssBaseline, Snackbar, Alert } from "@mui/material";

// ROUTER
import { RouterProvider } from "react-router-dom";
import { createBrowserRouter } from "react-router-dom";

// REDUX
import { useSelector, useDispatch } from "react-redux";
import { closeSnackbar } from "./store/slices/snackbar.slice";

// UTILS
import { getTheme } from "./shared/utils/theme.util";
import { route } from "./router";
import type { AppDispatch, RootState } from "./store";

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // THEME
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);

  // SNACKBAR
  const snackbar = useSelector((state: RootState) => state.snackbar);

  const handleCloseSnackbar = () => {
    dispatch(closeSnackbar());
  };

  const router = createBrowserRouter(route);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.duration}
        onClose={handleCloseSnackbar}
        anchorOrigin={snackbar.anchorOrigin}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant={snackbar.variant}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
};

export default App;
