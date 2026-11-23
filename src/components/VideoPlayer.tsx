import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  Bookmark,
  Check,
  Share2,
  Maximize,
  Minimize,
  AlertTriangle,
  FastForward,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Dices,
  X,
} from 'lucide-react';
import { VideoItem } from '../data/videos';

interface VideoPlayerProps {
  video: VideoItem;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onRollNext: () => void;
  isRolling: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  isBookmarked,
  onToggleBookmark,
  onRollNext,
  isRolling,
}) => {
  const [copied, setCopied] = useState(false);
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isPlayerMuted, setIsPlayerMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Reset error & player states whenever the video changes
  useEffect(() => {
    setEmbedError(null);
    setCountdown(null);
    setIsPlaying(true);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, [video.id]);

  // Handle postMessage commands to YouTube iframe
  const sendPlayerCommand = (func: string, args: any = '') => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      sendPlayerCommand('pauseVideo');
      setIsPlaying(false);
    } else {
      sendPlayerCommand('playVideo');
      setIsPlaying(true);
    }
  };

  const handleToggleMute = () => {
    if (isPlayerMuted) {
      sendPlayerCommand('unMute');
      setIsPlayerMuted(false);
    } else {
      sendPlayerCommand('mute');
      setIsPlayerMuted(true);
    }
  };

  // Fullscreen toggle: handles both Native Fullscreen API & Mobile CSS fixed overlay fallback
  const handleToggleFullscreen = async () => {
    if (!isFullscreen) {
      // 1. Attempt native browser fullscreen API if supported (Android, Desktop)
      try {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
      } catch {
        // Fallback silently to CSS Fullscreen (vital for iOS Safari which disallows div.requestFullscreen)
      }
      setIsFullscreen(true);
    } else {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement) {
          await (document as any).webkitExitFullscreen();
        }
      } catch {
        // ignore
      }
      setIsFullscreen(false);
    }
  };

  // Listen to native fullscreen changes (e.g. user pressing ESC key)
  useEffect(() => {
    const handleNativeFullscreenChange = () => {
      const isNativeFs = Boolean(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      );
      if (!isNativeFs && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleNativeFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleNativeFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleNativeFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleNativeFullscreenChange);
    };
  }, [isFullscreen]);

  // Listen for YouTube player state and error events via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event === 'onError') {
            handlePlayerError(parsed.info);
          } else if (parsed.event === 'infoDelivery' && parsed.info) {
            if (typeof parsed.info.playerState === 'number') {
              if (parsed.info.playerState === 1) setIsPlaying(true);
              if (parsed.info.playerState === 2) setIsPlaying(false);
              if (parsed.info.playerState === 0) {
                // Video ended, auto-roll to next random video
                onRollNext();
              }
            }
            if (typeof parsed.info.muted === 'boolean') {
              setIsPlayerMuted(parsed.info.muted);
            }
          }
        } catch {
          // not JSON
        }
      } else if (event.data && typeof event.data === 'object') {
        if (event.data.event === 'onError') {
          handlePlayerError(event.data.info);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRollNext]);

  const handlePlayerError = (code: number | string) => {
    let msg = 'This video has embedding restrictions or is blocked by YouTube.';
    if (code === 150 || code === 101) {
      msg = 'The creator or copyright owner has disabled playback on embedded websites.';
    } else if (code === 100) {
      msg = 'This video was not found or is set to private.';
    }

    setEmbedError(msg);
    setCountdown(4);

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    let remaining = 4;
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        onRollNext();
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?v=${video.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleManualSkip = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    onRollNext();
  };

  const embedUrl = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(
    origin
  )}&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`;

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-black flex flex-col justify-between p-0 sm:p-2 overflow-hidden'
          : 'relative max-w-5xl mx-auto'
      }`}
    >
      {/* Ambient Cinema Glow backdrop (standard mode only) */}
      {!isFullscreen && (
        <div
          className="absolute -inset-2 sm:-inset-8 rounded-3xl blur-2xl sm:blur-3xl opacity-25 pointer-events-none transition-colors duration-1000 -z-10 ambient-glow"
          style={{
            background: `radial-gradient(circle, ${video.colorTone} 0%, rgba(9,10,15,0) 70%)`,
          }}
        />
      )}

      {/* Fullscreen Top Overlay Header */}
      {isFullscreen && (
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-2 text-xs text-white/90 truncate mr-4">
            <span className="font-semibold truncate">{video.title}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/60 font-mono text-[11px]">{video.channel}</span>
          </div>
          <button
            onClick={handleToggleFullscreen}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all shrink-0"
            aria-label="Exit Fullscreen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Video Screen Container */}
      <div
        className={`relative bg-black border border-white/10 shadow-2xl shadow-black/80 flex flex-col ${
          isFullscreen
            ? 'w-full h-full rounded-0 border-0'
            : 'rounded-2xl sm:rounded-3xl overflow-hidden'
        }`}
      >
        {/* Video Frame */}
        <div
          className={`relative w-full bg-black ${
            isFullscreen ? 'flex-1 h-full' : 'pb-[56.25%]'
          }`}
        >
          <iframe
            ref={iframeRef}
            key={video.id}
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute top-0 left-0 w-full h-full border-0"
          />

          {/* Fallback Overlay if YouTube blocks embedding */}
          {embedError && (
            <div className="absolute inset-0 bg-[#090a0f]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center z-30">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2.5">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mb-1">Embedding Restricted</h3>
              <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
                {embedError}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <a
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white transition-all min-h-[44px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Watch on YouTube</span>
                </a>

                <button
                  onClick={handleManualSkip}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all min-h-[44px]"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>
                    {countdown !== null ? `Skip in ${countdown}s` : 'Skip Now'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Roll loading veil transition */}
          {isRolling && (
            <div className="absolute inset-0 bg-[#090a0f]/90 backdrop-blur-sm flex items-center justify-center z-20 transition-opacity">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs uppercase tracking-widest text-slate-400 font-mono">Rolling new video...</p>
              </div>
            </div>
          )}
        </div>

        {/* Unified Integrated Media Control Strip */}
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#11141c]/95 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Left Core Playback Group: Play/Pause, Volume, and the RANDOMIZE button right next to them! */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Play / Pause Button */}
            <button
              onClick={handleTogglePlay}
              className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-white transition-all"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause Video' : 'Play Video'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Volume / Mute Button */}
            <button
              onClick={handleToggleMute}
              className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-white transition-all"
              title={isPlayerMuted ? 'Unmute' : 'Mute'}
              aria-label={isPlayerMuted ? 'Unmute Video' : 'Mute Video'}
            >
              {isPlayerMuted ? (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              ) : (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
              )}
            </button>

            {/* Primary RANDOMIZE Button positioned directly next to Play/Pause and Volume */}
            <button
              onClick={onRollNext}
              disabled={isRolling}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 h-10 sm:h-11 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-semibold shadow-md shadow-red-950/50 transition-all disabled:opacity-60"
              title="Roll to a completely random video"
              aria-label="Randomize YouTube Video"
            >
              <Dices className={`w-4 h-4 sm:w-5 sm:h-5 ${isRolling ? 'animate-spin' : ''}`} />
              <span className="text-xs sm:text-sm font-bold tracking-tight">Randomize</span>
            </button>
          </div>

          {/* Right Action Group: Save Gem, Share, Watch on YouTube, and FULLSCREEN */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Bookmark / Save Gem */}
            <button
              onClick={onToggleBookmark}
              className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all active:scale-95 ${
                isBookmarked
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
              title={isBookmarked ? 'Saved to Gems' : 'Save discovery'}
              aria-label="Save Gem"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            {/* Share URL */}
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white transition-all"
              title="Copy share link"
              aria-label="Share Video"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Direct YouTube Link */}
            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xs:flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white transition-all"
              title="Watch on YouTube"
              aria-label="Watch on YouTube"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* FULLSCREEN Button - works reliably on Mobile (iOS Safari & Android) and Desktop */}
            <button
              onClick={handleToggleFullscreen}
              className="flex items-center gap-1 px-2.5 sm:px-3 h-10 sm:h-11 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-medium transition-all"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <>
                  <Minimize className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Exit</span>
                </>
              ) : (
                <>
                  <Maximize className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Full Screen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
