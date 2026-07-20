import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useGetHistory } from "@workspace/api-client-react";
import { useGetFavorites } from "@workspace/api-client-react";
import { useGetPlaylist } from "@workspace/api-client-react";
import { User, History, Heart, ListMusic, LogOut, Disc3 } from "lucide-react";

export default function UserProfile() {
  const { telegramId, isOwner, userLogout, ownerLogout } = useAuth();
  const [, navigate] = useLocation();

  const { data: histData } = useGetHistory(telegramId ?? "", { query: { enabled: !!telegramId } });
  const { data: favData } = useGetFavorites(telegramId ?? "", { query: { enabled: !!telegramId } });
  const { data: plData } = useGetPlaylist(telegramId ?? "", { query: { enabled: !!telegramId } });

  const historyCount = histData?.history?.length ?? 0;
  const favCount = favData?.favorites?.length ?? 0;
  const playlistCount = plData?.playlist?.length ?? 0;

  const handleLogout = async () => {
    if (isOwner && telegramId) {
      await ownerLogout(telegramId);
    } else {
      userLogout();
    }
    navigate("/");
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-6 pb-32 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Profile</h1>
          <p className="text-xs text-muted-foreground">Tera account</p>
        </div>
      </div>

      {/* User Card */}
      <div className="rounded-2xl border border-border bg-card/50 p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0 relative">
          <Disc3 className="w-8 h-8 text-primary animate-spin" style={{ animationDuration: "4s" }} />
          {isOwner && (
            <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none">
              OWNER
            </span>
          )}
        </div>
        <div>
          <p className="text-lg font-bold text-white">{isOwner ? "Owner" : "User"}</p>
          {telegramId ? (
            <p className="text-sm text-muted-foreground">Telegram ID: <span className="text-foreground font-mono">{telegramId}</span></p>
          ) : (
            <p className="text-sm text-muted-foreground">Guest user (koi ID nahi)</p>
          )}
        </div>
      </div>

      {/* Stats */}
      {telegramId ? (
        <div className="grid grid-cols-3 gap-3">
          <ProfileStat icon={<History className="w-5 h-5 text-blue-400" />} label="History" value={historyCount} />
          <ProfileStat icon={<Heart className="w-5 h-5 text-rose-400" />} label="Favorites" value={favCount} />
          <ProfileStat icon={<ListMusic className="w-5 h-5 text-purple-400" />} label="Playlist" value={playlistCount} />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-muted/20 p-5 text-center text-muted-foreground text-sm">
          <p>Telegram Mini App se open karo to apna history, favorites aur playlist dikhega 🎵</p>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-2xl bg-destructive/20 text-destructive hover:bg-destructive/30 font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        {isOwner ? "Owner Logout (App Band Ho Jaayegi)" : "Logout"}
      </button>
    </div>
  );
}

function ProfileStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4 flex flex-col gap-2">
      {icon}
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
