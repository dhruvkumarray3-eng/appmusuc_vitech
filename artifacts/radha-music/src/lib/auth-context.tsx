import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  unlocked: boolean;       // kya app sabke liye khuli hai?
  isOwner: boolean;        // kya yeh owner ka browser hai?
  loading: boolean;
  ownerLogin: (telegramId: string) => Promise<boolean>;
  ownerLogout: (telegramId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  unlocked: false,
  isOwner: false,
  loading: true,
  ownerLogin: async () => false,
  ownerLogout: async () => {},
});

const OWNER_KEY = 'nobita_owner_id';
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // Har 3 second mein status check karo (sab browsers pe live update)
  useEffect(() => {
    let active = true;

    const check = async () => {
      try {
        const res = await fetch(`${BASE}/api/auth/status`);
        const data = await res.json();
        if (active) setUnlocked(data.unlocked);
      } catch {
        // server se connect nahi hua, thoda wait karo
      } finally {
        if (active) setLoading(false);
      }
    };

    check();
    const interval = setInterval(check, 3000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  // Owner ka ID local mein save hai toh isOwner = true
  useEffect(() => {
    setIsOwner(!!localStorage.getItem(OWNER_KEY));
  }, []);

  const ownerLogin = async (telegramId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE}/api/auth/owner-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId }),
      });
      const data = await res.json();
      if (data.allowed) {
        localStorage.setItem(OWNER_KEY, telegramId);
        setIsOwner(true);
        setUnlocked(true);
      }
      return data.allowed ?? false;
    } catch {
      return false;
    }
  };

  const ownerLogout = async (telegramId: string) => {
    try {
      await fetch(`${BASE}/api/auth/owner-logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId }),
      });
    } catch {}
    localStorage.removeItem(OWNER_KEY);
    setIsOwner(false);
    setUnlocked(false);
  };

  return (
    <AuthContext.Provider value={{ unlocked, isOwner, loading, ownerLogin, ownerLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
