import React, { useState } from 'react';
import {
  Artwork,
  CritiqueData,
  CriticStage,
  RedesignDirection,
  BrutalTruthData
} from '../types';
import {
  respondToDefense,
  generateRedesignBrief,
  respondToChallenge,
  generateBrutalTruth
} from '../services/criticEngine';
import { playClick, playPop, playDramatic } from '../utils/soundEffects';
import { CharacterExpression } from './CriticPet';
import { Shield, Layers, Flame, Zap, Send, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface ActionBarProps {
  artwork: Artwork | null;
  currentCritique: CritiqueData | null;
  currentStage: CriticStage;
  onNewExchange: (exchange: any, stageShift?: { nextStage: CriticStage; reason: string }) => void;
  onUpdateVerdictScore: (newScore: number) => void;
  onSetForcedExpression: (expr: CharacterExpression | null) => void;
  onSetSpeechText: (text: string) => void;
  theme?: 'day' | 'night';
}

type ActiveAction = 'none' | 'defend' | 'redesign' | 'challenge' | 'brutal_truth';

export const ActionBar: React.FC<ActionBarProps> = ({
  artwork,
  currentCritique,
  currentStage,
  onNewExchange,
  onUpdateVerdictScore,
  onSetForcedExpression,
  onSetSpeechText,
  theme = 'day'
}) => {
  const [activeModal, setActiveModal] = useState<ActiveAction>('none');
  const [defenseInput, setDefenseInput] = useState<string>('');
  const [challengeInput, setChallengeInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [redesignBriefs, setRedesignBriefs] = useState<RedesignDirection[] | null>(null);
  const [brutalTruth, setBrutalTruth] = useState<BrutalTruthData | null>(null);

  // Close modals on Escape key
  React.useEffect(() => {
    if (activeModal === 'none') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal('none');
        onSetForcedExpression(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, onSetForcedExpression]);

  // 1. Defend My Art
  const handleDefendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defenseInput.trim() || !artwork || !currentCritique || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await respondToDefense(
        artwork,
        defenseInput.trim(),
        currentStage,
        currentCritique
      );

      if (res.verdictReconsidered && res.updatedVerdictScore) {
        onUpdateVerdictScore(res.updatedVerdictScore);
        onSetForcedExpression('CONFUSED');
        setTimeout(() => onSetForcedExpression('IMPRESSED'), 600);
        setTimeout(() => onSetForcedExpression(null), 3000);
        onSetSpeechText("That is... annoyingly reasonable.");
      } else {
        onSetForcedExpression('SUSPICIOUS');
        setTimeout(() => onSetForcedExpression(null), 3000);
        onSetSpeechText(res.unreliableNote || "Your rationale does not alter the optical physics.");
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
          reason: 'Artist mounted formal defense; critic tested.'
        }
      );

      setDefenseInput('');
      setActiveModal('none');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Request a Redesign
  const handleOpenRedesign = async () => {
    if (!artwork) return;
    playClick();
    setActiveModal('redesign');
    onSetForcedExpression('CONFUSED');
    onSetSpeechText("Let us restructure.");
    setTimeout(() => onSetForcedExpression(null), 2500);

    if (redesignBriefs) return;

    try {
      setIsSubmitting(true);
      const briefs = await generateRedesignBrief(artwork, currentStage);
      setRedesignBriefs(briefs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Challenge the Critic
  const handleChallengeSubmit = async (customText?: string) => {
    const textToSend = customText || challengeInput;
    if (!textToSend.trim() || !artwork || isSubmitting) return;

    try {
      setIsSubmitting(true);
      playDramatic();
      onSetForcedExpression('OFFENDED');
      setTimeout(() => onSetForcedExpression('SHOCKED'), 500);
      setTimeout(() => onSetForcedExpression(null), 3200);

      const nextSt = Math.min(5, currentStage + 1) as CriticStage;
      const res = await respondToChallenge(artwork, textToSend.trim(), currentStage);

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
          reason: `Interrogative pressure escalated instability to Stage ${nextSt}.`
        }
      );

      onSetSpeechText(res.unreliableNote || res.reply.slice(0, 85));
      setChallengeInput('');
      setActiveModal('none');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Brutal Truth
  const handleOpenBrutalTruth = async () => {
    if (!artwork) return;
    playClick();
    setActiveModal('brutal_truth');
    onSetForcedExpression('PROUD');
    onSetSpeechText("Unfiltered reality.");
    setTimeout(() => onSetForcedExpression(null), 2500);

    if (brutalTruth) return;

    try {
      setIsSubmitting(true);
      const truth = await generateBrutalTruth(artwork);
      setBrutalTruth(truth);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = !artwork || !currentCritique;

  return (
    <>
      {/* Permanent Fixed Action Bar at Bottom of Viewport */}
      <footer
        className="h-12 shrink-0 border-t px-3 sm:px-6 flex items-center justify-between z-20 select-none"
        style={{
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2.5 w-full justify-center sm:justify-start">
          <button
            onClick={() => { playClick(); setActiveModal('defend'); onSetForcedExpression('CURIOUS'); }}
            disabled={isDisabled}
            className={`sticker-btn text-[10px] py-1 px-2 sm:px-3 ${
              isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-accent'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-accent" />
            <span>[ DEFEND ]</span>
          </button>

          <button
            onClick={handleOpenRedesign}
            disabled={isDisabled}
            className={`sticker-btn text-[10px] py-1 px-2 sm:px-3 ${
              isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-accent'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-accent" />
            <span>[ REDESIGN ]</span>
          </button>

          <button
            onClick={() => { playClick(); setActiveModal('challenge'); onSetForcedExpression('SUSPICIOUS'); }}
            disabled={isDisabled}
            className={`sticker-btn text-[10px] py-1 px-2 sm:px-3 ${
              isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-accent'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-accent" />
            <span>[ CHALLENGE ]</span>
          </button>

          <button
            onClick={handleOpenBrutalTruth}
            disabled={isDisabled}
            className={`sticker-btn text-[10px] py-1 px-2 sm:px-3 ${
              isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-accent'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-text" />
            <span>[ BRUTAL TRUTH ]</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-1 font-mono text-[9px] text-muted shrink-0">
          <span>ZERO SCROLL VIEWPORT</span>
        </div>
      </footer>

      {/* COMPACT MODALS / OVERLAYS */}

      {/* 1. DEFEND MY ART MODAL */}
      {activeModal === 'defend' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md border-2 rounded-2xl p-4 shadow-sticker-lg anim-pop-in space-y-3"
            style={{
              backgroundColor: 'var(--panel)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-center justify-between border-b pb-1.5 font-mono text-xs" style={{ borderColor: 'var(--border)' }}>
              <span className="font-bold flex items-center gap-1.5 text-text">
                <Shield className="w-3.5 h-3.5 text-accent" />
                DEFEND YOUR DESIGN
              </span>
              <button
                onClick={() => { playClick(); setActiveModal('none'); onSetForcedExpression(null); }}
                className="text-muted hover:text-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-sans text-[11px] text-muted leading-relaxed">
              Explain why your composition or colors were calculated. If your argument holds formal rigor, the critic will reconsider your score!
            </p>

            <form onSubmit={handleDefendSubmit} className="space-y-2.5">
              <textarea
                rows={3}
                value={defenseInput}
                onChange={(e) => setDefenseInput(e.target.value)}
                placeholder="e.g. 'The off-center weight is intentional dissonance to express tension...'"
                className="w-full border rounded-xl p-2.5 text-xs font-sans focus:outline-none focus:border-accent"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)'
                }}
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { playClick(); setActiveModal('none'); onSetForcedExpression(null); }}
                  className="font-mono text-xs text-muted hover:text-text"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={!defenseInput.trim() || isSubmitting}
                  className="sticker-btn-accent text-xs py-1 px-3.5"
                >
                  {isSubmitting ? 'TRANSMITTING...' : '[ SUBMIT DEFENSE ]'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. REDESIGN IT MODAL */}
      {activeModal === 'redesign' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-2xl border-2 rounded-2xl p-4 shadow-sticker-lg anim-pop-in space-y-3 max-h-[85dvh] flex flex-col"
            style={{
              backgroundColor: 'var(--panel)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-center justify-between border-b pb-1.5 font-mono text-xs shrink-0" style={{ borderColor: 'var(--border)' }}>
              <span className="font-bold flex items-center gap-1.5 text-text">
                <Layers className="w-3.5 h-3.5 text-accent" />
                THREE CREATIVE DIRECTIONS
              </span>
              <button
                onClick={() => { playClick(); setActiveModal('none'); onSetForcedExpression(null); }}
                className="text-muted hover:text-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isSubmitting || !redesignBriefs ? (
              <div className="py-12 text-center font-mono text-xs text-muted">
                <div className="w-3 h-3 rounded-full bg-accent mx-auto mb-2 animate-ping" />
                <span>FORMULATING 3 STUDIO BRIEFS...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 overflow-y-auto panel-scroll flex-1 pr-1">
                {redesignBriefs.map((b) => (
                  <div
                    key={b.number}
                    className="border rounded-xl p-2.5 space-y-1.5 hover:border-accent transition-colors"
                    style={{
                      backgroundColor: 'var(--bg)',
                      borderColor: 'var(--border)'
                    }}
                  >
                    <span className="font-mono text-[9px] font-bold text-accent block">
                      {b.number} // {b.code}
                    </span>
                    <h5 className="font-serif text-xs font-bold text-text leading-snug">
                      {b.title}
                    </h5>
                    <p className="font-sans text-[10px] text-muted leading-relaxed">
                      {b.concept}
                    </p>
                    <div className="pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                      <span className="font-mono text-[8px] font-bold text-text block mb-0.5">
                        ACTION STEPS:
                      </span>
                      <ul className="text-[9px] space-y-0.5 text-text font-sans">
                        {b.actionableSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-accent font-mono">›</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. CHALLENGE THE CRITIC MODAL */}
      {activeModal === 'challenge' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md border-2 rounded-2xl p-4 shadow-sticker-lg anim-pop-in space-y-3"
            style={{
              backgroundColor: 'var(--panel)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-center justify-between border-b pb-1.5 font-mono text-xs" style={{ borderColor: 'var(--border)' }}>
              <span className="font-bold flex items-center gap-1.5 text-accent">
                <Flame className="w-3.5 h-3.5" />
                CONFRONT THE CRITIC
              </span>
              <button
                onClick={() => { playClick(); setActiveModal('none'); onSetForcedExpression(null); }}
                className="text-muted hover:text-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-sans text-[11px] text-muted">
              Question his authority or reasoning. Warning: Each confrontation escalates his instability toward complete breakdown!
            </p>

            {/* Quick Challenge Chips */}
            <div className="space-y-1">
              <span className="font-mono text-[8px] font-bold text-text block uppercase">
                QUICK CONFRONTATIONS:
              </span>
              <div className="flex flex-wrap gap-1">
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
                    className="sticker-btn text-[9px] py-0.5 px-1.5 hover:border-accent"
                  >
                    “{promptText}”
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="pt-1.5 border-t space-y-1.5" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={challengeInput}
                  onChange={(e) => setChallengeInput(e.target.value)}
                  placeholder="Draft your own challenge..."
                  className="flex-1 border rounded-xl px-2.5 py-1 text-xs font-sans focus:outline-none focus:border-accent"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleChallengeSubmit();
                    }
                  }}
                />
                <button
                  onClick={() => handleChallengeSubmit()}
                  disabled={!challengeInput.trim() || isSubmitting}
                  className="sticker-btn-accent px-2.5 py-1 text-xs"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. BRUTAL TRUTH MODAL */}
      {activeModal === 'brutal_truth' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-lg border-2 rounded-2xl p-4 shadow-sticker-lg anim-pop-in space-y-3 max-h-[85dvh] overflow-y-auto panel-scroll"
            style={{
              backgroundColor: 'var(--panel)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-center justify-between border-b pb-1.5 font-mono text-xs" style={{ borderColor: 'var(--border)' }}>
              <span className="font-bold flex items-center gap-1.5 text-text">
                <Zap className="w-3.5 h-3.5 text-accent" />
                THE BRUTAL TRUTH (ART DIRECTOR MODE)
              </span>
              <button
                onClick={() => { playClick(); setActiveModal('none'); onSetForcedExpression(null); }}
                className="text-muted hover:text-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isSubmitting || !brutalTruth ? (
              <div className="py-12 text-center font-mono text-xs text-muted">
                <div className="w-3 h-3 rounded-full bg-text mx-auto mb-2 animate-ping" />
                <span>EXTRACTING UNVARNISHED DESIGN TRUTH...</span>
              </div>
            ) : (
              <div className="space-y-3 font-sans text-xs">
                {/* 3 Strengths */}
                <div className="space-y-1">
                  <span className="font-mono text-[9px] font-bold text-text uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-text" />
                    THREE STRONGEST ELEMENTS:
                  </span>
                  <div className="space-y-1">
                    {(brutalTruth.strongestElements || []).map((el, i) => (
                      <div
                        key={i}
                        className="border rounded-lg p-2 text-text"
                        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                      >
                        <strong className="font-mono text-[8px] text-muted mr-1.5">0{i + 1}.</strong>
                        {el}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3 Improvements */}
                <div className="space-y-1">
                  <span className="font-mono text-[9px] font-bold text-accent uppercase flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-accent" />
                    THREE KEY IMPROVEMENTS:
                  </span>
                  <div className="space-y-1">
                    {(brutalTruth.keyImprovements || []).map((imp, i) => (
                      <div
                        key={i}
                        className="border rounded-lg p-2 text-text"
                        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                      >
                        <strong className="font-mono text-[8px] text-accent mr-1.5">0{i + 1}.</strong>
                        {imp}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Highest impact change */}
                <div
                  className="border-2 rounded-xl p-2.5 space-y-0.5"
                  style={{
                    backgroundColor: theme === 'night' ? '#200A0A' : '#FFF5F5',
                    borderColor: 'var(--accent)'
                  }}
                >
                  <span className="font-mono text-[9px] font-bold text-accent uppercase block">
                    HIGHEST IMPACT CHANGE:
                  </span>
                  <p className="font-sans font-semibold text-xs text-text">
                    {brutalTruth.highestImpactChange}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
