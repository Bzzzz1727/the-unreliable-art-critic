import React from 'react';
import { Sparkles, FolderArchive, FileText, Sliders, RotateCcw, Play } from 'lucide-react';
import { playClick } from '../utils/soundEffects';

interface MobileBottomNavProps {
  currentRoute: 'critic' | 'archive';
  onNavigate: (route: 'critic' | 'archive') => void;
  hasArtwork: boolean;
  onOpenDossier?: () => void;
  onOpenSettings: () => void;
  onReplayIntro: () => void;
  onReset?: () => void;
  theme?: 'day' | 'night';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRoute,
  onNavigate,
  hasArtwork,
  onOpenDossier,
  onOpenSettings,
  onReplayIntro,
  onReset,
  theme = 'day'
}) => {
  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md select-none transition-colors"
      style={{
        backgroundColor: theme === 'night' ? 'rgba(26, 26, 26, 0.92)' : 'rgba(255, 255, 255, 0.92)',
        borderColor: 'var(--border)',
        paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom))'
      }}
      aria-label="Mobile Navigation Bar"
    >
      <div className="flex items-center justify-around px-2 pt-1.5 pb-1">
        {/* 1. CRITIC / STUDIO */}
        <button
          onClick={() => {
            playClick();
            onNavigate('critic');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            currentRoute === 'critic'
              ? 'text-accent font-bold scale-105'
              : 'text-muted hover:text-text'
          }`}
          aria-label="Critic Studio"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4" />
            {currentRoute === 'critic' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
            )}
          </div>
          <span className="font-mono text-[9px] tracking-wider mt-0.5 uppercase">CRITIC</span>
        </button>

        {/* 2. ARCHIVE */}
        <button
          onClick={() => {
            playClick();
            onNavigate('archive');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            currentRoute === 'archive'
              ? 'text-accent font-bold scale-105'
              : 'text-muted hover:text-text'
          }`}
          aria-label="Exhibition Archive"
        >
          <div className="relative">
            <FolderArchive className="w-4 h-4" />
            {currentRoute === 'archive' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
            )}
          </div>
          <span className="font-mono text-[9px] tracking-wider mt-0.5 uppercase">ARCHIVE</span>
        </button>

        {/* 3. DOSSIER (Available when artwork exists) */}
        {hasArtwork && onOpenDossier && (
          <button
            onClick={() => {
              playClick();
              onOpenDossier();
            }}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-text hover:text-accent transition-all animate-bounce-subtle"
            aria-label="View Full Critique Dossier"
          >
            <div className="relative">
              <FileText className="w-4 h-4 text-accent" />
            </div>
            <span className="font-mono text-[9px] tracking-wider mt-0.5 text-accent font-bold uppercase">DOSSIER</span>
          </button>
        )}

        {/* 4. SETTINGS */}
        <button
          onClick={() => {
            playClick();
            onOpenSettings();
          }}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-muted hover:text-text transition-all"
          aria-label="Settings"
        >
          <Sliders className="w-4 h-4" />
          <span className="font-mono text-[9px] tracking-wider mt-0.5 uppercase">ENGINE</span>
        </button>

        {/* 5. RESET OR INTRO */}
        {hasArtwork && onReset ? (
          <button
            onClick={() => {
              playClick();
              onReset();
            }}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-muted hover:text-accent transition-all"
            aria-label="Reset Session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="font-mono text-[9px] tracking-wider mt-0.5 uppercase">RESET</span>
          </button>
        ) : (
          <button
            onClick={() => {
              playClick();
              onReplayIntro();
            }}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-muted hover:text-text transition-all"
            aria-label="Replay Intro"
          >
            <Play className="w-3.5 h-3.5 text-accent" />
            <span className="font-mono text-[9px] tracking-wider mt-0.5 uppercase">INTRO</span>
          </button>
        )}
      </div>
    </nav>
  );
};
export default MobileBottomNav;
