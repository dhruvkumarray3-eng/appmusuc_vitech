import { useState } from "react";
import { Download, Music, Video, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Status = "idle" | "loading-audio" | "loading-video" | "sent" | "error";

interface Props {
  songId: string;
  songTitle: string;
  channelTitle?: string;
  triggerClass?: string;
}

export function DownloadMenu({ songId, songTitle, channelTitle = "YouTube", triggerClass = "" }: Props) {
  const { telegramId } = useAuth();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  const sendToTelegram = async (type: "audio" | "video") => {
    if (!telegramId) {
      setOpen(false);
      return;
    }
    setStatus(type === "audio" ? "loading-audio" : "loading-video");
    setOpen(false);

    try {
      await fetch(`${BASE}/api/music/send-to-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, videoId: songId, type, title: songTitle, channelTitle }),
      });
      setStatus("sent");
    } catch {
      setStatus("error");
    } finally {
      // Auto-reset after 4 seconds
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  // ── loading / feedback state ────────────────────────────────────────────────
  if (status === "loading-audio" || status === "loading-video") {
    return (
      <div className={`flex items-center justify-center ${triggerClass}`} title="Telegram pe bhej raha hun...">
        <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (status === "sent") {
    return (
      <div className={`flex items-center justify-center ${triggerClass}`} title="Telegram mein check karo!">
        <CheckCircle2 className="w-4 h-4 text-green-400" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`flex items-center justify-center ${triggerClass}`} title="Error aaya, dobara try karo">
        <XCircle className="w-4 h-4 text-red-400" />
      </div>
    );
  }

  // ── idle: show button + dropdown ───────────────────────────────────────────
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        title="Download via Telegram"
        className={triggerClass}
      >
        <Download className="w-4 h-4" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />

          {/* Dropdown menu */}
          <div className="absolute bottom-full right-0 mb-2 z-[91] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden min-w-[190px] animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-border bg-primary/5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Telegram pe bhejo</p>
              <p className="text-xs font-semibold text-foreground truncate max-w-[170px]">{songTitle}</p>
            </div>

            {!telegramId ? (
              <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                Telegram se login karo pehle
              </div>
            ) : (
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => sendToTelegram("audio")}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-green-500/10 text-sm font-medium text-foreground transition-colors"
                >
                  <Music className="w-4 h-4 text-green-400 shrink-0" />
                  <span>Audio — MP3</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">Bot bhejega</span>
                </button>
                <button
                  onClick={() => sendToTelegram("video")}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-500/10 text-sm font-medium text-foreground transition-colors"
                >
                  <Video className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Video — 480p</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">Bot bhejega</span>
                </button>
              </div>
            )}

            <div className="px-3 pb-2.5 pt-0">
              <p className="text-[9px] text-muted-foreground text-center">
                🤖 Bot tere Telegram mein seedha bhejega
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
