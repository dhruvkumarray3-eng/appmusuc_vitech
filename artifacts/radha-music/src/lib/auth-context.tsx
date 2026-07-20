import { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  telegramId: string | null;
  isAuthenticated: boolean;
  user: null;
}

const AuthContext = createContext<AuthContextType>({
  telegramId: null,
  isAuthenticated: true,
  user: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ telegramId: null, isAuthenticated: true, user: null }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
