import { Heart, Search, ListMusic, History } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="z-10 bg-card/30 p-12 rounded-3xl border border-border/50 backdrop-blur-md max-w-md w-full">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 glow-box">
          <Search className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-white glow-text mb-4">404</h1>
        <h2 className="text-xl font-medium text-foreground mb-2">Track Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for seems to have dropped off the playlist.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <Link href="/" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-card border border-border hover:bg-muted transition-colors text-sm font-medium">
            <Search className="w-4 h-4 text-primary" /> Player
          </Link>
          <Link href="/playlist" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-card border border-border hover:bg-muted transition-colors text-sm font-medium">
            <ListMusic className="w-4 h-4 text-accent" /> Playlist
          </Link>
        </div>
      </div>
    </div>
  );
}
