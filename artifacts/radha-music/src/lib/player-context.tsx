import { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { useAddHistory } from '@workspace/api-client-react';
import { useAuth } from './auth-context';

export interface Song {
  id: string;
  title: string;
  thumbnail?: string;
  channelTitle?: string;
}

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song) => void;
  togglePlayPause: () => void;
  queue: Song[];
  addToQueue: (song: Song) => void;
  playNext: () => void;
  playPrevious: () => void;
  isVideoOpen: boolean;
  openVideo: () => void;
  closeVideo: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Keep a history stack so SkipBack actually goes to the previous song
  const historyRef = useRef<Song[]>([]);

  const { telegramId } = useAuth();
  const addHistory = useAddHistory();

  const openVideo = () => { if (currentSong) setIsVideoOpen(true); };
  const closeVideo = () => setIsVideoOpen(false);

  const playSong = (song: Song) => {
    // Push current song onto history before switching
    setCurrentSong((prev) => {
      if (prev && prev.id !== song.id) {
        historyRef.current = [...historyRef.current.slice(-49), prev]; // keep last 50
      }
      return song;
    });
    setIsPlaying(true);

    // Save to play history in DB
    if (telegramId) {
      addHistory.mutate({
        data: {
          telegramId,
          song: { id: song.id, title: song.title, thumbnail: song.thumbnail },
        },
      });
    }
  };

  const togglePlayPause = () => {
    if (currentSong) setIsPlaying((p) => !p);
  };

  const addToQueue = (song: Song) => {
    setQueue((prev) => [...prev, song]);
  };

  const playNext = () => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      playSong(next);
    }
  };

  const playPrevious = () => {
    const prev = historyRef.current.at(-1);
    if (prev) {
      historyRef.current = historyRef.current.slice(0, -1);
      // Directly set (don't push to history again)
      setCurrentSong(prev);
      setIsPlaying(true);
    } else if (currentSong) {
      // No history — restart current song by briefly toggling key via play state
      setIsPlaying(false);
      setTimeout(() => setIsPlaying(true), 50);
    }
  };

  return (
    <PlayerContext.Provider value={{
      currentSong,
      isPlaying,
      playSong,
      togglePlayPause,
      queue,
      addToQueue,
      playNext,
      playPrevious,
      isVideoOpen,
      openVideo,
      closeVideo,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
  return context;
}
