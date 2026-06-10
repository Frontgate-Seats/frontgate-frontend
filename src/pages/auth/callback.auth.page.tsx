import * as React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useNavigate } from "react-router-dom";
import supabaseClient from "../../clients/supabase.client";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import { setAuthState, logout } from "../../store/slices/auth.slice";
import { setSnackbar } from "../../store/slices/snackbar.slice";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  React.useEffect(() => {
    const handleCallback = async () => {
      // Check if Supabase returned an error in the URL (e.g. signup disabled)
      const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
      const urlError = hashParams.get("error_description") ?? hashParams.get("error");
      if (urlError) {
        dispatch(setSnackbar({ message: "Not authorized. Please contact an administrator.", severity: "error" }));
        navigate("/auth/signin", { replace: true });
        return;
      }

      const { data, error } = await supabaseClient.auth.getSession();

      if (error || !data.session) {
        dispatch(setSnackbar({ message: "Not authorized. Please contact an administrator.", severity: "error" }));
        navigate("/auth/signin", { replace: true });
        return;
      }

      const user = data.session.user;

      // Extra safety: if Supabase still auto-created the user (signup not disabled),
      // block anyone whose account was just created (created_at == last_sign_in_at).
      const createdAt = new Date(user.created_at).getTime();
      const lastSignIn = new Date(user.last_sign_in_at ?? user.created_at).getTime();
      const isNewUser = Math.abs(createdAt - lastSignIn) < 10_000;

      if (isNewUser) {
        await supabaseClient.auth.signOut();
        dispatch(logout());
        dispatch(setSnackbar({ message: "Not authorized. Please contact an administrator.", severity: "error" }));
        navigate("/auth/signin", { replace: true });
        return;
      }

      // Known user — let them in
      dispatch(setAuthState({ user, token: data.session.access_token }));
      navigate("/", { replace: true });
    };

    handleCallback();
  }, [navigate, dispatch]);

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}>
      <CircularProgress />
    </Box>
  );
};

export default AuthCallbackPage;
