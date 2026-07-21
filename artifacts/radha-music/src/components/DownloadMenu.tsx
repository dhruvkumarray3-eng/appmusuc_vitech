import { useState } from "react";
import { Download, Music, Video, Loader2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Open URL properly inside Telegram Mini App or browser */
function openUrl(url: string) {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openLink) {
      tg.openLink(url, { try_instant_view: false });
      return;
    }
  } catch { /* ignore */ }
  window.open(url, "_blank", "noopener,noreferrer");
}

interface Props {
  songId: string;
  songTitle: string;
  /** Extra classes for the trigger button */
  triggerClass?: string;
}

export function DownloadMenu({ songId, songTitle, triggerClass = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"audio" | "video" | null>(null);

  const download = async (type: "audio" | "video") => {
    setLoading(type);
    try {
      const res = await fetch(`${BASE}/api/music/download?id=${encodeURIComponent(songId)}&type=${type}`);
      const data: { url: string; filename?: string; fallback?: boolean } = await res.json();
      if (data.url) openUrl(data.url);
    } catch {
      openUrl(`https://cobalt.tools/?url=${encodeURIComponent("https://youtube.com/watch?v=" + songId)}`);
    } finally {
      setLoading(null);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        title="Download"
        className={triggerClass}
      >
        <Download className="w-4 h-4" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setOpen(false)}
          />
          {/* Menu */}
          <div className="absolute bottom-full right-0 mb-2 z-[91] bg-card border border-border rounded-2xl shadow-2xl p-2 min-w-[170px] animate-in fade-in-0 zoom-in-95 duration-150">
            <p className="text-[10px] text-muted-foreground px-2 pb-1.5 border-b border-border mb-1.5 truncate max-w-[160px] uppercase tracking-wider">
              {songTitle}
            </p>
            <button
              onClick={() => download("audio")}
              disabled={!!loading}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-green-500/10 text-sm font-medium text-foreground transition-colors disabled:opacity-60"
            >
              {loading === "audio"
                ? <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                : <Music className="w-4 h-4 text-green-400" />
              }
              Audio — MP3
            </button>
            <button
              onClick={() => download("video")}
              disabled={!!loading}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-500/10 text-sm font-medium text-foreground transition-colors disabled:opacity-60"
            >
              {loading === "video"
                ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                : <Video className="w-4 h-4 text-blue-400" />
              }
              Video — 1080p
            </button>
          </div>
        </>
      )}
    </div>
  );
}
