import { useAuth } from "@/lib/auth-context";
import { useGetHistory, getGetHistoryQueryKey } from "@workspace/api-client-react";
import { usePlayer } from "@/lib/player-context";
import { Play, History as HistoryIcon, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function History() {
  const { telegramId } = useAuth();
  const { playSong } = usePlayer();

  const { data, isLoading } = useGetHistory(telegramId || "", {
    query: {
      enabled: !!telegramId,
      queryKey: getGetHistoryQueryKey(telegramId || "")
    }
  });

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8 border-b border-border/50 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary glow-box">
            <HistoryIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground glow-text">Listening History</h1>
            <p className="text-muted-foreground mt-1">Tracks you've played recently</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 p-3 border border-border/50 rounded-xl">
                <Skeleton className="w-12 h-12 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.history || data.history.length === 0 ? (
          <div className="text-center py-20 bg-card/20 rounded-2xl border border-border/50">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No history yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Start playing tracks to build your history.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {data.history.map((song, idx) => (
              <div 
                key={`${song.id}-${idx}`}
                className="group flex items-center gap-4 p-3 rounded-xl bg-card/30 hover:bg-muted/50 border border-transparent hover:border-border transition-all"
              >
                <div className="text-muted-foreground w-6 text-right text-sm">
                  {idx + 1}
                </div>
                <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-muted">
                  <img 
                    src={song.thumbnail || `https://i.ytimg.com/vi/${song.id}/mqdefault.jpg`} 
                    alt={song.title} 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={() => playSong(song)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="w-5 h-5 text-white fill-current ml-1" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
