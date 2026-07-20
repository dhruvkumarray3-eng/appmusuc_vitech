import { useEffect, useState, useRef } from "react";
import { usePlayer } from "@/lib/player-context";
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, RefreshCw } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export function BottomPlayer() {
  const { currentSong, isPlaying, togglePlayPause, playNext, playPrevious } = usePlayer();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [volume, setVolume] = useState(100);

  // When song changes or play state changes, we might want to control iframe via postMessage 
  // if we used the YouTube Iframe API. For simplicity, we just autoplay when src changes.

  if (!currentSong) return null;

  const videoSrc = `https://www.youtube.com/embed/${currentSong.id}?autoplay=${isPlaying ? 1 : 0}&controls=0&disablekb=1&fs=0&modestbranding=1&enablejsapi=1`;

  return (
    <div className="fixed bottom-0 md:bottom-0 left-0 right-0 h-24 bg-card/90 backdrop-blur-2xl border-t border-border z-50 flex items-center px-4 md:px-8 pb-safe-md md:pb-0 gap-4 mb-16 md:mb-0">
      
      {/* Hidden iframe for actual playback */}
      <div className="hidden">
        <iframe
          ref={iframeRef}
          src={videoSrc}
          allow="autoplay; encrypted-media"
          title="youtube player"
        />
      </div>

      {/* Song Info */}
      <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
        <div className="relative w-14 h-14 rounded-md overflow-hidden shrink-0 glow-box">
          <img 
            src={currentSong.thumbnail || `https://i.ytimg.com/vi/${currentSong.id}/mqdefault.jpg`} 
            alt={currentSong.title}
            className="w-full h-full object-cover"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
              <div className="flex items-end justify-center gap-1 h-4">
                <span className="w-1 bg-white animate-[bounce_1s_infinite] h-full"></span>
                <span className="w-1 bg-white animate-[bounce_0.8s_infinite] h-2/3"></span>
                <span className="w-1 bg-white animate-[bounce_1.2s_infinite] h-full"></span>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-semibold text-foreground truncate">{currentSong.title}</span>
          <span className="text-xs text-muted-foreground truncate">{currentSong.channelTitle || "YouTube"}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-6">
          <button className="text-muted-foreground hover:text-primary transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={playPrevious}
            className="text-foreground hover:text-primary transition-colors"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button 
            onClick={togglePlayPause}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform glow-box"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
          </button>
          <button 
            onClick={playNext}
            className="text-foreground hover:text-primary transition-colors"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button className="text-muted-foreground hover:text-primary transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Volume / Extra */}
      <div className="w-1/4 min-w-[150px] hidden md:flex items-center justify-end gap-3">
        <Volume2 className="w-4 h-4 text-muted-foreground" />
        <div className="w-24">
          <Slider 
            value={[volume]} 
            max={100} 
            step={1}
            onValueChange={(vals) => setVolume(vals[0])}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
