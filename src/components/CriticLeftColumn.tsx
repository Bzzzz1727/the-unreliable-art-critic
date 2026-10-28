import React from 'react';
import { CriticStage } from '../types';
import { STAGE_CONFIG, getSubtleSystemAnomaly } from '../services/criticPersonality';
import { CriticPet, CharacterExpression } from './CriticPet';
import { playClick } from '../utils/soundEffects';
import { Hand } from 'lucide-react';

interface CriticLeftColumnProps {
  currentStage: CriticStage;
  speechText: string;
  forcedExpression: CharacterExpression | null;
  onExpressionChange: (expr: CharacterExpression) => void;
  onSpeechChange: (speech: string) => void;
  onPoke: () => void;
  theme?: 'day' | 'night';
}

export const CriticLeftColumn: React.FC<CriticLeftColumnProps> = ({
  currentStage,
  speechText,
  forcedExpression,
  onExpressionChange,
  onSpeechChange,
  onPoke,
  theme = 'day'
}) => {
  const stageInfo = STAGE_CONFIG[currentStage];
  const subtleAnomaly = getSubtleSystemAnomaly(currentStage);

  return (
    <div className="h-full flex flex-col sticker-card p-3 overflow-hidden relative justify-between">
      {/* Top Tag: Compact Character Status */}
      <div className="flex items-center justify-between pb-1.5 border-b border-border font-mono text-[11px] shrink-0">
        <div className="flex items-center gap-1.5 font-bold text-text">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span>RESIDENT CRITIC</span>
        </div>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded border font-bold"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border)',
            color: 'var(--muted)'
          }}
        >
          STAGE 0{currentStage}
        </span>
      </div>

      {/* Main Character Stage (Living SVG Creature with Eye Tracking & 14 Expressions) */}
      <div className="my-auto py-1 flex flex-col items-center justify-center">
        <CriticPet
          currentStage={currentStage}
          currentMoodLabel={`MOOD: ${stageInfo.name}`}
          speechText={speechText}
          forcedExpression={forcedExpression}
          onExpressionChange={onExpressionChange}
          onSpeechChange={onSpeechChange}
          theme={theme}
        />
      </div>

      {/* Bottom Compact Progress Bar & Quick Poke Button */}
      <div className="shrink-0 space-y-1.5 pt-1.5 border-t border-border">
        {/* Subtle Anomaly Sticker if Stage >= 3 */}
        {subtleAnomaly && (
          <div
            className="rounded p-1 text-center font-mono text-[8px] font-bold border animate-pulse"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)'
            }}
          >
            [ANOMALY: {subtleAnomaly}]
          </div>
        )}

        {/* 5-Stage Dots */}
        <div className="flex items-center justify-between font-mono text-[8px] font-bold text-muted px-0.5">
          <span>PROGRESSION</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <span
                key={lvl}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  lvl <= currentStage ? 'bg-accent scale-110' : 'bg-muted opacity-30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Poke Button */}
        <button
          onClick={() => { playClick(); onPoke(); }}
          className="w-full sticker-btn text-[10px] py-1 flex items-center justify-center gap-1.5 text-text hover:border-accent"
        >
          <Hand className="w-3 h-3 text-accent" />
          <span>[ POKE CRITIC ]</span>
        </button>
      </div>
    </div>
  );
};
