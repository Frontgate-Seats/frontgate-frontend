import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ReactNodeProps } from "../shared/types/node.type";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import AuthContext from "../contexts/auth.contexts";
import {
  initializeAuth,
  setAuthState,
  logout,
} from "../store/slices/auth.slice";
import supabaseClient from "../clients/supabase.client";
import { Box, CircularProgress } from "@mui/material";

const AuthProvider: React.FC<ReactNodeProps> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  // Initialize auth on mount — checks persisted session
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Real-time auth state listener — covers token expiry, sign-out from another tab, etc.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        dispatch(setAuthState({ user: session.user, token: session.access_token }));
      } else if (event === "TOKEN_REFRESHED" && session) {
        dispatch(setAuthState({ user: session.user, token: session.access_token }));
      } else if (event === "SIGNED_OUT") {
        dispatch(logout());
        navigate("/auth/signin", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch, navigate]);

  // Redirect unauthenticated users once the session check is complete
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/signin", { replace: true });
    }
  }, [loading, user, navigate]);

  // Block rendering until we know whether the user is authenticated
  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Don't render children if there's no user — the redirect effect will fire
  if (!user) return null;

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
