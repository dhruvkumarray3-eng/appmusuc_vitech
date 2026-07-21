import { useState, useEffect } from "react";
import { useSearchMusic, getSearchMusicQueryKey, useAddFavorite, useAddToPlaylist, useGetFavorites, getGetFavoritesQueryKey } from "@workspace/api-client-react";
import { usePlayer } from "@/lib/player-context";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mic, Play, Plus, Heart, ListPlus, Tv2 } from "lucide-react";
import { DownloadMenu } from "@/components/DownloadMenu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "lyrics" | "queue">("results");

  const { playSong, addToQueue, currentSong, queue, openVideo } = usePlayer();
  const { telegramId } = useAuth();
  const queryClient = useQueryClient();

  const { data: searchResults, isLoading: isSearchLoading } = useSearchMusic(
    { q: searchQuery },
    {
      query: {
        enabled: !!searchQuery && isSearching,
        queryKey: getSearchMusicQueryKey({ q: searchQuery })
      }
    }
  );

  const { data: favoritesData } = useGetFavorites(telegramId || "", {
    query: {
      enabled: !!telegramId,
      queryKey: getGetFavoritesQueryKey(telegramId || "")
    }
  });

  const addFavorite = useAddFavorite();
  const addToPlaylistAPI = useAddToPlaylist();

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      setActiveTab("results");
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsSearching(true);
      };
      recognition.start();
    } else {
      alert("Voice search is not supported in this browser.");
    }
  };

  const handleAddFavorite = (songId: string) => {
    if (!telegramId) return;
    addFavorite.mutate({ data: { telegramId, songId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey(telegramId) });
      }
    });
  };

  const handleAddToPlaylist = (song: any) => {
    if (!telegramId) return;
    addToPlaylistAPI.mutate({ 
      data: { 
        telegramId, 
        song: { id: song.id, title: song.title, thumbnail: song.thumbnail } 
      } 
    });
  };

  useEffect(() => {
    if (currentSong) {
      setIsLoadingLyrics(true);
      setLyrics(null);
      fetch(`https://api.lyrics.ovh/v1/various/${encodeURIComponent(currentSong.title)}`)
        .then(res => res.json())
        .then(data => {
          if (data.lyrics) {
            setLyrics(data.lyrics);
          } else {
            setLyrics("Lyrics not found. Instrumental or unlisted track.");
          }
        })
        .catch(() => {
          setLyrics("Could not fetch lyrics.");
        })
        .finally(() => {
          setIsLoadingLyrics(false);
        });
    }
  }, [currentSong]);

  const favoritesList = favoritesData?.favorites || [];

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Background flare */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4 md:px-8 flex flex-col gap-4">
        <form onSubmit={handleSearch} className="relative flex items-center max-w-2xl w-full mx-auto">
          <Search className="absolute left-4 w-5 h-5 text-primary" />
          <Input 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearching(false);
            }}
            placeholder="Search tracks, artists..."
            className="pl-12 pr-12 h-14 bg-card/80 border-border/50 rounded-2xl text-base shadow-sm focus-visible:ring-primary focus-visible:border-primary glow-box transition-all"
            data-testid="input-search"
          />
          <button
            type="button"
            onClick={handleVoiceSearch}
            className="absolute right-4 p-2 text-muted-foreground hover:text-primary transition-colors bg-background/50 rounded-full hover:bg-primary/10"
            title="Voice Search"
          >
            <Mic className="w-5 h-5" />
          </button>
        </form>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-8 border-b border-border/50 max-w-2xl w-full mx-auto pb-[-1px] mt-2">
          <button 
            className={`pb-3 px-2 text-sm font-semibold tracking-wide uppercase transition-colors relative ${activeTab === 'results' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab("results")}
          >
            Search
            {activeTab === 'results' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary glow-box" />}
          </button>
          <button 
            className={`pb-3 px-2 text-sm font-semibold tracking-wide uppercase transition-colors relative ${activeTab === 'lyrics' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab("lyrics")}
          >
            Lyrics
            {activeTab === 'lyrics' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary glow-box" />}
          </button>
          <button 
            className={`pb-3 px-2 text-sm font-semibold tracking-wide uppercase transition-colors relative ${activeTab === 'queue' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab("queue")}
          >
            Queue <span className="ml-1 opacity-70">({queue.length})</span>
            {activeTab === 'queue' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary glow-box" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto pb-24 md:pb-32">
          
          {/* Results Tab */}
          {activeTab === 'results' && (
            <div className="space-y-4">
              {isSearchLoading && (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-4 p-3 border border-border/50 rounded-xl bg-card/20">
                      <Skeleton className="w-14 h-14 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isSearchLoading && searchResults?.items && searchResults.items.length > 0 && (
                <div className="grid gap-3">
                  {searchResults.items.map((song) => {
                    const isFavorited = favoritesList.includes(song.id);
                    return (
                      <div 
                        key={song.id}
                        className="group flex items-center gap-4 p-3 rounded-xl bg-card/40 hover:bg-card border border-border/30 hover:border-primary/30 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(153,51,255,0.1)]"
                      >
                        <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={song.thumbnail} 
                            alt={song.title} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <button 
                            onClick={() => playSong(song)}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                          >
                            <Play className="w-6 h-6 text-white fill-current ml-1" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-base font-semibold text-foreground truncate">{song.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{song.channelTitle || "YouTube"}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-9 w-9 rounded-full ${isFavorited ? 'text-secondary bg-secondary/10' : 'text-muted-foreground hover:text-secondary hover:bg-secondary/10'}`}
                            onClick={() => handleAddFavorite(song.id)}
                            title={isFavorited ? "Favorited" : "Add to favorites"}
                          >
                            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-full text-muted-foreground hover:text-accent hover:bg-accent/10"
                            onClick={() => handleAddToPlaylist(song)}
                            title="Add to playlist"
                          >
                            <ListPlus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => { playSong(song); openVideo(); }}
                            title="Watch video (1080p)"
                          >
                            <Tv2 className="w-4 h-4" />
                          </Button>
                          <DownloadMenu
                            songId={song.id}
                            songTitle={song.title}
                            triggerClass="h-9 w-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-green-400 hover:bg-green-400/10 transition-colors"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => addToQueue(song)}
                            title="Add to queue"
                          >
                            <Plus className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isSearchLoading && isSearching && searchResults?.items?.length === 0 && (
                <div className="text-center py-24 bg-card/20 rounded-2xl border border-border/50">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                    <Search className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">No matches found</h3>
                  <p className="text-sm text-muted-foreground mt-1">Try searching for something else.</p>
                </div>
              )}

              {!isSearching && !searchResults && (
                <div className="text-center py-24 bg-card/10 rounded-3xl border border-dashed border-border/50">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 glow-box">
                    <Mic className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground glow-text">Set the vibe</h3>
                  <p className="text-base text-muted-foreground mt-2 max-w-sm mx-auto">Search for tracks, artists, or mixes to start playing.</p>
                </div>
              )}
            </div>
          )}

          {/* Lyrics Tab */}
          {activeTab === 'lyrics' && (
            <div className="bg-card/40 border border-border/50 rounded-3xl p-6 md:p-10 min-h-[400px] shadow-lg backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
              
              {isLoadingLyrics ? (
                <div className="space-y-5 relative z-10">
                  <Skeleton className="h-8 w-1/3 mb-10" />
                  <Skeleton className="h-5 w-full bg-muted/50" />
                  <Skeleton className="h-5 w-5/6 bg-muted/50" />
                  <Skeleton className="h-5 w-4/6 bg-muted/50" />
                  <Skeleton className="h-5 w-full bg-muted/50" />
                  <Skeleton className="h-5 w-3/4 bg-muted/50" />
                </div>
              ) : currentSong ? (
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-foreground mb-8 pb-4 border-b border-border/30 inline-block">{currentSong.title}</h2>
                  <div className="whitespace-pre-wrap text-muted-foreground text-lg md:text-xl leading-relaxed font-sans font-medium">
                    {lyrics}
                  </div>
                </div>
              ) : (
                <div className="text-center py-24 text-muted-foreground flex flex-col items-center relative z-10">
                  <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                    <Mic className="w-8 h-8 opacity-40" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground">No track playing</h3>
                  <p className="mt-2">Play a track to view its lyrics here.</p>
                </div>
              )}
            </div>
          )}

          {/* Queue Tab */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              {queue.length === 0 ? (
                <div className="text-center py-24 bg-card/20 rounded-2xl border border-border/50">
                  <ListPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium text-foreground">Queue is empty</h3>
                  <p className="text-sm text-muted-foreground mt-1">Add tracks from search or your playlists.</p>
                </div>
              ) : (
                <div className="grid gap-3 bg-card/20 p-4 rounded-3xl border border-border/30">
                  <h3 className="text-sm font-bold text-primary mb-2 px-2 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Next Up
                  </h3>
                  {queue.map((song, idx) => (
                    <div 
                      key={`${song.id}-${idx}`}
                      className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50 shadow-sm"
                    >
                      <div className="text-muted-foreground w-6 text-center font-mono text-sm opacity-50">
                        {idx + 1}
                      </div>
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                        <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-foreground truncate">{song.title}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0">
                        {/* Optionally add remove from queue logic here */}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
