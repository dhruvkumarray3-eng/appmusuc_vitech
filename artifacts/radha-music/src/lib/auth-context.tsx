import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  unlocked: boolean;
  isOwner: boolean;
  telegramId: string | null;
  profileName: string | null;
  profileUsername: string | null;
  profilePhoto: string | null;
  loading: boolean;
  ownerLogin: (telegramId: string, password: string) => Promise<{ ok: boolean; reason?: string }>;
  ownerLogout: (telegramId: string) => Promise<void>;
  userLogout: () => void;
  updateProfile: (name: string, username: string, photo: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  unlocked: false,
  isOwner: false,
  telegramId: null,
  profileName: null,
  profileUsername: null,
  profilePhoto: null,
  loading: true,
  ownerLogin: async () => ({ ok: false }),
  ownerLogout: async () => {},
  userLogout: () => {},
  updateProfile: async () => {},
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

// Get Telegram user info from WebApp if available
function getTelegramUser(): { id: string; firstName?: string; username?: string; photoUrl?: string } | null {
  try {
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser?.id) {
      return {
        id: String(tgUser.id),
        firstName: tgUser.first_name ?? undefined,
        username: tgUser.username ?? undefined,
        photoUrl: tgUser.photo_url ?? undefined,
      };
    }
  } catch { /* ignore */ }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Har 3 second mein status check karo
  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const res = await fetch(`${BASE}/api/auth/status`);
        const data = await res.json();
        if (active) setUnlocked(data.unlocked);
      } catch {
        // server se connect nahi hua
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
    setTelegramId(getTelegramId());
  }, []);

  // Auto-register Telegram Mini App users
  useEffect(() => {
    const tgUser = getTelegramUser();
    if (!tgUser) return;
    // Register/update user record via API
    fetch(`${BASE}/api/auth/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: tgUser.id,
        firstName: tgUser.firstName ?? null,
        username: tgUser.username ?? null,
        photoUrl: tgUser.photoUrl ?? null,
      }),
    }).catch(() => {});
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
    setTelegramId(getTelegramId());
  };

  // Load profile from DB whenever telegramId changes
  useEffect(() => {
    if (!telegramId) return;
    fetch(`${BASE}/api/user/${telegramId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setProfileName(data.firstName ?? null);
          setProfileUsername(data.username ?? null);
          setProfilePhoto(data.photoUrl ?? null);
        }
      })
      .catch(() => {});
  }, [telegramId]);

  // Update name + username + photo in DB and local state
  const updateProfile = async (name: string, username: string, photo: string | null): Promise<void> => {
    if (!telegramId) return;
    const res = await fetch(`${BASE}/api/user/${telegramId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: name || null,
        username: username || null,
        photoUrl: photo,
      }),
    });
    if (res.ok) {
      setProfileName(name || null);
      setProfileUsername(username || null);
      setProfilePhoto(photo);
    }
  };

  // Regular user logout — sirf local state clear
  const userLogout = () => {
    localStorage.removeItem(OWNER_KEY);
    setIsOwner(false);
    setProfileName(null);
    setProfileUsername(null);
    setProfilePhoto(null);
    setTelegramId(getTelegramId());
  };

  return (
    <AuthContext.Provider value={{
      unlocked, isOwner, telegramId,
      profileName, profileUsername, profilePhoto,
      loading, ownerLogin, ownerLogout, userLogout, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
