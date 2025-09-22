import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ReactNodeProps } from "../shared/types/node.type";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import AuthContext from "../contexts/auth.contexts";
import { verifyToken } from "../store/slices/auth.slice";

const AuthProvider: React.FC<ReactNodeProps> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      dispatch({ type: "auth/logout" });
      navigate("/auth/signin");
    }
  }, [user, loading]);

  // Verify token every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(verifyToken());
    }, 60000 * 5);
    return () => clearInterval(interval);
  }, [dispatch]);

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
};


export default AuthProvider;