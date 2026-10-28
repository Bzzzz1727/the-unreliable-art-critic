import React, { useState, useEffect, useCallback } from 'react';
import { playPop, playBounce } from '../utils/soundEffects';

interface IntroSequenceProps {
  onStartReveal: () => void;
  onComplete: () => void;
}

export const IntroSequence: React.FC<IntroSequenceProps> = ({ onStartReveal, onComplete }) => {
  // 1: red dot
  // 2: transform to eyes
  // 3: character bounce in
  // 4: speech bubble pops
  // 5: exiting (fade & scale out while interface staggers in)
  const [frame, setFrame] = useState<number>(1);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  const handleFinish = useCallback(() => {
    setIsExiting(true);
    onStartReveal();
    setTimeout(() => {
      onComplete();
    }, 380);
  }, [onStartReveal, onComplete]);

  useEffect(() => {
    // Check reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onStartReveal();
      onComplete();
      return;
    }

    // Sequence timeline: ~2.4s total before seamless stagger handoff
    const t1 = setTimeout(() => {
      setFrame(2);
      playBounce();
    }, 450);

    const t2 = setTimeout(() => {
      setFrame(3);
      playPop(520);
    }, 1000);

    const t3 = setTimeout(() => {
      setFrame(4);
      playPop(640);
    }, 1600);

    const t4 = setTimeout(() => {
      handleFinish();
    }, 2450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [handleFinish, onStartReveal, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden transition-all duration-400 ease-out ${
        isExiting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)'
      }}
    >
      {/* Skip button in corner */}
      <button
        onClick={handleFinish}
        className="absolute top-5 right-6 font-mono text-xs font-bold px-3 py-1.5 rounded-lg border shadow-sticker transition-transform hover:scale-105 active:scale-95"
        style={{
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--border)',
          color: 'var(--muted)'
        }}
      >
        [ SKIP INTRO › ]
      </button>

      {/* Frame 1: Tiny red dot */}
      {frame === 1 && (
        <div className="anim-pop-in">
          <div
            className="w-6 h-6 rounded-full border-2 animate-bounce"
            style={{
              backgroundColor: 'var(--accent)',
              borderColor: 'var(--border)'
            }}
          />
        </div>
      )}

      {/* Frame 2: Dot transforms into cartoon eyes */}
      {frame === 2 && (
        <div className="flex items-center gap-3 anim-pop-in">
          <div
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
            style={{
              backgroundColor: 'var(--panel)',
              borderColor: 'var(--border)'
            }}
          >
            <div
              className="w-4 h-4 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--text)' }}
            />
          </div>
          <div
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
            style={{
              backgroundColor: 'var(--panel)',
              borderColor: 'var(--accent)'
            }}
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: 'var(--accent)' }}
            />
          </div>
        </div>
      )}

      {/* Frame 3 & 4: Character pops in with speech bubble */}
      {(frame === 3 || frame >= 4) && (
        <div className="flex flex-col items-center anim-pop-in">
          {/* Speech bubble */}
          {frame >= 4 && (
            <div className="mb-3 anim-pop-in">
              <div
                className="rounded-2xl px-5 py-2.5 text-center border-2 shadow-sticker"
                style={{
                  backgroundColor: 'var(--bubble)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)'
                }}
              >
                <span className="font-sans font-semibold text-base sm:text-lg">
                  “I have arrived. Show me what you've made.”
                </span>
              </div>
            </div>
          )}

          {/* Character Illustration */}
          <div className="w-36 h-36">
            <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-md">
              <ellipse cx="80" cy="150" rx="46" ry="7" fill="var(--border)" opacity="0.15" />
              <path
                d="M 40 90 C 40 45, 60 25, 80 25 C 100 25, 120 45, 120 90 C 120 135, 102 145, 80 145 C 58 145, 40 135, 40 90 Z"
                fill="var(--panel)"
                stroke="var(--border)"
                strokeWidth="3.5"
              />
              {/* Beret */}
              <path
                d="M 54 36 C 60 18, 100 16, 106 32 C 108 38, 52 42, 54 36 Z"
                fill="var(--text)"
                stroke="var(--border)"
                strokeWidth="2.5"
              />
              <circle cx="80" cy="18" r="4.5" fill="var(--accent)" stroke="var(--border)" strokeWidth="1.5" />
              {/* Starry eyes */}
              <circle cx="64" cy="75" r="11" fill="var(--panel)" stroke="var(--border)" strokeWidth="3" />
              <circle cx="96" cy="75" r="11" fill="var(--panel)" stroke="var(--accent)" strokeWidth="3" />
              <polygon points="64,69 66,73 70,75 66,77 64,81 62,77 58,75 62,73" fill="var(--text)" />
              <polygon points="96,69 98,73 102,75 98,77 96,81 94,77 90,75 94,73" fill="var(--accent)" />
              {/* Happy smile */}
              <path d="M 72 98 Q 80 108 88 98" fill="none" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
