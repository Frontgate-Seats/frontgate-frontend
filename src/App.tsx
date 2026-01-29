import React, { useMemo } from "react";

// MUI
import { ThemeProvider, CssBaseline, Snackbar, Alert } from "@mui/material";

// ROUTER
import { RouterProvider } from "react-router-dom";
import { createBrowserRouter } from "react-router-dom";

// REDUXX
import { useSelector, useDispatch } from "react-redux";
import { closeSnackbar } from "./store/slices/snackbar.slice";

// AUTH
import { AuthProvider } from "./contexts/auth.context";

// UTILS
import { getTheme } from "./shared/utils/theme.util";
import { route } from "./router";
import type { AppDispatch, RootState } from "./store";

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // THEME
  const theme = useMemo(() => getTheme(), []);

  // SNACKBAR
  const snackbar = useSelector((state: RootState) => state.snackbar);

  const handleCloseSnackbar = () => {
    dispatch(closeSnackbar());
  };

  const router = createBrowserRouter(route);

  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline />
      <AuthProvider>
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
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
