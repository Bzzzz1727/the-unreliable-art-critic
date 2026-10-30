import React from 'react';
import { Volume2, VolumeX, RotateCcw, Sliders, Play, Sun, Moon, FolderArchive } from 'lucide-react';
import { playClick } from '../utils/soundEffects';

interface HeaderBarProps {
  theme: 'day' | 'night';
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onReplayIntro: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
  onNavigateArchive?: () => void;
  isArchiveView?: boolean;
  hasArtwork: boolean;
  currentStep: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  onReplayIntro,
  onOpenSettings,
  onReset,
  onNavigateArchive,
  isArchiveView = false,
  hasArtwork,
  currentStep
}) => {
  return (
    <header
      className="sticky top-0 z-30 shrink-0 border-b px-3 sm:px-6 flex items-center justify-between select-none shadow-xs relative transition-colors"
      style={{
        backgroundColor: 'var(--panel)',
        borderColor: 'var(--border)',
        paddingTop: 'max(0.25rem, env(safe-area-inset-top))',
        minHeight: 'calc(3rem + env(safe-area-inset-top, 0px))'
      }}
    >
      {/* Left: Minimalist Contemporary Editorial Identity */}
      <div className="flex items-center gap-2 group cursor-default z-10 shrink-0">
        {/* Minimal eye-inspired brand mark with subtle hover response */}
        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
            fill="none"
          >
            {/* Restrained eye contour */}
            <path
              d="M 2 12 C 6 6, 18 6, 22 12 C 18 18, 6 18, 2 12 Z"
              stroke="var(--text)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Blood-red iris */}
            <circle
              cx="12"
              cy="12"
              r="3.2"
              fill="var(--accent)"
              className="transition-all duration-200 group-hover:scale-110 origin-center"
            />
            <circle
              cx="13.2"
              cy="10.8"
              r="0.9"
              fill="#FFFFFF"
            />
          </svg>
        </div>

        {/* Two-Line Editorial Typography */}
        <div className="flex flex-col justify-center leading-none select-none transition-transform duration-150 group-hover:translate-x-[1px]">
          <span className="font-mono text-[8px] sm:text-[9px] font-bold tracking-[0.16em] text-muted uppercase">
            THE UNRELIABLE
          </span>
          <span className="font-sans text-[11px] sm:text-[13px] font-black tracking-tight text-text uppercase mt-[2px]">
            ART CRITIC
          </span>
        </div>
      </div>

      {/* Centre: Current Step Indicator - Centred horizontally relative to the ENTIRE viewport */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-0.5 rounded-full border shadow-sticker pointer-events-none z-0 max-w-[calc(100vw-340px)] truncate"
        style={{
          backgroundColor: 'var(--bg)',
          borderColor: 'var(--border)',
          color: 'var(--text)'
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
        <span className="font-bold tracking-wider truncate">{currentStep}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 z-10 shrink-0">
        {/* DAY / NIGHT THEME TOGGLE (Always accessible) */}
        <button
          onClick={() => {
            playClick();
            onToggleTheme();
          }}
          className="sticker-btn py-1 px-2 text-[10px] text-text min-h-[32px] flex items-center justify-center"
          aria-label={`Switch to ${theme === 'day' ? 'Night' : 'Day'} Mode`}
          title={`Active: ${theme === 'day' ? 'Day Mode' : 'Night Mode'} (Click to toggle)`}
        >
          {theme === 'day' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-accent" />
              <span className="hidden lg:inline">DAY</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-accent" />
              <span className="hidden lg:inline">NIGHT</span>
            </>
          )}
        </button>

        {/* SOUND TOGGLE (Always accessible) */}
        <button
          onClick={() => {
            playClick();
            onToggleSound();
          }}
          className={`sticker-btn py-1 px-2 text-[10px] min-h-[32px] flex items-center justify-center ${
            soundEnabled ? 'text-accent border-accent' : 'text-muted'
          }`}
          aria-label={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          title={soundEnabled ? 'Sound Enabled (Click to Mute)' : 'Sound Muted (Click to Enable)'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden lg:inline">{soundEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* DESKTOP-ONLY CONTROLS (Handled by Mobile Bottom Bar on phones) */}
        {/* REPLAY INTRO */}
        <button
          onClick={() => {
            playClick();
            onReplayIntro();
          }}
          className="hidden sm:inline-flex sticker-btn py-1 px-2 text-[10px] text-muted hover:text-text"
          title="Replay Introduction Animation"
        >
          <Play className="w-3 h-3 text-accent" />
          <span className="hidden lg:inline">INTRO</span>
        </button>

        {/* ARCHIVE / HISTORY BUTTON */}
        {onNavigateArchive && (
          <button
            onClick={() => {
              playClick();
              onNavigateArchive();
            }}
            className={`hidden sm:inline-flex sticker-btn py-1 px-2 text-[10px] ${
              isArchiveView ? 'text-accent border-accent font-bold' : 'text-muted hover:text-text'
            }`}
            title="View Analyzed Artworks Archive"
          >
            <FolderArchive className="w-3.5 h-3.5 text-accent" />
            <span className="hidden lg:inline">ARCHIVE</span>
          </button>
        )}

        {/* ENGINE / SETTINGS */}
        <button
          onClick={() => {
            playClick();
            onOpenSettings();
          }}
          className="hidden sm:inline-flex sticker-btn py-1 px-2 text-[10px] text-muted hover:text-text"
          title="AI Engine / API Configuration"
        >
          <Sliders className="w-3 h-3" />
          <span className="hidden lg:inline">ENGINE</span>
        </button>

        {/* RESET SESSION */}
        {hasArtwork && (
          <button
            onClick={() => {
              playClick();
              onReset();
            }}
            className="hidden sm:inline-flex sticker-btn py-1 px-2 text-[10px] text-muted hover:text-accent"
            title="Reset exhibition session"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden lg:inline">RESET</span>
          </button>
        )}
      </div>
    </header>
  );
};
export default HeaderBar;
