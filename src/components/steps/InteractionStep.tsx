import React, { useState, useEffect } from 'react';
import {
  Artwork,
  CritiqueData,
  CriticStage,
  ConversationExchange,
  BrutalTruthData
} from '../../types';
import {
  respondToDefense,
  respondToChallenge,
  generateBrutalTruth
} from '../../services/criticEngine';
import { CriticPet, CharacterExpression } from '../CriticPet';
import { playClick, playBounce, playDramatic } from '../../utils/soundEffects';
import { Shield, Flame, Zap, ArrowLeft, Send, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface InteractionStepProps {
  mode: 'DEFEND' | 'CHALLENGE' | 'BRUTAL_TRUTH';
  artwork: Artwork;
  currentCritique: CritiqueData;
  currentStage: CriticStage;
  onUpdateVerdictScore: (newScore: number) => void;
  onNewExchange: (exchange: ConversationExchange, stageShift?: { nextStage: CriticStage; reason: string }) => void;
  onReturnToVerdict: () => void;
  speechText: string;
  forcedExpression: CharacterExpression | null;
  onExpressionChange: (expr: CharacterExpression) => void;
  onSpeechChange: (speech: string) => void;
  initialBrutalTruth?: BrutalTruthData | null;
  theme?: 'day' | 'night';
}

export const InteractionStep: React.FC<InteractionStepProps> = ({
  mode,
  artwork,
  currentCritique,
  currentStage,
  onUpdateVerdictScore,
  onNewExchange,
  onReturnToVerdict,
  speechText,
  forcedExpression,
  onExpressionChange,
  onSpeechChange,
  initialBrutalTruth = null,
  theme = 'day'
}) => {
  const [defenseInput, setDefenseInput] = useState<string>('');
  const [challengeInput, setChallengeInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastDefenseReply, setLastDefenseReply] = useState<string | null>(null);
  const [lastChallengeReply, setLastChallengeReply] = useState<string | null>(null);
  const [brutalTruth, setBrutalTruth] = useState<BrutalTruthData | null>(initialBrutalTruth);
  const [brutalError, setBrutalError] = useState<string | null>(null);

  // If mode is BRUTAL_TRUTH and not yet provided, fetch with explicit error handling
  useEffect(() => {
    if (mode === 'BRUTAL_TRUTH' && !brutalTruth) {
      let isMounted = true;
      setIsSubmitting(true);
      setBrutalError(null);

      generateBrutalTruth(artwork)
        .then((truth) => {
          if (isMounted) {
            setBrutalTruth(truth);
            onExpressionChange('PROUD');
            onSpeechChange(truth.hardTruth || "Unvarnished reality.");
          }
        })
        .catch((err) => {
          console.error('Brutal Truth generation failed:', err);
          if (isMounted) {
            setBrutalError("Failed to extract brutal truth. Please retry.");
            onExpressionChange('CONFUSED');
            onSpeechChange("Curatorial analysis stalled.");
          }
        })
        .finally(() => {
          if (isMounted) setIsSubmitting(false);
        });

      return () => { isMounted = false; };
    }
  }, [mode, artwork, brutalTruth, onExpressionChange, onSpeechChange]);

  const handleRetryBrutalTruth = () => {
    setIsSubmitting(true);
    setBrutalError(null);
    generateBrutalTruth(artwork)
      .then((truth) => {
        setBrutalTruth(truth);
        onExpressionChange('PROUD');
      })
      .catch((err) => {
        console.error('Retry failed:', err);
        setBrutalError("Analysis error. Please verify your connection.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // Handle Defend Submission
  const handleDefendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defenseInput.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      playClick();
      const res = await respondToDefense(
        artwork,
        defenseInput.trim(),
        currentStage,
        currentCritique
      );

      if (res.verdictReconsidered && res.updatedVerdictScore) {
        onUpdateVerdictScore(res.updatedVerdictScore);
        onExpressionChange('IMPRESSED');
        onSpeechChange("That is... annoyingly reasonable.");
        playBounce();
      } else {
        onExpressionChange('SUSPICIOUS');
        onSpeechChange(res.unreliableNote || "Your rationale does not alter the optical physics.");
      }

      const nextSt = Math.min(5, currentStage + 1) as CriticStage;
      onNewExchange(
        {
          id: `ex-${Date.now()}`,
          type: 'defense',
          userMessage: defenseInput.trim(),
          criticReply: res.reply,
          unreliableNote: res.unreliableNote,
          stage: currentStage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          nextStage: nextSt,
          reason: 'Artist defended design decisions.'
        }
      );

      setLastDefenseReply(res.reply);
      setDefenseInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Challenge Submission
  const handleChallengeSubmit = async (textToSend: string) => {
    if (!textToSend.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      playDramatic();
      onExpressionChange('OFFENDED');

      const nextSt = Math.min(5, currentStage + 1) as CriticStage;
      const res = await respondToChallenge(artwork, textToSend.trim(), currentStage, currentCritique);

      onNewExchange(
        {
          id: `ex-${Date.now()}`,
          type: 'challenge',
          userMessage: textToSend.trim(),
          criticReply: res.reply,
          unreliableNote: res.unreliableNote,
          stage: nextSt,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          nextStage: nextSt,
          reason: `Instability escalated to Stage ${nextSt}.`
        }
      );

      onSpeechChange(res.unreliableNote || res.reply.slice(0, 85));
      setLastChallengeReply(res.reply);
      setChallengeInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col anim-step-enter select-none max-w-3xl mx-auto space-y-3 pb-20 sm:pb-8 px-2 sm:px-4">
      {/* Top Banner: Floating Critic & Return to Verdict */}
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
            currentMoodLabel="MOOD: INTERACTION"
            speechText={speechText}
            forcedExpression={forcedExpression}
            onExpressionChange={onExpressionChange}
            onSpeechChange={onSpeechChange}
            theme={theme}
            size="sm"
            showBubble={true}
          />
        </div>
      </div>

      {/* Central Interactive Content */}
      <div className="w-full flex flex-col items-center justify-start my-1 space-y-3">
        {/* MODE 1: DEFEND */}
        {mode === 'DEFEND' && (
          <div
            className="w-full max-w-xl border-2 rounded-2xl p-4 shadow-sticker space-y-3"
            style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 border-b pb-1.5 font-mono text-xs font-bold text-text" style={{ borderColor: 'var(--border)' }}>
              <Shield className="w-4 h-4 text-accent" />
              <span>DEFEND YOUR DESIGN</span>
            </div>

            <p className="font-sans text-xs text-muted leading-relaxed">
              Explain why your composition, hierarchy, or colors were calculated. If your argument holds formal rigor, the critic will reconsider your score.
            </p>

            {lastDefenseReply && (
              <div
                className="p-2.5 rounded-xl border text-xs font-sans leading-relaxed space-y-1"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <span className="font-mono text-[9px] font-bold text-accent block uppercase">
                  CRITIC'S RE-EVALUATION:
                </span>
                <p className="text-text">
                  “{lastDefenseReply}”
                </p>
              </div>
            )}

            <form onSubmit={handleDefendSubmit} className="space-y-2.5">
              <textarea
                rows={3}
                value={defenseInput}
                onChange={(e) => setDefenseInput(e.target.value)}
                placeholder="e.g. 'The off-center weight is intentional tension to counter the heavy sans-serif type...'"
                className="w-full border rounded-xl p-2.5 text-base sm:text-xs font-sans focus:outline-none focus:border-accent"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)'
                }}
              />

              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted">
                  STAGE 0{currentStage} AUTHORITY
                </span>
                <button
                  type="submit"
                  disabled={!defenseInput.trim() || isSubmitting}
                  className="sticker-btn-accent text-xs py-2 px-4 min-h-[40px] flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>EVALUATING...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>[ SUBMIT DEFENSE ]</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODE 2: CHALLENGE */}
        {mode === 'CHALLENGE' && (
          <div
            className="w-full max-w-xl border-2 rounded-2xl p-4 shadow-sticker space-y-3"
            style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 border-b pb-1.5 font-mono text-xs font-bold text-accent" style={{ borderColor: 'var(--border)' }}>
              <Flame className="w-4 h-4" />
              <span>CONFRONT THE CRITIC</span>
            </div>

            <p className="font-sans text-xs text-muted">
              Question his authority or reasoning. Warning: Each confrontation escalates his psychological instability!
            </p>

            {lastChallengeReply && (
              <div
                className="p-2.5 rounded-xl border-2 text-xs font-sans leading-relaxed space-y-1"
                style={{
                  backgroundColor: theme === 'night' ? '#200A0A' : '#FFF5F5',
                  borderColor: 'var(--accent)'
                }}
              >
                <span className="font-mono text-[9px] font-bold text-accent block uppercase">
                  CRITIC'S REACTION:
                </span>
                <p className="text-text font-medium">
                  “{lastChallengeReply}”
                </p>
              </div>
            )}

            {/* Quick Confrontations */}
            <div className="space-y-1.5">
              <span className="font-mono text-[9px] font-bold text-text uppercase block">
                QUICK CONFRONTATIONS:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "You're missing the point.",
                  "Why is the composition weak?",
                  "Explain why this colour fails.",
                  "You're not making any sense."
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => handleChallengeSubmit(promptText)}
                    disabled={isSubmitting}
                    className="sticker-btn text-[10px] py-1.5 px-3 min-h-[36px] hover:border-accent"
                  >
                    “{promptText}”
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="pt-2 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
              <input
                type="text"
                value={challengeInput}
                onChange={(e) => setChallengeInput(e.target.value)}
                placeholder="Draft your custom challenge..."
                className="flex-1 border rounded-xl px-3 py-2 text-base sm:text-xs font-sans focus:outline-none focus:border-accent min-h-[42px]"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleChallengeSubmit(challengeInput);
                  }
                }}
              />
              <button
                onClick={() => handleChallengeSubmit(challengeInput)}
                disabled={!challengeInput.trim() || isSubmitting}
                className="sticker-btn-accent px-4 py-2 text-xs flex items-center justify-center min-h-[42px]"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* MODE 3: BRUTAL TRUTH (STRUCTURED ART DIRECTOR BREAKDOWN) */}
        {mode === 'BRUTAL_TRUTH' && (
          <div
            className="w-full max-w-xl border-2 rounded-2xl p-4 shadow-sticker space-y-3 text-left"
            style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-1.5 font-mono text-xs font-bold text-text" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                <span>THE BRUTAL TRUTH // NO-NONSENSE AUDIT</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted">ART DIRECTOR MODE</span>
                {brutalTruth?.engineSource && (
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                    brutalTruth.engineSource === 'gemini_vision'
                      ? 'text-accent bg-accent/10 border border-accent/20'
                      : 'text-text bg-border/40'
                  }`}>
                    {brutalTruth.engineSource === 'gemini_vision' ? 'AI VISION' : 'CANVAS ENGINE'}
                  </span>
                )}
              </div>
            </div>

            {isSubmitting ? (
              <div className="py-8 text-center font-mono text-xs text-muted flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
                <span>ANALYSING ARTWORK EVIDENCE...</span>
              </div>
            ) : brutalError ? (
              <div className="py-6 flex flex-col items-center text-center gap-2">
                <AlertCircle className="w-5 h-5 text-accent" />
                <p className="font-mono text-xs text-accent">{brutalError}</p>
                <button
                  onClick={handleRetryBrutalTruth}
                  className="sticker-btn-accent text-xs py-1 px-3 mt-1 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>RETRY</span>
                </button>
              </div>
            ) : brutalTruth ? (
              <div className="space-y-3 font-sans text-xs">
                {/* 1. THE HARD TRUTH */}
                <div
                  className="p-3 rounded-xl border-2 space-y-1 shadow-xs"
                  style={{
                    backgroundColor: theme === 'night' ? '#200A0A' : '#FFF5F5',
                    borderColor: 'var(--accent)'
                  }}
                >
                  <span className="font-mono text-[9px] font-bold text-accent uppercase tracking-wider block">
                    THE HARD TRUTH:
                  </span>
                  <p className="font-sans text-xs sm:text-[13px] font-semibold text-text leading-snug">
                    “{brutalTruth.hardTruth}”
                  </p>
                </div>

                {/* 2. THE EVIDENCE */}
                <div className="space-y-1">
                  <span className="font-mono text-[9px] font-bold text-text uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-accent" />
                    THE VISUAL EVIDENCE:
                  </span>
                  <div className="space-y-1">
                    {brutalTruth.evidence.map((ev, i) => (
                      <div
                        key={i}
                        className="border rounded-lg p-2 text-text"
                        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                      >
                        <strong className="font-mono text-[8px] text-muted mr-1.5">0{i + 1}.</strong>
                        {ev}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. WHY IT ISN'T WORKING */}
                <div
                  className="border rounded-xl p-2.5 space-y-0.5"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  <span className="font-mono text-[9px] font-bold text-text uppercase block mb-0.5">
                    WHY IT ISN'T WORKING:
                  </span>
                  <p className="font-sans text-muted leading-relaxed">
                    {brutalTruth.whyItsNotWorking}
                  </p>
                </div>

                {/* 4. WHAT TO FIX FIRST (In order) */}
                <div className="space-y-1">
                  <span className="font-mono text-[9px] font-bold text-accent uppercase flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-accent" />
                    WHAT TO FIX FIRST (IN ORDER OF IMPACT):
                  </span>
                  <div className="space-y-1">
                    {brutalTruth.whatToFixFirst.map((fix, i) => (
                      <div
                        key={i}
                        className="border rounded-lg p-2 text-text"
                        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                      >
                        <strong className="font-mono text-[8px] text-accent mr-1.5">0{i + 1}.</strong>
                        {fix}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. WHAT TO KEEP */}
                <div
                  className="border rounded-xl p-2.5 space-y-0.5"
                  style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
                >
                  <span className="font-mono text-[9px] font-bold text-text uppercase block">
                    WHAT TO KEEP (DO NOT LOSE IN REVISION):
                  </span>
                  <p className="font-sans font-medium text-text">
                    {brutalTruth.whatToKeep}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Bottom Footer: Return link */}
      <div className="shrink-0 pt-2 border-t border-border flex justify-center">
        <button
          onClick={() => { playClick(); onReturnToVerdict(); }}
          className="sticker-btn text-xs py-1 px-4 flex items-center gap-1.5 text-muted hover:text-text"
        >
          <span>[ BACK TO VERDICT ]</span>
        </button>
      </div>
    </div>
  );
};
