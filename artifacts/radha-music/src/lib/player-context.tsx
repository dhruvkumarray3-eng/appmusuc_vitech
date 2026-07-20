import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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

  const { telegramId } = useAuth();
  const addHistory = useAddHistory();

  const openVideo = () => { if (currentSong) setIsVideoOpen(true); };
  const closeVideo = () => setIsVideoOpen(false);

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    
    // Add to history
    if (telegramId) {
      addHistory.mutate({
        data: {
          telegramId,
          song: {
            id: song.id,
            title: song.title,
            thumbnail: song.thumbnail
          }
        }
      });
    }
  };

  const togglePlayPause = () => {
    if (currentSong) {
      setIsPlaying(!isPlaying);
    }
  };

  const addToQueue = (song: Song) => {
    setQueue((prev) => [...prev, song]);
  };

  const playNext = () => {
    if (queue.length > 0) {
      const nextSong = queue[0];
      setQueue((prev) => prev.slice(1));
      playSong(nextSong);
    }
  };

  const playPrevious = () => {
    // Basic implementation: just restarts current song if no real previous stack
    if (currentSong) {
      setIsPlaying(false);
      setTimeout(() => setIsPlaying(true), 100);
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
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
