import React from 'react';
import { Artwork, CriticStage } from '../../types';
import { CriticPet } from '../CriticPet';
import { Loader2, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface InvestigatingStepProps {
  artwork: Artwork;
  currentStage: CriticStage;
  errorMessage: string | null;
  onRetry: () => void;
  onBackToUpload: () => void;
  theme?: 'day' | 'night';
}

export const InvestigatingStep: React.FC<InvestigatingStepProps> = ({
  artwork,
  currentStage,
  errorMessage,
  onRetry,
  onBackToUpload,
  theme = 'day'
}) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center anim-step-enter select-none p-4 max-w-2xl mx-auto">
      {/* Central Investigation Stage: Critic examining the Artwork */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 my-auto">
        {/* Artwork Preview at moderate size */}
        <div
          className="w-48 sm:w-56 max-h-[calc(100dvh-320px)] p-2 rounded-xl border-2 shadow-sticker flex items-center justify-center"
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

        {/* Critic Examining the Artwork */}
        <div className="flex flex-col items-center">
          <CriticPet
            currentStage={currentStage}
            currentMoodLabel="MOOD: INVESTIGATING"
            speechText={errorMessage ? "Curatorial panic! An anomaly occurred." : "Hmm. Interesting."}
            forcedExpression={errorMessage ? 'SHOCKED' : 'CONFUSED'}
            theme={theme}
            size="md"
            showBubble={true}
          />
        </div>
      </div>

      {/* Loading Status or Error Box */}
      <div className="mt-6 flex flex-col items-center text-center">
        {!errorMessage ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-accent animate-spin" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-text">
                Inspecting the evidence...
              </span>
            </div>
            <p className="font-sans text-xs text-muted max-w-xs">
              Scrutinising formal balance, metaphysical kerning, and color dissonance.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className="p-3 rounded-xl border flex items-center gap-2 max-w-md"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--accent)',
                color: 'var(--accent)'
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="font-mono text-xs text-left">
                {errorMessage}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onRetry}
                className="sticker-btn-accent text-xs py-1.5 px-4 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>[ RETRY ANALYSIS ]</span>
              </button>
              <button
                onClick={onBackToUpload}
                className="sticker-btn text-xs py-1.5 px-4 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-muted" />
                <span>[ BACK TO UPLOAD ]</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
