import React, { createContext, useContext } from 'react';
import FPEnterEmail from '../screens/Auth/FPEnterEmail';

type AuthContextType = {
  FP: (otp: string) => Promise<boolean>;
  // Add other auth-related methods as needed
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const forgotPassword = async (otp: string) => {
    // Implement your forgot password logic here
    return true;
  };

  return (
    <AuthContext.Provider value={{ FPEnterEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 