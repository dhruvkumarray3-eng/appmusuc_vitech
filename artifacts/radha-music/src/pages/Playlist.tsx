import { useAuth } from "@/lib/auth-context";
import { useGetPlaylist, getGetPlaylistQueryKey } from "@workspace/api-client-react";
import { usePlayer } from "@/lib/player-context";
import { Play, ListMusic, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Playlist() {
  const { telegramId } = useAuth();
  const { playSong, addToQueue } = usePlayer();

  const { data, isLoading } = useGetPlaylist(telegramId || "", {
    query: {
      enabled: !!telegramId,
      queryKey: getGetPlaylistQueryKey(telegramId || "")
    }
  });

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8 border-b border-border/50 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent glow-box">
            <ListMusic className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground glow-text">My Playlist</h1>
            <p className="text-muted-foreground mt-1">Your custom collection</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 p-3 border border-border/50 rounded-xl">
                <Skeleton className="w-12 h-12 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.playlist || data.playlist.length === 0 ? (
          <div className="text-center py-20 bg-card/20 rounded-2xl border border-border/50">
            <ListMusic className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">Playlist is empty</h3>
            <p className="text-sm text-muted-foreground mt-1">Add tracks to your playlist while browsing.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {data.playlist.map((song, idx) => (
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
                <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => addToQueue(song)}
                    className="text-muted-foreground hover:text-primary"
                    title="Add to queue"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
