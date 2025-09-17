export type AuthContextType = {
  isAuthenticated: boolean;
  user: object;
  SignIn: () => void;
};
