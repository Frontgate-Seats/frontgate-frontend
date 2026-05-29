import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { signIn, signOut, getCurrentUser } from "../store/slices/auth.slice";

export const useSupabaseAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading, error, token } = useSelector(
    (state: RootState) => state.auth,
  );

  const login = async (email: string, password: string) => {
    return dispatch(signIn({ email, password })).unwrap();
  };

  const logout = async () => {
    return dispatch(signOut()).unwrap();
  };

  const refreshUser = async () => {
    return dispatch(getCurrentUser()).unwrap();
  };

  return {
    user,
    loading,
    error,
    token,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };
};
