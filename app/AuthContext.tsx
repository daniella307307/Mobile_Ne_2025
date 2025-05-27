import React, { createContext, ReactNode, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Adjust path as needed
import { User } from '@/services/types';

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    userData: Omit<User, 'id' | 'createdAt'>
  ) => Promise<void>;
  updateProfile: (updates: Partial<Omit<User, 'id'>>) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

// Custom hook for easier consumption in components
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
