import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  unlocked: boolean;       // kya app sabke liye khuli hai?
  isOwner: boolean;        // kya yeh owner ka browser hai?
  telegramId: string | null; // current user ka Telegram ID (WebApp API ya owner localStorage)
  loading: boolean;
  ownerLogin: (telegramId: string, password: string) => Promise<{ ok: boolean; reason?: string }>;
  ownerLogout: (telegramId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  unlocked: false,
  isOwner: false,
  telegramId: null,
  loading: true,
  ownerLogin: async () => ({ ok: false }),
  ownerLogout: async () => {},
});

const OWNER_KEY = 'nobita_owner_id';
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// Get user's Telegram ID: Mini App WebApp API first, then owner localStorage fallback
function getTelegramId(): string | null {
  try {
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser?.id) return String(tgUser.id);
  } catch { /* ignore */ }
  return localStorage.getItem(OWNER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [telegramId, setTelegramId] = useState<string | null>(null);

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

  // Owner ka ID local mein save hai toh isOwner = true + telegramId set karo
  useEffect(() => {
    const saved = localStorage.getItem(OWNER_KEY);
    setIsOwner(!!saved);
    // telegramId: Telegram WebApp API se lo, warna owner ka saved ID
    setTelegramId(getTelegramId());
  }, []);

  const ownerLogin = async (telegramId: string, password: string): Promise<{ ok: boolean; reason?: string }> => {
    try {
      const res = await fetch(`${BASE}/api/auth/owner-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, password }),
      });
      const data = await res.json();
      if (data.allowed) {
        localStorage.setItem(OWNER_KEY, telegramId);
        setIsOwner(true);
        setUnlocked(true);
        setTelegramId(telegramId);
      }
      return { ok: data.allowed ?? false, reason: data.reason };
    } catch {
      return { ok: false };
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
    setTelegramId(getTelegramId()); // WebApp ID rakhna hai agar available ho
  };

  return (
    <AuthContext.Provider value={{ unlocked, isOwner, telegramId, loading, ownerLogin, ownerLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
