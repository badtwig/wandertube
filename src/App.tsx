import React, { useState, useEffect, useCallback } from 'react';
import { VIDEO_DATABASE, VideoItem } from './data/videos';
import { TopBar } from './components/TopBar';
import { VideoPlayer } from './components/VideoPlayer';
import { VideoMetadataCard } from './components/VideoMetadataCard';
import { soundEffects } from './utils/audio';
import { ShuffleDeckEngine, DeckStats } from './utils/deck';

export default function App() {
  // State for deck tracking across sessions and days
  const [deckStats, setDeckStats] = useState<DeckStats>(() => ShuffleDeckEngine.getStats());

  const [currentVideo, setCurrentVideo] = useState<VideoItem>(() => {
    // If a specific video ID is provided in URL, load it
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlVideoId = params.get('v');
      if (urlVideoId) {
        const found = VIDEO_DATABASE.find(v => v.id === urlVideoId);
        if (found) return found;
      }
    }
    // Otherwise draw from the persistent non-repeating shuffle deck!
    const { video } = ShuffleDeckEngine.getOrDrawInitialVideo();
    return video;
  });

  const [isRolling, setIsRolling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [savedGems, setSavedGems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('notforyoutube_gems') || localStorage.getItem('wander_gems');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync deck stats after initial render
  useEffect(() => {
    setDeckStats(ShuffleDeckEngine.getStats());
  }, []);

  const handleToggleBookmark = () => {
    setSavedGems((prev) => {
      const next = prev.includes(currentVideo.id)
        ? prev.filter((i) => i !== currentVideo.id)
        : [...prev, currentVideo.id];
      try {
        localStorage.setItem('notforyoutube_gems', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    soundEffects.playClick();
  };

  // Roll to another completely random, GUARANTEED non-repeating YouTube video
  const handleRollNext = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);
    soundEffects.playDiceRoll();

    setTimeout(() => {
      // Draw from persistent unplayed shuffle deck
      const { video: nextVideo, stats } = ShuffleDeckEngine.drawNextVideo(currentVideo.id);

      setCurrentVideo(nextVideo);
      setDeckStats(stats);
      setIsRolling(false);
      soundEffects.playDiscoverChime();

      if (window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }, 220);
  }, [isRolling, currentVideo.id]);

  // Handle manual reshuffle of the deck
  const handleResetDeck = () => {
    const stats = ShuffleDeckEngine.resetDeck();
    setDeckStats(stats);
    soundEffects.playClick();
    handleRollNext();
  };

  // Keyboard shortcut: Spacebar and 'R' / 'N' to randomize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space' || e.key === 'r' || e.key === 'R' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleRollNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRollNext]);

  const isCurrentBookmarked = savedGems.includes(currentVideo.id);

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-200 flex flex-col selection:bg-red-600 selection:text-white">
      {/* Minimal Header */}
      <TopBar
        isMuted={isMuted}
        onToggleMute={() => {
          setIsMuted(prev => {
            soundEffects.isMuted = !prev;
            return !prev;
          });
        }}
      />

      {/* Main Single-View Experience */}
      <main className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-5xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Responsive Video Theater Player with Play/Pause, Volume, Randomize & Fullscreen */}
        <VideoPlayer
          video={currentVideo}
          isBookmarked={isCurrentBookmarked}
          onToggleBookmark={handleToggleBookmark}
          onRollNext={handleRollNext}
          isRolling={isRolling}
        />

        {/* Video Details: Views, Popularity, Topic, Channel, Release Date, and Deck Progress */}
        <VideoMetadataCard
          video={currentVideo}
          deckStats={deckStats}
          onResetDeck={handleResetDeck}
        />
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-4">
          <span className="font-semibold text-slate-300">NotForYoutube</span>
          <span className="text-slate-400">
            Pure random discovery engine • {VIDEO_DATABASE.length} verified specimens
          </span>
        </div>
      </footer>
    </div>
  );
}
