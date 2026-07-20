import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import {
  Shield, Users, Activity, Radio, Lock, Unlock,
  LogOut, RefreshCw, ChevronRight, Clock
} from "lucide-react";

interface Stats {
  unlocked: boolean;
  totalRegistered: number;
  activeToday: number;
  totalListeners: number;
  recentUsers: { telegramId: string; firstName: string | null; username: string | null; lastLogin: string }[];
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function OwnerPanel() {
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
      const endpoint = stats.unlocked ? "/api/auth/owner-logout" : "/api/auth/owner-login";
      // For unlock we'd need password — just toggle via logout for now
      if (stats.unlocked) {
        await fetch(`${BASE}${endpoint}`, {
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
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
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
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-400" />}
          label="Total Users"
          value={loading ? "..." : String(stats?.totalRegistered ?? 0)}
          color="blue"
        />
        <StatCard
          icon={<Activity className="w-5 h-5 text-green-400" />}
          label="Active Today"
          value={loading ? "..." : String(stats?.activeToday ?? 0)}
          color="green"
        />
        <StatCard
          icon={<Radio className="w-5 h-5 text-purple-400" />}
          label="Listeners"
          value={loading ? "..." : String(stats?.totalListeners ?? 0)}
          color="purple"
        />
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
                    <p className="text-xs text-muted-foreground">#{u.telegramId}</p>
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
