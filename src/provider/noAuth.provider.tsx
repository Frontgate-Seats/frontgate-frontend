import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ReactNodeProps } from "../shared/types/node.type";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import NoAuthContext from "../contexts/noAuth.context";

const NoAuthProvider: React.FC<ReactNodeProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user]);

  return <NoAuthContext.Provider value={null}>{children}</NoAuthContext.Provider>;
};


export default NoAuthProvider;