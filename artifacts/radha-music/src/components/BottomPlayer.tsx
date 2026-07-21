import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/lib/player-context";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Maximize2, Minimize2, Download } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export function BottomPlayer() {
  const { currentSong, isPlaying, togglePlayPause, playNext, playPrevious, isVideoOpen, openVideo, closeVideo } = usePlayer();
  const audioIframeRef = useRef<HTMLIFrameElement>(null);
  const videoIframeRef = useRef<HTMLIFrameElement>(null);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // YouTube postMessage helper
  const ytCommand = (iframeRef: React.RefObject<HTMLIFrameElement | null>, func: string, args: any[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*"
    );
  };

  // Sync play/pause to hidden audio iframe (only when video is NOT open)
  useEffect(() => {
    if (!currentSong) return;
    if (isVideoOpen) return; // video iframe handles playback, audio iframe stays silent
    ytCommand(audioIframeRef, isPlaying ? "playVideo" : "pauseVideo");
  }, [isPlaying, currentSong, isVideoOpen]);

  // When video opens → mute audio first (80ms delay), then show video to prevent double sound
  useEffect(() => {
    if (!currentSong) return;
    if (isVideoOpen) {
      setVideoReady(false);
      // Immediately mute + pause audio iframe
      ytCommand(audioIframeRef, "setVolume", [0]);
      ytCommand(audioIframeRef, "pauseVideo");
      // Show video only after audio is silenced (prevents double sound)
      const t = setTimeout(() => setVideoReady(true), 80);
      return () => clearTimeout(t);
    } else {
      setVideoReady(false);
      // Restore audio iframe volume and resume if playing
      ytCommand(audioIframeRef, "setVolume", [isMuted ? 0 : volume]);
      if (isPlaying) ytCommand(audioIframeRef, "playVideo");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideoOpen, currentSong]);

  // Sync volume to audio iframe (when video not open) or video iframe (when open)
  useEffect(() => {
    const v = isMuted ? 0 : volume;
    if (isVideoOpen) {
      ytCommand(videoIframeRef, "setVolume", [v]);
    } else {
      ytCommand(audioIframeRef, "setVolume", [v]);
    }
  }, [volume, isMuted, isVideoOpen]);

  const handleDownload = () => {
    if (!currentSong) return;
    window.open(
      `https://cobalt.tools/?url=${encodeURIComponent(`https://youtube.com/watch?v=${currentSong.id}`)}`,
      "_blank"
    );
  };

  if (!currentSong) return null;

  // Audio iframe src — autoplay=1, controls=0, hidden
  const audioSrc = `https://www.youtube.com/embed/${currentSong.id}?autoplay=1&controls=0&disablekb=1&fs=0&modestbranding=1&enablejsapi=1&rel=0&playsinline=1`;

  // Video iframe src — autoplay=1, controls=1, hd1080
  const videoSrc = `https://www.youtube.com/embed/${currentSong.id}?autoplay=1&controls=1&vq=hd1080&modestbranding=1&enablejsapi=1&rel=0&playsinline=1&iv_load_policy=3`;

  const effectiveVolume = isMuted ? 0 : volume;

  return (
    <>
      {/* ── Hidden audio iframe (always in DOM so playback doesn't restart) ── */}
      <iframe
        ref={audioIframeRef}
        key={`audio-${currentSong.id}`}
        src={audioSrc}
        allow="autoplay; encrypted-media"
        title="audio-player"
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* ── Full-screen video overlay (shown only after audio is muted) ── */}
      {isVideoOpen && videoReady && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/90 to-transparent absolute top-0 left-0 right-0 z-[202] pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3 min-w-0">
              <button
                onClick={closeVideo}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{currentSong.title}</p>
                <p className="text-white/60 text-xs truncate">{currentSong.channelTitle || "YouTube"}</p>
              </div>
            </div>
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={handleDownload}
                title="Download"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={closeVideo}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Video iframe */}
          <iframe
            ref={videoIframeRef}
            key={`video-${currentSong.id}`}
            src={videoSrc}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title="video-player"
            className="w-full h-full"
          />
        </div>
      )}

      {/* ── Bottom player bar ── */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-card/90 backdrop-blur-2xl border-t border-border z-50 flex items-center px-4 md:px-8 pb-safe-md md:pb-0 gap-4 mb-16 md:mb-0">

        {/* Song Info */}
        <div className="flex items-center gap-4 w-1/4 min-w-[160px]">
          <div className="relative w-14 h-14 rounded-md overflow-hidden shrink-0 glow-box">
            <img
              src={currentSong.thumbnail || `https://i.ytimg.com/vi/${currentSong.id}/mqdefault.jpg`}
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="flex items-end justify-center gap-1 h-4">
                  <span className="w-1 bg-white animate-[bounce_1s_infinite] h-full" />
                  <span className="w-1 bg-white animate-[bounce_0.8s_infinite] h-2/3" />
                  <span className="w-1 bg-white animate-[bounce_1.2s_infinite] h-full" />
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
        <div className="flex-1 flex items-center justify-center gap-4 md:gap-6">
          <button onClick={playPrevious} className="text-foreground hover:text-primary transition-colors">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button
            onClick={togglePlayPause}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform glow-box"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
          </button>
          <button onClick={playNext} className="text-foreground hover:text-primary transition-colors">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          {/* Video toggle */}
          <button
            onClick={isVideoOpen ? closeVideo : openVideo}
            title={isVideoOpen ? "Close video" : "Watch video (1080p)"}
            className={`transition-colors ${isVideoOpen ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
          >
            {isVideoOpen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {/* Download */}
          <button
            onClick={handleDownload}
            title="Download song"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Volume */}
        <div className="w-1/4 min-w-[140px] hidden md:flex items-center justify-end gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            {isMuted || effectiveVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="w-24">
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={(vals) => {
                setVolume(vals[0]);
                setIsMuted(vals[0] === 0);
              }}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </>
  );
}
