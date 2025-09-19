import { createContext, useContext } from 'react';

export const NoAuthContext = createContext<null | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(NoAuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default NoAuthContext;