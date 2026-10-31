import React, { useState, useEffect } from 'react';
import { Artwork, CriticStage, RedesignDirection, CritiqueData } from '../../types';
import { generateRedesignBrief } from '../../services/criticEngine';
import { CriticPet, CharacterExpression } from '../CriticPet';
import { playClick } from '../../utils/soundEffects';
import { ArrowLeft, Layers, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface RedesignStepProps {
  artwork: Artwork;
  currentStage: CriticStage;
  currentCritique?: CritiqueData | null;
  onReturnToVerdict: () => void;
  speechText: string;
  forcedExpression: CharacterExpression | null;
  onExpressionChange: (expr: CharacterExpression) => void;
  onSpeechChange: (speech: string) => void;
  theme?: 'day' | 'night';
}

export const RedesignStep: React.FC<RedesignStepProps> = ({
  artwork,
  currentStage,
  currentCritique,
  onReturnToVerdict,
  speechText,
  forcedExpression,
  onExpressionChange,
  onSpeechChange,
  theme = 'day'
}) => {
  const [briefs, setBriefs] = useState<RedesignDirection[] | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    generateRedesignBrief(artwork, currentStage, currentCritique || undefined)
      .then((data) => {
        if (isMounted) setBriefs(data);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, [artwork, currentStage, currentCritique]);

  const activeBrief = briefs ? briefs[selectedDirection] : null;

  return (
    <div className="w-full flex flex-col anim-step-enter select-none max-w-4xl mx-auto space-y-3 pb-20 sm:pb-8 px-2 sm:px-4">
      {/* Top Banner: Return button + Floating Critic */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-border">
        <button
          onClick={() => { playClick(); onReturnToVerdict(); }}
          className="sticker-btn text-xs py-1.5 px-3 min-h-[36px] flex items-center gap-1.5 text-text"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[ RETURN TO VERDICT ]</span>
        </button>

        <div className="flex items-center gap-2">
          <CriticPet
            currentStage={currentStage}
            currentMoodLabel="MOOD: REDESIGN"
            speechText={speechText || "Three formal trajectories."}
            forcedExpression={forcedExpression}
            onExpressionChange={onExpressionChange}
            onSpeechChange={onSpeechChange}
            theme={theme}
            size="sm"
            showBubble={true}
          />
        </div>
      </div>

      {/* Central Content: Artwork at Moderate Size + 3 Selectable Directions */}
      <div className="w-full flex flex-col md:flex-row items-center md:items-start justify-center gap-4 my-2">
        {/* Moderate Artwork Preview */}
        <div className="shrink-0 flex flex-col items-center">
          <div
            className="w-40 sm:w-52 max-h-[calc(100dvh-320px)] p-2 rounded-xl border-2 shadow-sticker flex items-center justify-center"
            style={{
              backgroundColor: 'var(--panel)',
              borderColor: 'var(--border)'
            }}
          >
            <img
              src={artwork.dataUrl}
              alt={artwork.fileName}
              className="artwork-preserve max-h-[calc(100dvh-340px)] max-w-full w-auto object-contain rounded-lg"
            />
          </div>
          <span className="font-mono text-[9px] text-muted mt-1.5">
            CURRENT CANVAS: {artwork.category}
          </span>
        </div>

        {/* 3 Creative Directions */}
        <div className="flex-1 min-w-0 max-w-xl w-full flex flex-col space-y-2.5">
          {isLoading || !briefs ? (
            <div className="py-12 text-center font-mono text-xs text-muted flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
              <span>FORMULATING THREE CREATIVE DIRECTIONS...</span>
            </div>
          ) : (
            <>
              {/* Direction Selectors: 01 RESTRAINT, 02 DISTORTION, 03 REINTERPRETATION */}
              <div className="grid grid-cols-3 gap-2">
                {briefs.map((b, idx) => (
                  <button
                    key={b.number}
                    onClick={() => { playClick(); setSelectedDirection(idx); }}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      selectedDirection === idx
                        ? 'border-accent shadow-sticker'
                        : 'border-border hover:border-text opacity-75'
                    }`}
                    style={{
                      backgroundColor: selectedDirection === idx ? 'var(--panel)' : 'var(--bg)'
                    }}
                  >
                    <span className="font-mono text-[9px] font-bold text-accent block">
                      {b.number}
                    </span>
                    <h5 className="font-mono text-[10px] font-bold text-text truncate">
                      {b.code}
                    </h5>
                  </button>
                ))}
              </div>

              {/* Active Direction Detailed Brief Card */}
              {activeBrief && (
                <div
                  className="border-2 rounded-xl p-3 shadow-sticker space-y-2"
                  style={{
                    backgroundColor: 'var(--panel)',
                    borderColor: 'var(--border)'
                  }}
                >
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="font-mono text-xs font-bold text-text">
                      {activeBrief.title}
                    </span>
                    <span className="font-mono text-[9px] text-accent font-bold">
                      DIRECTION {activeBrief.number}
                    </span>
                  </div>

                  <p className="font-sans text-xs text-muted leading-relaxed">
                    {activeBrief.concept}
                  </p>

                  {(activeBrief.whatChanges || activeBrief.whyItWorks || activeBrief.whatToPreserve) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t text-[11px] font-sans" style={{ borderColor: 'var(--border)' }}>
                      {activeBrief.whatChanges && (
                        <div className="p-1.5 rounded-lg border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
                          <span className="font-mono text-[8px] font-bold text-accent uppercase block">WHAT CHANGES:</span>
                          <span className="text-text">{activeBrief.whatChanges}</span>
                        </div>
                      )}
                      {activeBrief.whyItWorks && (
                        <div className="p-1.5 rounded-lg border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
                          <span className="font-mono text-[8px] font-bold text-text uppercase block">WHY IT WORKS:</span>
                          <span className="text-muted">{activeBrief.whyItWorks}</span>
                        </div>
                      )}
                      {activeBrief.whatToPreserve && (
                        <div className="p-1.5 rounded-lg border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
                          <span className="font-mono text-[8px] font-bold text-accent uppercase block">WHAT TO PRESERVE:</span>
                          <span className="text-text">{activeBrief.whatToPreserve}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-1.5 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
                    <span className="font-mono text-[9px] font-bold text-text uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-accent" />
                      ACTIONABLE PRODUCTION STEPS:
                    </span>
                    <ul className="text-xs space-y-1 text-text font-sans">
                      {activeBrief.actionableSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="shrink-0 pt-2 border-t border-border flex justify-center">
        <button
          onClick={() => { playClick(); onReturnToVerdict(); }}
          className="sticker-btn text-xs py-1 px-4 flex items-center gap-1.5 text-text"
        >
          <Layers className="w-3.5 h-3.5 text-accent" />
          <span>[ RETURN TO VERDICT ]</span>
        </button>
      </div>
    </div>
  );
};
