import React from 'react';
import { CriticStage } from '../types';
import { STAGE_CONFIG } from '../services/criticPersonality';
import { Sliders, RefreshCw, BookOpen, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  currentStage: CriticStage;
  onOpenAbout: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
  hasArtwork: boolean;
  onScrollToGallery?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStage,
  onOpenAbout,
  onOpenRules,
  onOpenSettings,
  onReset,
  hasArtwork
}) => {
  const stageInfo = STAGE_CONFIG[currentStage];

  return (
    <header className="sticky top-0 z-40 w-full bg-black/90 backdrop-blur-md border-b border-[#292929] px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#D71920]" />
          <a
            href="#"
            className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#F5F5F5] hover:text-[#D71920] transition-colors"
          >
            THE UNRELIABLE ART CRITIC
          </a>
          <span className="hidden md:inline-block font-mono text-[10px] text-[#929292] border border-[#292929] px-2 py-0.5">
            EXH // 001
          </span>
        </div>

        {/* Right: Navigation items */}
        <div className="flex items-center gap-4 sm:gap-6">
          {hasArtwork && (
            <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-[#929292] border border-[#292929] px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] animate-pulse" />
              <span className="text-[#F5F5F5]">{stageInfo.statusLabel}</span>
            </div>
          )}

          <nav className="flex items-center gap-3 sm:gap-5 font-mono text-xs text-[#929292]">
            <button
              onClick={onOpenAbout}
              className="hover:text-[#F5F5F5] transition-colors flex items-center gap-1.5 py-1 underline-offset-4 hover:underline"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>ABOUT</span>
            </button>

            <button
              onClick={onOpenRules}
              className="hover:text-[#F5F5F5] transition-colors flex items-center gap-1.5 py-1 underline-offset-4 hover:underline"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>THE RULES</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="hover:text-[#F5F5F5] transition-colors flex items-center gap-1.5 py-1 underline-offset-4 hover:underline"
              title="Configure API Key or View Engine Status"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ENGINE</span>
            </button>

            {hasArtwork && (
              <button
                onClick={onReset}
                className="hover:text-[#D71920] text-[#929292] transition-colors flex items-center gap-1 py-1"
                title="Reset session"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">RESET</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
