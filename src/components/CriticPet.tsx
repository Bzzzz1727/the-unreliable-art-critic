import React, { useState, useEffect, useRef } from 'react';
import { CriticStage } from '../types';
import { playBounce, playPop, playDramatic, playEasterEgg } from '../utils/soundEffects';

export type CharacterExpression =
  | 'IDLE'
  | 'CURIOUS'
  | 'HAPPY'
  | 'IMPRESSED'
  | 'SUSPICIOUS'
  | 'CONFUSED'
  | 'OFFENDED'
  | 'ANGRY'
  | 'EMBARRASSED'
  | 'SLEEPY'
  | 'SHOCKED'
  | 'UNHINGED'
  | 'PROUD'
  | 'SNEAKY'
  | 'EASTER_EGG';

interface CriticPetProps {
  currentStage: CriticStage;
  currentMoodLabel?: string;
  speechText?: string;
  forcedExpression?: CharacterExpression | null;
  onExpressionChange?: (expr: CharacterExpression) => void;
  onSpeechChange?: (speech: string) => void;
  theme?: 'day' | 'night';
  size?: 'sm' | 'md' | 'lg';
  showBubble?: boolean;
}

const EXPRESSION_DIALOGUES: Record<CharacterExpression, string[]> = {
  IDLE: [
    "Show me your artwork.",
    "The canvas awaits.",
    "I am ready when you are.",
    "Show me what you've made."
  ],
  CURIOUS: [
    "Oh? What is this?",
    "Your headline is fighting the image for attention.",
    "Tell me your design choices.",
    "An interesting visual premise."
  ],
  HAPPY: [
    "The visual hierarchy works.",
    "Good morning. I have opinions.",
    "Clean contrast and clear reading order.",
    "I am genuinely impressed."
  ],
  IMPRESSED: [
    "Unfortunately, I respect this.",
    "The balance holds together well.",
    "I dislike how effective this is.",
    "A rare moment of visual discipline."
  ],
  SUSPICIOUS: [
    "We need to discuss your margins.",
    "The layout is balanced, but the content sits too close to the edges.",
    "Did you choose that font pairing on purpose?",
    "The empty space is uneven across the page."
  ],
  CONFUSED: [
    "Where is the viewer supposed to look first?",
    "The headline and subtitle compete for attention.",
    "That alignment looks accidental.",
    "The visual weight feels off-balance."
  ],
  OFFENDED: [
    "That contrast choice is hard to defend.",
    "The text is fighting the background.",
    "I strongly disagree with that layout choice.",
    "Your margins are collapsing inward."
  ],
  ANGRY: [
    "The typography has no clear hierarchy.",
    "Three elements are shouting simultaneously.",
    "That spacing inconsistency is visible from across the room.",
    "The layout feels crowded and unresolved."
  ],
  EMBARRASSED: [
    "That is... annoyingly reasonable.",
    "You made a fair point about the hierarchy.",
    "Perhaps your intentional contrast does work.",
    "I will concede that adjustment."
  ],
  SLEEPY: [
    "Ah. My natural habitat.",
    "Too much unaligned text today.",
    "Wake me when the margins are fixed.",
    "Resting my analytical eyes."
  ],
  SHOCKED: [
    "That headline is completely overpowering the layout.",
    "Why are the edges crowded like that?",
    "The focal point has vanished entirely.",
    "The contrast drops to zero in that corner."
  ],
  UNHINGED: [
    "The spacing is uneven: left is crowded while right is empty.",
    "Why are three different typefaces competing here?",
    "The balance works, but the margins feel claustrophobic.",
    "The focal point is hiding behind secondary details."
  ],
  PROUD: [
    "Unfiltered design truth.",
    "My standards remain firm.",
    "Good design requires decisive editing.",
    "Clarity always beats decoration."
  ],
  SNEAKY: [
    "I see what you tried to hide in that corner.",
    "A quiet alignment flaw noticed.",
    "Watching the visual balance closely.",
    "Your secondary text needs more contrast."
  ],
  EASTER_EGG: [
    "You were not supposed to find that."
  ]
};

export const CriticPet: React.FC<CriticPetProps> = ({
  currentStage,
  currentMoodLabel,
  speechText,
  forcedExpression,
  onExpressionChange,
  onSpeechChange,
  theme = 'day',
  size = 'md',
  showBubble = true
}) => {
  const [internalExpression, setInternalExpression] = useState<CharacterExpression>('IDLE');
  const [eyeOffset, setEyeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [headTilt, setHeadTilt] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isEasterEggActive, setIsEasterEggActive] = useState<boolean>(false);

  // Successive Clicks Counter & Inactivity Timer
  const [clickCount, setClickCount] = useState<number>(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeExpression: CharacterExpression = isEasterEggActive
    ? 'EASTER_EGG'
    : forcedExpression || internalExpression;

  // Track cursor position for subtle eye & head movement
  useEffect(() => {
    // Check if touch device
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Wake up from sleepy if mouse moves
      if (internalExpression === 'SLEEPY' && !forcedExpression) {
        setInternalExpression('IDLE');
      }

      // Reset idle timer
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (!forcedExpression && !isEasterEggActive) {
          setInternalExpression('SLEEPY');
        }
      }, 18000); // 18s idle -> sleepy

      if (!containerRef.current || isEasterEggActive) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxOffset = 4.5; // constrained within eye boundary

      if (distance > 0) {
        const factor = Math.min(distance / 280, 1) * maxOffset;
        setEyeOffset({
          x: (deltaX / distance) * factor,
          y: (deltaY / distance) * factor
        });
        // Subtle head tilt towards cursor
        const tilt = Math.max(-5, Math.min(5, (deltaX / 300) * 5));
        setHeadTilt(tilt);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [internalExpression, forcedExpression, isEasterEggActive]);

  // Random blink interval (3.5 to 6s)
  useEffect(() => {
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
      const nextInterval = 3500 + Math.random() * 3000;
      blinkTimer = setTimeout(triggerBlink, nextInterval);
    };

    let blinkTimer = setTimeout(triggerBlink, 3500);
    return () => clearTimeout(blinkTimer);
  }, []);

  // Sync stage to internal expression if not forced
  useEffect(() => {
    if (forcedExpression || isEasterEggActive) return;
    if (currentStage === 1) setInternalExpression('IDLE');
    else if (currentStage === 2) setInternalExpression('PROUD');
    else if (currentStage === 3) setInternalExpression('SUSPICIOUS');
    else if (currentStage === 4) setInternalExpression('OFFENDED');
    else if (currentStage === 5) setInternalExpression('UNHINGED');
  }, [currentStage, forcedExpression, isEasterEggActive]);

  // Hover triggers CURIOUS and tilt
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!forcedExpression && !isEasterEggActive && internalExpression !== 'SLEEPY') {
      setInternalExpression('CURIOUS');
      if (Math.random() > 0.6 && onSpeechChange) {
        onSpeechChange("Oh? You noticed me.");
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!forcedExpression && !isEasterEggActive && internalExpression === 'CURIOUS') {
      if (currentStage === 1) setInternalExpression('IDLE');
      else if (currentStage === 2) setInternalExpression('PROUD');
      else if (currentStage === 3) setInternalExpression('SUSPICIOUS');
      else if (currentStage === 4) setInternalExpression('OFFENDED');
      else if (currentStage === 5) setInternalExpression('UNHINGED');
    }
  };

  // SUCCESSIVE CLICK LOGIC & 7-CLICK EASTER EGG
  const handleCharacterClick = () => {
    if (isEasterEggActive) return;

    // Reset 8-second inactivity timer
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      setClickCount(0);
    }, 8000);

    const nextClick = clickCount + 1;
    setClickCount(nextClick);

    if (nextClick === 1) {
      playBounce();
      setInternalExpression('SHOCKED');
      if (onSpeechChange) onSpeechChange("Oh. Hello.");
      setTimeout(() => setInternalExpression('HAPPY'), 380);
    } else if (nextClick === 2) {
      playPop();
      setInternalExpression('SUSPICIOUS');
      if (onSpeechChange) onSpeechChange("Do you need something?");
    } else if (nextClick === 3) {
      playPop();
      setInternalExpression('OFFENDED');
      if (onSpeechChange) onSpeechChange("I am trying to look professional.");
    } else if (nextClick === 4) {
      playDramatic();
      setInternalExpression('OFFENDED');
      if (onSpeechChange) onSpeechChange("IS THIS AN INTERROGATION?");
    } else if (nextClick === 5) {
      playDramatic();
      setInternalExpression('UNHINGED');
      if (onSpeechChange) onSpeechChange("THE RECTANGLE KNOWS WHAT YOU DID.");
    } else if (nextClick === 6) {
      playBounce();
      setInternalExpression('SNEAKY');
      if (onSpeechChange) onSpeechChange("You are getting suspiciously persistent.");
    } else if (nextClick >= 7) {
      // TRIGGER THE SECRET EASTER EGG!
      playEasterEgg();
      setIsEasterEggActive(true);
      setEyeOffset({ x: 0, y: 0 }); // pupils freeze centered directly at user
      setHeadTilt(0);

      if (onSpeechChange) {
        onSpeechChange("YOU WERE NOT SUPPOSED TO FIND THAT.");
      }

      // Reset after 2.8 seconds
      setTimeout(() => {
        setIsEasterEggActive(false);
        setClickCount(0);
        setInternalExpression('IDLE');
        if (onSpeechChange) onSpeechChange("Let us return to formal business.");
      }, 2800);
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCharacterClick();
    }
  };

  // Expression-based head rotation
  let dynamicTilt = headTilt;
  if (activeExpression === 'CURIOUS') dynamicTilt = 6;
  else if (activeExpression === 'CONFUSED') dynamicTilt = -8;
  else if (activeExpression === 'OFFENDED') dynamicTilt = -5;
  else if (activeExpression === 'UNHINGED') dynamicTilt = 12;
  else if (activeExpression === 'PROUD') dynamicTilt = -3;

  // Theme-Aware Character Palette:
  // In Night Mode, the body remains an off-white/light grey (#EDEDED) with crisp dark outlines (#171717)
  // so the critic silhouette, eyes, eyebrows, and expressions POP with high contrast against the dark canvas!
  const isNight = theme === 'night';
  const bodyFill = isEasterEggActive ? '#1A0505' : isNight ? '#EDEDED' : '#FFFFFF';
  const charOutline = isEasterEggActive ? 'var(--accent)' : '#171717';
  const beretFill = isNight ? '#262626' : '#171717';
  const accentRed = isNight ? '#FF343B' : '#D71920';
  const facialDark = isEasterEggActive ? 'var(--accent)' : '#171717';
  const bubbleBg = isNight ? '#1E1E1E' : '#FFFFFF';
  const bubbleText = isNight ? '#F5F5F5' : '#171717';
  const bubbleBorder = isNight ? '#3A3A3A' : '#252525';

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center select-none w-full"
    >
      {/* Speech Bubble */}
      {showBubble && (
        <div
          className={`relative mb-2 w-full anim-pop-in ${
            size === 'lg'
              ? 'max-w-[280px]'
              : size === 'sm'
              ? 'max-w-[190px]'
              : 'max-w-[220px]'
          }`}
        >
          <div
            className={`rounded-xl text-left border shadow-sticker ${
              size === 'lg' ? 'px-3.5 py-2' : size === 'sm' ? 'px-2 py-1' : 'px-2.5 py-1.5'
            }`}
            style={{
              backgroundColor: bubbleBg,
              borderColor: bubbleBorder,
              color: bubbleText
            }}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: accentRed }}
              />
              <span className="font-mono text-[8px] font-bold tracking-widest uppercase opacity-70">
                CRITIC // {activeExpression}
              </span>
            </div>
            <p
              className={`font-sans font-semibold leading-tight line-clamp-3 ${
                size === 'lg'
                  ? 'text-sm sm:text-base'
                  : size === 'sm'
                  ? 'text-[10px]'
                  : 'text-[11px]'
              }`}
            >
              “{speechText || EXPRESSION_DIALOGUES[activeExpression]?.[0] || "Show me your artwork."}”
            </p>
          </div>
          {/* Cartoon speech bubble pointer */}
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px]"
            style={{ borderTopColor: bubbleBorder }}
          />
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[4.5px]"
            style={{ borderTopColor: bubbleBg }}
          />
        </div>
      )}

      {/* Interactive Critic Avatar */}
      <div
        tabIndex={0}
        role="button"
        aria-label="Interactive Critic Pet. Click or press Enter to interact."
        onClick={handleCharacterClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`cursor-pointer transition-transform duration-200 outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-full ${
          isEasterEggActive
            ? 'anim-easter-egg scale-105'
            : isHovered
            ? 'scale-105'
            : 'anim-character-breathe hover:scale-102 active:scale-95'
        }`}
        title="Click to interact with the critic! (7 clicks unlocks a secret)"
      >
        <svg
          viewBox="0 0 160 160"
          className={`${
            size === 'lg'
              ? 'w-36 h-36 sm:w-44 sm:h-44'
              : size === 'sm'
              ? 'w-14 h-14 sm:w-16 sm:h-16'
              : 'w-24 h-24 sm:w-28 sm:h-28'
          } drop-shadow-md overflow-visible`}
          style={{
            transform: `rotate(${dynamicTilt}deg)`,
            transition: 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {/* Shadow */}
          <ellipse
            cx="80"
            cy="150"
            rx="44"
            ry="6"
            fill={isNight ? '#000000' : '#252525'}
            opacity={isNight ? '0.5' : '0.12'}
          />

          {/* Main Body (Egg-shaped soft creature) */}
          <g>
            <path
              d="M 40 90 C 40 45, 60 25, 80 25 C 100 25, 120 45, 120 90 C 120 135, 102 145, 80 145 C 58 145, 40 135, 40 90 Z"
              fill={bodyFill}
              stroke={charOutline}
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Beret */}
            <path
              d="M 54 36 C 60 18, 100 16, 106 32 C 108 38, 52 42, 54 36 Z"
              fill={beretFill}
              stroke={charOutline}
              strokeWidth="2.5"
            />
            {/* Beret Pom-pom in Accent Red */}
            <circle cx="80" cy="18" r="4.5" fill={accentRed} stroke={charOutline} strokeWidth="1.5" />

            {/* EYEBROWS */}
            {activeExpression === 'ANGRY' ? (
              <g stroke={facialDark} strokeWidth="3" strokeLinecap="round">
                <line x1="56" y1="62" x2="72" y2="67" />
                <line x1="104" y1="62" x2="88" y2="67" />
              </g>
            ) : activeExpression === 'SUSPICIOUS' ? (
              <g stroke={facialDark} strokeWidth="2.8" strokeLinecap="round">
                <line x1="56" y1="67" x2="72" y2="67" />
                <line x1="88" y1="63" x2="104" y2="66" />
              </g>
            ) : activeExpression === 'CONFUSED' ? (
              <g stroke={facialDark} strokeWidth="2.8" strokeLinecap="round">
                <line x1="56" y1="63" x2="72" y2="67" />
                <line x1="88" y1="68" x2="104" y2="63" />
              </g>
            ) : null}

            {/* EYES CONTAINER */}
            {isEasterEggActive ? (
              // 15. SECRET EASTER EGG: Glowing Red Eyes & Cosmic Monocle Flare
              <g>
                <circle cx="64" cy="74" r="13" fill="#000000" stroke={accentRed} strokeWidth="3" />
                <circle cx="96" cy="74" r="13" fill="#000000" stroke={accentRed} strokeWidth="3" />
                <circle cx="64" cy="74" r="6" fill={accentRed} />
                <circle cx="96" cy="74" r="6" fill={accentRed} />
                <circle cx="64" cy="74" r="2" fill="#FFFFFF" />
                <circle cx="96" cy="74" r="2" fill="#FFFFFF" />
              </g>
            ) : isBlinking ? (
              // Regular eye blink
              <g stroke={facialDark} strokeWidth="3.2" strokeLinecap="round">
                <line x1="54" y1="75" x2="74" y2="75" />
                <line x1="86" y1="75" x2="106" y2="75" />
              </g>
            ) : activeExpression === 'HAPPY' || activeExpression === 'PROUD' ? (
              // 3. HAPPY / 13. PROUD: Curved Smiling Eyes
              <g>
                <path d="M 54 77 Q 64 68 74 77" fill="none" stroke={facialDark} strokeWidth="3.2" strokeLinecap="round" />
                <path d="M 86 77 Q 96 68 106 77" fill="none" stroke={facialDark} strokeWidth="3.2" strokeLinecap="round" />
                {/* Cute blush marks */}
                <line x1="50" y1="88" x2="56" y2="88" stroke={accentRed} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="104" y1="88" x2="110" y2="88" stroke={accentRed} strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ) : activeExpression === 'OFFENDED' ? (
              // 7. OFFENDED: Haughtily turned closed eyes + sweat drop
              <g>
                <path d="M 56 75 Q 65 69 74 75" fill="none" stroke={facialDark} strokeWidth="3.2" strokeLinecap="round" />
                <path d="M 88 75 Q 97 69 106 75" fill="none" stroke={facialDark} strokeWidth="3.2" strokeLinecap="round" />
                <path d="M 118 60 Q 124 55 120 66 Q 116 64 118 60 Z" fill={accentRed} stroke={charOutline} strokeWidth="1.2" />
              </g>
            ) : activeExpression === 'SHOCKED' ? (
              // 11. SHOCKED: Wide open eyes with tiny dot pupils + exclamation
              <g>
                <circle cx="64" cy="74" r="14" fill="#FFFFFF" stroke={charOutline} strokeWidth="3" />
                <circle cx="96" cy="74" r="14" fill="#FFFFFF" stroke={charOutline} strokeWidth="3" />
                <circle cx={64 + eyeOffset.x * 0.3} cy={74 + eyeOffset.y * 0.3} r="3.5" fill={accentRed} />
                <circle cx={96 + eyeOffset.x * 0.3} cy={74 + eyeOffset.y * 0.3} r="3.5" fill={accentRed} />
                <path d="M 126 50 L 126 62 M 126 67 L 126 69" stroke={accentRed} strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : activeExpression === 'SLEEPY' ? (
              // 10. SLEEPY: Droopy heavy eyelids + floating z
              <g>
                <path d="M 54 75 Q 64 80 74 75" fill="none" stroke={facialDark} strokeWidth="3.2" strokeLinecap="round" />
                <path d="M 86 75 Q 96 80 106 75" fill="none" stroke={facialDark} strokeWidth="3.2" strokeLinecap="round" />
                <text x="116" y="60" fill={accentRed} fontFamily="monospace" fontSize="12" fontWeight="bold">z</text>
                <text x="124" y="50" fill={accentRed} fontFamily="monospace" fontSize="9" fontWeight="bold">z</text>
              </g>
            ) : activeExpression === 'IMPRESSED' ? (
              // 4. IMPRESSED: Starry Eyes
              <g>
                <circle cx="64" cy="75" r="11" fill="#FFFFFF" stroke={charOutline} strokeWidth="3" />
                <circle cx="96" cy="75" r="11" fill="#FFFFFF" stroke={accentRed} strokeWidth="3" />
                <polygon points="64,69 66,73 70,75 66,77 64,81 62,77 58,75 62,73" fill={accentRed} />
                <polygon points="96,69 98,73 102,75 98,77 96,81 94,77 90,75 94,73" fill={accentRed} />
                <line x1="50" y1="88" x2="56" y2="88" stroke={accentRed} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="104" y1="88" x2="110" y2="88" stroke={accentRed} strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ) : activeExpression === 'EMBARRASSED' ? (
              // 9. EMBARRASSED: Looking down shyly with blush
              <g>
                <circle cx="64" cy="75" r="10" fill="#FFFFFF" stroke={charOutline} strokeWidth="2.8" />
                <circle cx="96" cy="75" r="10" fill="#FFFFFF" stroke={charOutline} strokeWidth="2.8" />
                <circle cx="64" cy="79" r="4.5" fill={facialDark} />
                <circle cx="96" cy="79" r="4.5" fill={facialDark} />
                <line x1="50" y1="86" x2="58" y2="86" stroke={accentRed} strokeWidth="3" strokeLinecap="round" />
                <line x1="102" y1="86" x2="110" y2="86" stroke={accentRed} strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : activeExpression === 'UNHINGED' ? (
              // 12. UNHINGED: Asymmetrical chaotic pupils
              <g>
                <circle cx="62" cy="73" r="15" fill="#FFFFFF" stroke={charOutline} strokeWidth="3" />
                <circle cx="98" cy="76" r="9" fill="#FFFFFF" stroke={accentRed} strokeWidth="3" />
                <circle cx="62" cy="73" r="3.5" fill={accentRed} />
                <circle cx="100" cy="75" r="6" fill={accentRed} />
              </g>
            ) : activeExpression === 'SNEAKY' ? (
              // 14. SNEAKY: Narrow eyelids, pupils glancing sideways
              <g>
                <ellipse cx="64" cy="75" rx="10" ry="6" fill="#FFFFFF" stroke={charOutline} strokeWidth="2.8" />
                <ellipse cx="96" cy="75" rx="10" ry="6" fill="#FFFFFF" stroke={charOutline} strokeWidth="2.8" />
                <circle cx="70" cy="75" r="4.5" fill={facialDark} />
                <circle cx="102" cy="75" r="4.5" fill={facialDark} />
              </g>
            ) : activeExpression === 'SUSPICIOUS' ? (
              // 5. SUSPICIOUS: Narrowed squint
              <g>
                <ellipse cx="64" cy="75" rx="10" ry="5.5" fill="#FFFFFF" stroke={charOutline} strokeWidth="2.8" />
                <ellipse cx="96" cy="75" rx="10" ry="5.5" fill="#FFFFFF" stroke={charOutline} strokeWidth="2.8" />
                <circle cx={64 + eyeOffset.x * 0.7} cy={75 + eyeOffset.y * 0.4} r="4" fill={facialDark} />
                <circle cx={96 + eyeOffset.x * 0.7} cy={75 + eyeOffset.y * 0.4} r="4" fill={facialDark} />
              </g>
            ) : activeExpression === 'CONFUSED' ? (
              // 6. CONFUSED: Pupils pointing different ways + question mark
              <g>
                <circle cx="64" cy="75" r="11" fill="#FFFFFF" stroke={charOutline} strokeWidth="2.8" />
                <circle cx="96" cy="75" r="11" fill="#FFFFFF" stroke={charOutline} strokeWidth="2.8" />
                <circle cx="61" cy="77" r="4.5" fill={facialDark} />
                <circle cx="99" cy="73" r="4.5" fill={facialDark} />
                <text x="116" y="58" fill={accentRed} fontFamily="sans-serif" fontSize="16" fontWeight="bold">?</text>
              </g>
            ) : (
              // 1. IDLE / 2. CURIOUS / 8. ANGRY: Standard tracking eyes with Monocle
              <g>
                {/* Left Eye */}
                <circle cx="64" cy="75" r="11" fill="#FFFFFF" stroke={charOutline} strokeWidth="3" />
                <circle
                  cx={64 + eyeOffset.x}
                  cy={75 + eyeOffset.y}
                  r="5.5"
                  fill={facialDark}
                />
                <circle
                  cx={64 + eyeOffset.x - 2}
                  cy={75 + eyeOffset.y - 2}
                  r="1.8"
                  fill="#FFFFFF"
                />

                {/* Right Eye (Blood Red Monocle) */}
                <circle cx="96" cy="75" r="11" fill="#FFFFFF" stroke={accentRed} strokeWidth="3" />
                <circle
                  cx={96 + eyeOffset.x}
                  cy={75 + eyeOffset.y}
                  r="5.5"
                  fill={facialDark}
                />
                <circle
                  cx={96 + eyeOffset.x - 2}
                  cy={75 + eyeOffset.y - 2}
                  r="1.8"
                  fill="#FFFFFF"
                />
                <path d="M 107 75 Q 116 88 114 110" fill="none" stroke={accentRed} strokeWidth="1.5" strokeDasharray="2 2" />
              </g>
            )}

            {/* MOUTH SHAPES */}
            {isEasterEggActive ? (
              // Silent flat grim line
              <line x1="72" y1="102" x2="88" y2="102" stroke={accentRed} strokeWidth="2.5" strokeLinecap="round" />
            ) : activeExpression === 'SHOCKED' ? (
              // Open O mouth
              <ellipse cx="80" cy="104" rx="6" ry="8.5" fill={facialDark} stroke={charOutline} strokeWidth="2" />
            ) : activeExpression === 'CURIOUS' ? (
              // Tiny round mouth
              <circle cx="80" cy="103" r="3.5" fill="none" stroke={facialDark} strokeWidth="2.5" />
            ) : activeExpression === 'OFFENDED' ? (
              // Disdainful pout
              <path d="M 74 104 Q 80 98 86 103" fill="none" stroke={facialDark} strokeWidth="2.8" strokeLinecap="round" />
            ) : activeExpression === 'ANGRY' ? (
              // Gritted rectangular mouth
              <rect x="73" y="100" width="14" height="4.5" rx="1.5" fill="none" stroke={facialDark} strokeWidth="2.2" />
            ) : activeExpression === 'CONFUSED' || activeExpression === 'SUSPICIOUS' ? (
              // Wavy skeptic mouth
              <path d="M 73 103 Q 77 100 81 103 Q 85 100 88 103" fill="none" stroke={facialDark} strokeWidth="2.5" strokeLinecap="round" />
            ) : activeExpression === 'HAPPY' || activeExpression === 'PROUD' ? (
              // Warm happy smile
              <path d="M 72 98 Q 80 108 88 98" fill="none" stroke={facialDark} strokeWidth="2.8" strokeLinecap="round" />
            ) : activeExpression === 'UNHINGED' ? (
              // Jagged chaotic mouth
              <path d="M 72 101 L 76 105 L 80 100 L 84 105 L 88 101" fill="none" stroke={accentRed} strokeWidth="2.5" strokeLinecap="round" />
            ) : activeExpression === 'SNEAKY' ? (
              // Crafty smirk
              <path d="M 75 102 Q 82 105 87 99" fill="none" stroke={facialDark} strokeWidth="2.5" strokeLinecap="round" />
            ) : (
              // Calm, composed small smile
              <path d="M 75 101 Q 80 105 85 101" fill="none" stroke={facialDark} strokeWidth="2.4" strokeLinecap="round" />
            )}

            {/* Tiny Hands & Critique Pen */}
            <g>
              <ellipse cx="50" cy="116" rx="5.5" ry="5.5" fill={bodyFill} stroke={charOutline} strokeWidth="2.2" />
              <ellipse cx="110" cy="116" rx="5.5" ry="5.5" fill={bodyFill} stroke={charOutline} strokeWidth="2.2" />
              <rect x="106" y="98" width="4.5" height="22" rx="1.5" transform="rotate(25 108 110)" fill={accentRed} stroke={charOutline} strokeWidth="1.5" />
            </g>
          </g>
        </svg>
      </div>

      {/* Mood status pill sticker */}
      <div
        className="mt-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border shadow-sticker"
        style={{
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--border)'
        }}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            currentStage >= 4 ? 'animate-ping' : ''
          }`}
          style={{ backgroundColor: 'var(--accent)' }}
        />
        <span className="font-mono text-[9px] font-bold tracking-wider uppercase text-text">
          {currentMoodLabel}
        </span>
      </div>
    </div>
  );
};
