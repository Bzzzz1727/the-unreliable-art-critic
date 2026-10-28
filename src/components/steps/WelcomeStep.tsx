import React from 'react';
import { CriticPet, CharacterExpression } from '../CriticPet';
import { CriticStage } from '../../types';
import { playClick, playBounce } from '../../utils/soundEffects';
import { Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeStepProps {
  currentStage: CriticStage;
  speechText: string;
  forcedExpression: CharacterExpression | null;
  onExpressionChange: (expr: CharacterExpression) => void;
  onSpeechChange: (speech: string) => void;
  onProceed: () => void;
  theme?: 'day' | 'night';
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  currentStage,
  speechText,
  forcedExpression,
  onExpressionChange,
  onSpeechChange,
  onProceed,
  theme = 'day'
}) => {
  const handleProceed = () => {
    playBounce();
    onProceed();
  };

  return (
    <div className="flex-1 w-full min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center anim-step-enter select-none p-4 pb-12 sm:pb-16">
      {/* One Cohesive Vertical Composition */}
      <div className="w-full max-w-md flex flex-col items-center text-center">
        {/* 1. Speech bubble, 2. Character, 3. Mood badge */}
        <CriticPet
          currentStage={currentStage}
          currentMoodLabel="MOOD: COMPOSED"
          speechText={speechText || "Oh. You brought something?"}
          forcedExpression={forcedExpression}
          onExpressionChange={onExpressionChange}
          onSpeechChange={onSpeechChange}
          theme={theme}
          size="lg"
          showBubble={true}
        />

        {/* 4. Main red CTA button */}
        <button
          onClick={handleProceed}
          className="sticker-btn-accent mt-4 sm:mt-5 text-sm sm:text-base py-2.5 px-7 sm:px-9 flex items-center justify-center gap-2 shadow-sticker hover:scale-105 active:scale-95 transition-transform shrink-0"
        >
          <span>[ SHOW ME YOUR ART ]</span>
          <ArrowRight className="w-4 h-4 shrink-0 text-white" />
        </button>

        {/* 5. Explanatory caption */}
        <p className="mt-2.5 sm:mt-3 font-mono text-[9px] sm:text-[10px] text-muted flex items-center justify-center gap-1.5 tracking-wider uppercase text-center max-w-sm px-2">
          <Sparkles className="w-3 h-3 text-accent shrink-0" />
          <span>AUTONOMOUS CRITIQUE ENGINE • CLICK THE CRITIC TO INTERACT</span>
        </p>
      </div>
    </div>
  );
};
