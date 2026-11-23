import React from 'react';
import { VideoItem } from '../data/videos';
import { DeckStats } from '../utils/deck';
import { Eye, Calendar, User, Compass, Sparkles } from 'lucide-react';

interface VideoMetadataCardProps {
  video: VideoItem;
  deckStats?: DeckStats;
  onResetDeck?: () => void;
}

export const VideoMetadataCard: React.FC<VideoMetadataCardProps> = ({ video, deckStats, onResetDeck }) => {
  const getTierProgress = (tier: VideoItem['viewTier']) => {
    switch (tier) {
      case 'obscure': return 15;
      case 'low': return 35;
      case 'medium': return 60;
      case 'popular': return 82;
      case 'viral': return 100;
      default: return 50;
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-4 sm:mt-6 bg-[#11141c]/90 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-7 backdrop-blur-md">
      {/* Primary Video Title */}
      <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-white text-balance leading-snug">
        {video.title}
      </h1>

      {/* 4 Prompt Dimensions as Clean Unboxed Metadata with Typographic Separators */}
      <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs sm:text-sm text-slate-400">
        <a
          href={video.channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-slate-200 hover:text-red-400 transition-colors flex items-center gap-1 min-h-[36px]"
        >
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>{video.channel}</span>
        </a>

        <span aria-hidden="true" className="text-slate-600">·</span>

        <span className="flex items-center gap-1 text-slate-300">
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span className="tabular-nums font-mono font-medium">{video.viewsDisplay}</span>
          <span>views</span>
        </span>

        <span aria-hidden="true" className="text-slate-600">·</span>

        <span className="flex items-center gap-1 text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{video.releaseYear}</span>
        </span>

        <span aria-hidden="true" className="text-slate-600">·</span>

        <span className="flex items-center gap-1 text-slate-300">
          <Compass className="w-3.5 h-3.5 text-slate-400" />
          <span>{video.genreLabel}</span>
        </span>
      </div>

      {/* Popularity & Discovery Dimension Matrix - 2 Columns on Mobile, 4 on Desktop */}
      <div className="mt-5 pt-5 border-t border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Popularity Spectrum */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
          <div>
            <div className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 mb-1">Popularity</div>
            <div className="text-xs sm:text-sm font-semibold text-white mb-2 truncate">{video.viewTierLabel}</div>
          </div>
          <div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-red-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${getTierProgress(video.viewTier)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
              <span>&lt;5K</span>
              <span>20M+</span>
            </div>
          </div>
        </div>

        {/* Release Era */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 mb-1">Release Epoch</div>
          <div>
            <div className="text-sm sm:text-base font-bold text-white tabular-nums">{video.releaseYear}</div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">{video.releaseDate}</div>
          </div>
        </div>

        {/* Genre & Domain */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 mb-1">Genre & Topic</div>
          <div>
            <div className="text-xs sm:text-sm font-semibold text-white truncate">{video.genreLabel}</div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">{video.tag || 'Curated Dimension'}</div>
          </div>
        </div>

        {/* Channel Origin */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 mb-1">Origin Channel</div>
          <div>
            <div className="text-xs sm:text-sm font-semibold text-white truncate">{video.channel}</div>
            <a
              href={video.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-red-400 hover:text-red-300 mt-0.5 inline-block"
            >
              Channel Profile →
            </a>
          </div>
        </div>
      </div>

      {/* Editorial Synopsis & Archival Trivia */}
      <div className="mt-5 pt-5 border-t border-white/5 space-y-3">
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {video.synopsis}
        </p>

        <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/10">
          <div className="text-[11px] font-semibold text-amber-300 mb-0.5">Archival Context</div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {video.curatorTrivia}
          </p>
        </div>

        {/* Pure Random Engine Status */}
        {deckStats && (
          <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>
                <strong className="text-slate-200">Pure Random Engine</strong> • {deckStats.totalInCatalog} verified specimens
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-300">
                Roll #{deckStats.sessionRolls || 1} this session
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-emerald-400/90 font-medium">Cache-free cryptographic shuffle</span>
            </div>

            {onResetDeck && (
              <button
                onClick={onResetDeck}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors min-h-[32px] flex items-center"
              >
                Clear session history
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
