import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useGetHistory } from "@workspace/api-client-react";
import { useGetFavorites } from "@workspace/api-client-react";
import { useGetPlaylist } from "@workspace/api-client-react";
import { User, History, Heart, ListMusic, LogOut, Camera, Check, X, Pencil } from "lucide-react";

// Compress image to max 200×200 JPEG and return as base64 data URL
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 200;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function UserProfile() {
  const { telegramId, isOwner, profileName, profilePhoto, updateProfile, userLogout, ownerLogout } = useAuth();
  const [, navigate] = useLocation();

  const { data: histData } = useGetHistory(telegramId ?? "", { query: { enabled: !!telegramId } });
  const { data: favData } = useGetFavorites(telegramId ?? "", { query: { enabled: !!telegramId } });
  const { data: plData } = useGetPlaylist(telegramId ?? "", { query: { enabled: !!telegramId } });

  const historyCount = histData?.history?.length ?? 0;
  const favCount = favData?.favorites?.length ?? 0;
  const playlistCount = plData?.playlist?.length ?? 0;

  // Edit state
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftPhoto, setDraftPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraftName(profileName ?? "");
    setDraftPhoto(profilePhoto ?? null);
    setSaveMsg("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraftPhoto(null);
    setSaveMsg("");
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setDraftPhoto(compressed);
    } catch {
      setSaveMsg("❌ Photo load nahi hui");
    }
  };

  const saveProfile = async () => {
    if (!telegramId) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await updateProfile(draftName.trim(), draftPhoto);
      setSaveMsg("✅ Profile save ho gayi!");
      setTimeout(() => { setEditing(false); setSaveMsg(""); }, 1200);
    } catch {
      setSaveMsg("❌ Save nahi hua, dobara try karo");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (isOwner && telegramId) await ownerLogout(telegramId);
    else userLogout();
    navigate("/");
  };

  const displayName = profileName || (isOwner ? "Owner" : "User");
  const avatarLetter = (displayName[0] ?? "U").toUpperCase();
  const currentPhoto = editing ? draftPhoto : profilePhoto;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-6 pb-32 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Profile</h1>
            <p className="text-xs text-muted-foreground">Tera account</p>
          </div>
        </div>
        {!editing && telegramId && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 text-sm font-medium transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>

      {/* Avatar + name card */}
      <div className="rounded-2xl border border-border bg-card/50 p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
              {currentPhoto
                ? <img src={currentPhoto} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-primary">{avatarLetter}</span>
              }
            </div>
            {editing && (
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          {/* Name / edit */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Apna naam daalo"
                maxLength={40}
                className="w-full px-3 py-2 rounded-lg bg-background/60 border border-primary/40 text-white text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                autoFocus
              />
            ) : (
              <p className="text-lg font-bold text-white truncate">{displayName}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {telegramId ? <>Telegram ID: <span className="font-mono text-foreground">{telegramId}</span></> : "Guest user"}
            </p>
            {isOwner && (
              <span className="inline-block mt-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded-full px-2 py-0.5">
                OWNER
              </span>
            )}
          </div>
        </div>

        {/* Save / cancel buttons */}
        {editing && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="flex-1 py-2 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={cancelEdit}
              disabled={saving}
              className="flex-1 py-2 rounded-xl bg-muted text-foreground font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-muted/80 transition-colors"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        )}
        {saveMsg && <p className="text-sm text-center mt-3">{saveMsg}</p>}
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
          <p>Telegram Mini App se open karo to profile edit karo aur stats dekho 🎵</p>
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
