import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface TopBarProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ isMuted, onToggleMute }) => {
  return (
    <header className="w-full border-b border-white/5 bg-[#090a0f]/80 backdrop-blur-md pt-safe">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Wordmark "NotForYoutube" */}
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-600 rotate-45 shadow-sm shadow-red-500/50" />
          <span className="tracking-tight font-extrabold text-lg text-white">NotForYoutube</span>
        </div>

        {/* Minimal Audio Effects Toggle */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Sound FX Muted' : 'Sound FX Enabled'}
          className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label="Toggle Sound Effects"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
        </button>
      </div>
    </header>
  );
};
