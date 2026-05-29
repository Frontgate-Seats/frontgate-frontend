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

const AuthProvider: React.FC<ReactNodeProps> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  // Initialize auth on mount
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Set up auth state listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        dispatch(
          setAuthState({
            user: session.user,
            token: session.access_token,
          }),
        );
      } else if (event === "SIGNED_OUT") {
        dispatch(logout());
        navigate("/auth/signin");
      } else if (event === "TOKEN_REFRESHED" && session) {
        dispatch(
          setAuthState({
            user: session.user,
            token: session.access_token,
          }),
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch, navigate]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/signin");
    }
  }, [navigate, user, loading]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
