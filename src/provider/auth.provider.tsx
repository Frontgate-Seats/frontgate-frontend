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
  }, [dispatch, navigate, user, loading]);

  // Verify token every 10s
  useEffect(() => {
    const verify = async () => {
      try {
        await dispatch(verifyToken()).unwrap();
      } catch (err) {
        dispatch({ type: "auth/logout" });
        navigate("/auth/signin");
      }
    };

    verify();

    const interval = setInterval(verify, 1000 * 60);
    return () => clearInterval(interval);
  }, [dispatch, navigate]);

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
};


export default AuthProvider;