import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ReactNodeProps } from "../shared/types/node.type";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import AuthContext from "../contexts/auth.contexts";

export const AuthProvider: React.FC<ReactNodeProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth/signIn");
    }
  }, [user, loading]);

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
};
