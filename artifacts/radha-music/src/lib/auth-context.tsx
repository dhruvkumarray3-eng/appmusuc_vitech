import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useGetUser, useTelegramLogin } from '@workspace/api-client-react';

interface AuthContextType {
  telegramId: string | null;
  login: (id: string, firstName?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  user: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [telegramId, setTelegramId] = useState<string | null>(() => {
    return localStorage.getItem('radha_music_telegram_id');
  });

  const { data: user } = useGetUser(telegramId || '', {
    query: {
      enabled: !!telegramId,
      queryKey: ['/api/user', telegramId]
    }
  });

  const loginMutation = useTelegramLogin();

  const login = async (id: string, firstName?: string) => {
    try {
      await loginMutation.mutateAsync({
        data: { telegramId: id, firstName }
      });
      localStorage.setItem('radha_music_telegram_id', id);
      setTelegramId(id);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('radha_music_telegram_id');
    setTelegramId(null);
  };

  return (
    <AuthContext.Provider value={{
      telegramId,
      login,
      logout,
      isAuthenticated: !!telegramId,
      user: user || null
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
