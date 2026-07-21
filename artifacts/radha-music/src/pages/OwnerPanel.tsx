import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import {
  Shield, Users, Activity, Radio, Lock, Unlock,
  LogOut, RefreshCw, Clock, Eye, EyeOff, KeyRound
} from "lucide-react";

interface Stats {
  unlocked: boolean;
  totalRegistered: number;
  activeToday: number;
  totalListeners: number;
  recentUsers: { telegramId: string; firstName: string | null; username: string | null; lastLogin: string }[];
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── In-panel owner verification ──────────────────────────────────────────────
function OwnerVerifyGate({ onVerified }: { onVerified: () => void }) {
  const { ownerLogin } = useAuth();
  const [tid, setTid] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tid.trim() || !pwd.trim()) return;
    setLoading(true);
    setError("");
    const result = await ownerLogin(tid.trim(), pwd.trim());
    if (result.ok) {
      onVerified();
    } else {
      setError(result.reason === "password" ? "❌ Galat password." : "❌ Galat Owner ID.");
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Audiowide, cursive" }}>
            Owner Panel
          </h1>
          <p className="text-sm text-muted-foreground">Owner ID aur password daalo to andar aao</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Owner Telegram ID</label>
            <input
              type="text"
              value={tid}
              onChange={(e) => { setTid(e.target.value); setError(""); }}
              placeholder="Apna Telegram ID daalo"
              className="w-full px-3 py-2.5 rounded-xl bg-background/50 border border-primary/30 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm transition-colors"
              autoComplete="off"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={pwd}
                onChange={(e) => { setPwd(e.target.value); setError(""); }}
                placeholder="Password daalo"
                className="w-full px-3 py-2.5 pr-10 rounded-xl bg-background/50 border border-primary/30 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm transition-colors"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !tid.trim() || !pwd.trim()}
            className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            {loading ? "Verifying..." : "Panel Kholो"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main panel (after verification) ─────────────────────────────────────────
function PanelContent() {
  const { isOwner, telegramId, ownerLogout } = useAuth();
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BASE}/api/auth/stats`);
      const data = await res.json();
      setStats(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOwner) { navigate("/"); return; }
    fetchStats();
    const interval = setInterval(fetchStats, 10_000);
    return () => clearInterval(interval);
  }, [isOwner]);

  const toggleApp = async () => {
    if (!telegramId || !stats) return;
    setToggling(true);
    try {
      if (stats.unlocked) {
        await fetch(`${BASE}/api/auth/owner-logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramId }),
        });
        await fetchStats();
      }
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = async () => {
    if (!telegramId) return;
    setLoggingOut(true);
    await ownerLogout(telegramId);
    navigate("/");
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-6 pb-32 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Owner Panel</h1>
            <p className="text-xs text-muted-foreground">ID: {telegramId}</p>
          </div>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* App Status Card */}
      <div className={`rounded-2xl border p-5 flex items-center justify-between transition-all ${
        stats?.unlocked
          ? "bg-green-500/10 border-green-500/30"
          : "bg-red-500/10 border-red-500/30"
      }`}>
        <div className="flex items-center gap-3">
          {stats?.unlocked
            ? <Unlock className="w-6 h-6 text-green-400" />
            : <Lock className="w-6 h-6 text-red-400" />
          }
          <div>
            <p className="font-semibold text-white">
              App {stats?.unlocked ? "Khuli Hai ✅" : "Band Hai 🔒"}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats?.unlocked ? "Sab users use kar sakte hain" : "Sirf owner ke login se khulegi"}
            </p>
          </div>
        </div>
        {stats?.unlocked && (
          <button
            onClick={toggleApp}
            disabled={toggling}
            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-colors"
          >
            {toggling ? "..." : "🔒 Band Karo"}
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Users className="w-5 h-5 text-blue-400" />} label="Total Users" value={loading ? "..." : String(stats?.totalRegistered ?? 0)} color="blue" />
        <StatCard icon={<Activity className="w-5 h-5 text-green-400" />} label="Active Today" value={loading ? "..." : String(stats?.activeToday ?? 0)} color="green" />
        <StatCard icon={<Radio className="w-5 h-5 text-purple-400" />} label="Listeners" value={loading ? "..." : String(stats?.totalListeners ?? 0)} color="purple" />
      </div>

      {/* Recent Users */}
      <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-foreground text-sm">Haale Users</span>
        </div>
        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
        ) : !stats?.recentUsers?.length ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Abhi koi user nahi hai</div>
        ) : (
          <ul className="divide-y divide-border">
            {stats.recentUsers.map((u) => (
              <li key={u.telegramId} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {(u.firstName?.[0] ?? u.username?.[0] ?? "U").toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {u.firstName ?? u.username ?? "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {u.username ? `@${u.username} · ` : ""}#{u.telegramId}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">{fmt(u.lastLogin)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full py-3 rounded-2xl bg-destructive/20 text-destructive hover:bg-destructive/30 font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        {loggingOut ? "Logging out..." : "Owner Logout (App Band Ho Jaayegi)"}
      </button>
    </div>
  );
}

// ── Route component ──────────────────────────────────────────────────────────
export default function OwnerPanel() {
  // Always start unverified — localStorage manipulation se bypass impossible
  const [verified, setVerified] = useState(false);

  // If owner was already logged in from this session, skip verify gate
  if (!verified) {
    return <OwnerVerifyGate onVerified={() => setVerified(true)} />;
  }
  return <PanelContent />;
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const bg: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/20",
    green: "bg-green-500/10 border-green-500/20",
    purple: "bg-purple-500/10 border-purple-500/20",
  };
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${bg[color] ?? "bg-muted/30 border-border"}`}>
      {icon}
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}
