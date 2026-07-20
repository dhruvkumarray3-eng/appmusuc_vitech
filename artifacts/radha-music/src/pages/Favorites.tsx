import { useAuth } from "@/lib/auth-context";
import { useGetFavorites, useRemoveFavorite, getGetFavoritesQueryKey } from "@workspace/api-client-react";
import { usePlayer } from "@/lib/player-context";
import { Play, Heart, HeartOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export default function Favorites() {
  const { telegramId } = useAuth();
  const { playSong } = usePlayer();
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetFavorites(telegramId || "", {
    query: {
      enabled: !!telegramId,
      queryKey: getGetFavoritesQueryKey(telegramId || "")
    }
  });

  const removeFavorite = useRemoveFavorite();

  const handleRemove = (songId: string) => {
    if (!telegramId) return;
    removeFavorite.mutate({
      data: { telegramId, songId }
    }, {
      onSuccess: () => {
        // Optimistic update would be better, but invalidation works
        queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey(telegramId) });
      }
    });
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8 border-b border-border/50 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary glow-box">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground glow-text">Favorites</h1>
            <p className="text-muted-foreground mt-1">Your saved tracks</p>
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
        ) : !data?.favorites || data.favorites.length === 0 ? (
          <div className="text-center py-20 bg-card/20 rounded-2xl border border-border/50">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No favorites yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Heart tracks while playing to add them here.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {data.favorites.map((songId) => (
              <div 
                key={songId}
                className="group flex items-center gap-4 p-3 rounded-xl bg-card/30 hover:bg-muted/50 border border-transparent hover:border-border transition-all"
              >
                <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-muted">
                  <img 
                    src={`https://i.ytimg.com/vi/${songId}/mqdefault.jpg`} 
                    alt="Thumbnail" 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={() => playSong({ id: songId, title: `Track ${songId}` })}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="w-5 h-5 text-white fill-current ml-1" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">Track ID: {songId}</p>
                </div>
                <div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(songId)}
                    className="text-secondary hover:text-destructive hover:bg-destructive/10"
                    title="Remove from favorites"
                  >
                    <HeartOff className="w-5 h-5" />
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
