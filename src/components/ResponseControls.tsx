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
import {
  Shield,
  Layers,
  Flame,
  Zap,
  Send,
  CornerDownRight,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

interface ResponseControlsProps {
  artwork: Artwork;
  currentCritique: CritiqueData;
  currentStage: CriticStage;
  onNewExchange: (exchange: any, stageShift?: { nextStage: CriticStage; reason: string }) => void;
  onUpdateVerdictScore: (newScore: number) => void;
}

type ActiveTab = 'none' | 'defend' | 'redesign' | 'challenge' | 'brutal_truth';

export const ResponseControls: React.FC<ResponseControlsProps> = ({
  artwork,
  currentCritique,
  currentStage,
  onNewExchange,
  onUpdateVerdictScore
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('none');
  const [defenseInput, setDefenseInput] = useState<string>('');
  const [challengeInput, setChallengeInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Redesign state
  const [redesignBriefs, setRedesignBriefs] = useState<RedesignDirection[] | null>(null);

  // Brutal truth state
  const [brutalTruth, setBrutalTruth] = useState<BrutalTruthData | null>(null);

  // Last action feedback banner
  const [lastFeedback, setLastFeedback] = useState<{
    title: string;
    text: string;
    unreliable?: string;
    verdictShift?: string;
  } | null>(null);

  // 1. Defend My Design submission
  const handleDefendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defenseInput.trim() || isSubmitting) return;

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
      }

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
          nextStage: Math.min(5, currentStage + 1) as CriticStage,
          reason: 'Artist mounted formal defense; critic cognitive resistance stimulated.'
        }
      );

      setLastFeedback({
        title: res.verdictReconsidered ? 'DEFENSE ACKNOWLEDGED (INDEX REVISED)' : 'DEFENSE DISMISSED',
        text: res.reply,
        unreliable: res.unreliableNote,
        verdictShift: res.verdictReconsidered
          ? `Score revised to ${res.updatedVerdictScore}/10`
          : undefined
      });

      setDefenseInput('');
      setActiveTab('none');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Request a Redesign
  const handleRequestRedesign = async () => {
    setActiveTab('redesign');
    if (redesignBriefs) return; // already loaded

    try {
      setIsSubmitting(true);
      const briefs = await generateRedesignBrief(artwork, currentStage);
      setRedesignBriefs(briefs);

      onNewExchange({
        id: `ex-${Date.now()}`,
        type: 'redesign',
        criticReply: 'Three distinct directional briefs formulated for studio execution.',
        data: briefs,
        stage: currentStage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Challenge the Critic submission
  const handleChallengeSubmit = async (challengeText?: string) => {
    const textToSend = challengeText || challengeInput;
    if (!textToSend.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await respondToChallenge(artwork, textToSend.trim(), currentStage);

      const nextSt = Math.min(5, currentStage + 1) as CriticStage;

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
          reason: `Interrogative pressure escalated critic instability to Stage ${nextSt}.`
        }
      );

      setLastFeedback({
        title: 'CRITIC COUNTER-ARGUMENT',
        text: res.reply,
        unreliable: res.unreliableNote
      });

      setChallengeInput('');
      setActiveTab('none');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Show Me The Brutal Truth
  const handleShowBrutalTruth = async () => {
    setActiveTab('brutal_truth');
    if (brutalTruth) return;

    try {
      setIsSubmitting(true);
      const truth = await generateBrutalTruth(artwork);
      setBrutalTruth(truth);

      onNewExchange({
        id: `ex-${Date.now()}`,
        type: 'brutal_truth',
        criticReply: 'Direct art-director assessment delivered. Pretense suspended.',
        data: truth,
        stage: currentStage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pt-6 border-t border-[#292929]">
      <div className="space-y-1">
        <div className="font-mono text-xs text-[#D71920] uppercase tracking-widest flex items-center gap-2">
          <span>SECTION 03</span>
          <span className="text-[#292929]">/</span>
          <span>INTERACTION & INTERROGATION</span>
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F5F5]">
          CHALLENGE THE VERDICT
        </h3>
        <p className="font-mono text-xs text-[#929292]">
          Select an interactive action to cross-examine or dismantle the critic's authority.
        </p>
      </div>

      {/* 4 Interactive Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab(activeTab === 'defend' ? 'none' : 'defend')}
          className={`btn-secondary justify-start px-4 py-3 text-left ${
            activeTab === 'defend' ? 'border-[#D71920] text-[#D71920]' : ''
          }`}
        >
          <Shield className="w-4 h-4 text-[#D71920] shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold">[ DEFEND MY DESIGN ]</span>
            <span className="text-[10px] text-[#929292] normal-case tracking-normal">
              Explain artistic rationale and appeal the score
            </span>
          </div>
        </button>

        <button
          onClick={handleRequestRedesign}
          className={`btn-secondary justify-start px-4 py-3 text-left ${
            activeTab === 'redesign' ? 'border-[#D71920] text-[#D71920]' : ''
          }`}
        >
          <Layers className="w-4 h-4 text-[#D71920] shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold">[ REQUEST A REDESIGN ]</span>
            <span className="text-[10px] text-[#929292] normal-case tracking-normal">
              Receive 3 alternative creative directions
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'challenge' ? 'none' : 'challenge')}
          className={`btn-secondary justify-start px-4 py-3 text-left ${
            activeTab === 'challenge' ? 'border-[#D71920] text-[#D71920]' : ''
          }`}
        >
          <Flame className="w-4 h-4 text-[#D71920] shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold">[ CHALLENGE THE CRITIC ]</span>
            <span className="text-[10px] text-[#929292] normal-case tracking-normal">
              Question reasoning and escalate absurdity
            </span>
          </div>
        </button>

        <button
          onClick={handleShowBrutalTruth}
          className={`btn-secondary justify-start px-4 py-3 text-left ${
            activeTab === 'brutal_truth' ? 'border-[#D71920] text-[#D71920]' : ''
          }`}
        >
          <Zap className="w-4 h-4 text-[#D71920] shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold">[ SHOW ME THE BRUTAL TRUTH ]</span>
            <span className="text-[10px] text-[#929292] normal-case tracking-normal">
              Direct art-director persona (zero unreliability)
            </span>
          </div>
        </button>
      </div>

      {/* Feedback banner from last exchange */}
      {lastFeedback && activeTab === 'none' && (
        <div className="border border-[#292929] bg-[#070707] p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#292929] pb-2 font-mono text-xs">
            <span className="text-[#D71920] font-bold">{lastFeedback.title}</span>
            {lastFeedback.verdictShift && (
              <span className="text-[#F5F5F5] bg-[#111111] px-2 py-0.5 border border-[#292929]">
                {lastFeedback.verdictShift}
              </span>
            )}
          </div>
          <p className="font-sans text-sm text-[#F5F5F5] leading-relaxed">
            {lastFeedback.text}
          </p>
          {lastFeedback.unreliable && (
            <div className="pt-2 border-t border-[#292929]">
              <div className="font-mono text-[10px] text-[#D71920] uppercase font-bold mb-1">
                UNRELIABLE OPINION
              </div>
              <blockquote className="font-serif italic text-sm text-[#D71920] pl-3 border-l border-[#D71920]">
                “{lastFeedback.unreliable}”
              </blockquote>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: DEFEND MY DESIGN */}
      {activeTab === 'defend' && (
        <div className="border border-[#D71920] bg-black p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#292929] pb-3">
            <h4 className="font-mono text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#D71920]" />
              SUBMIT FORMAL DEFENSE
            </h4>
            <span className="font-mono text-[10px] text-[#929292]">APPEAL PROTOCOL</span>
          </div>

          <p className="font-mono text-xs text-[#929292]">
            Articulate why your design choices (composition, colors, contrast, typography) were intentional. If your argument holds formal rigor, the critic will reconsider the verdict.
          </p>

          <form onSubmit={handleDefendSubmit} className="space-y-4">
            <textarea
              rows={4}
              value={defenseInput}
              onChange={(e) => setDefenseInput(e.target.value)}
              placeholder="e.g. 'The off-center subject was intended to evoke psychological imbalance for a dystopian album, and the high contrast serves immediate thumbnail recognition...'"
              className="w-full bg-[#080808] border border-[#292929] p-3 text-xs sm:text-sm text-[#F5F5F5] font-sans focus:border-[#D71920] focus:outline-none transition-colors"
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('none')}
                className="font-mono text-xs text-[#929292] hover:text-[#F5F5F5]"
              >
                CANCEL
              </button>

              <button
                type="submit"
                disabled={!defenseInput.trim() || isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? 'TRANSMITTING DEFENSE...' : '[ SUBMIT DEFENSE ]'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: REQUEST A REDESIGN */}
      {activeTab === 'redesign' && (
        <div className="border border-[#292929] bg-black p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#292929] pb-3">
            <h4 className="font-mono text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D71920]" />
              THREE ALTERNATIVE CREATIVE DIRECTIONS
            </h4>
            <button
              onClick={() => setActiveTab('none')}
              className="font-mono text-xs text-[#929292] hover:text-[#F5F5F5]"
            >
              CLOSE
            </button>
          </div>

          {isSubmitting || !redesignBriefs ? (
            <div className="py-12 text-center font-mono text-xs text-[#929292] space-y-2">
              <div className="w-2 h-2 mx-auto rounded-full bg-[#D71920] animate-ping" />
              <p>THE CRITIC IS DRAFTING THREE STUDIO BRIEFS...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {redesignBriefs.map((b) => (
                <div
                  key={b.number}
                  className="border border-[#292929] bg-[#060606] p-4 sm:p-5 space-y-4 hover:border-[#D71920] transition-colors"
                >
                  <div className="border-b border-[#292929] pb-3">
                    <span className="font-mono text-xs text-[#D71920] font-bold">
                      {b.number} // {b.code}
                    </span>
                    <h5 className="font-serif text-lg font-bold text-[#F5F5F5] mt-1">
                      {b.title}
                    </h5>
                  </div>

                  <div className="space-y-3 font-sans text-xs text-[#929292]">
                    <div>
                      <strong className="font-mono text-[10px] text-[#F5F5F5] uppercase block">
                        CONCEPT
                      </strong>
                      <p className="mt-0.5 leading-relaxed text-[#F5F5F5]">{b.concept}</p>
                    </div>

                    <div>
                      <strong className="font-mono text-[10px] text-[#F5F5F5] uppercase block">
                        COLOUR TREATMENT
                      </strong>
                      <p className="mt-0.5 leading-relaxed">{b.colourTreatment}</p>
                    </div>

                    <div>
                      <strong className="font-mono text-[10px] text-[#F5F5F5] uppercase block">
                        COMPOSITION
                      </strong>
                      <p className="mt-0.5 leading-relaxed">{b.composition}</p>
                    </div>

                    {b.typography && (
                      <div>
                        <strong className="font-mono text-[10px] text-[#F5F5F5] uppercase block">
                          TYPOGRAPHY
                        </strong>
                        <p className="mt-0.5 leading-relaxed">{b.typography}</p>
                      </div>
                    )}

                    <div>
                      <strong className="font-mono text-[10px] text-[#F5F5F5] uppercase block">
                        TEXTURE & EFFECTS
                      </strong>
                      <p className="mt-0.5 leading-relaxed">{b.textureAndEffects}</p>
                    </div>

                    <div className="pt-2 border-t border-[#292929]">
                      <strong className="font-mono text-[10px] text-[#D71920] uppercase block">
                        ACTIONABLE STEPS:
                      </strong>
                      <ul className="mt-1 space-y-1 text-[11px] text-[#F5F5F5]">
                        {b.actionableSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#D71920] font-mono">›</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CHALLENGE THE CRITIC */}
      {activeTab === 'challenge' && (
        <div className="border border-[#D71920] bg-black p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#292929] pb-3">
            <h4 className="font-mono text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#D71920]" />
              INTERROGATE THE CRITIC
            </h4>
            <span className="font-mono text-[10px] text-[#D71920]">
              WARNING: ACCELERATES INSTABILITY
            </span>
          </div>

          {/* Quick challenge prompt buttons */}
          <div>
            <span className="block font-mono text-[10px] text-[#929292] uppercase mb-2">
              QUICK CHALLENGE PROMPTS (CLICK TO FIRE):
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                'Why do you think the composition is weak?',
                "You're missing the point.",
                "Explain why this colour doesn't work.",
                'I did that intentionally.',
                "You're not making any sense."
              ].map((promptText) => (
                <button
                  key={promptText}
                  onClick={() => handleChallengeSubmit(promptText)}
                  disabled={isSubmitting}
                  className="font-mono text-xs border border-[#292929] px-2.5 py-1.5 text-[#F5F5F5] hover:border-[#D71920] hover:text-[#D71920] transition-colors"
                >
                  “{promptText}”
                </button>
              ))}
            </div>
          </div>

          {/* Custom challenge input */}
          <div className="space-y-3 pt-2 border-t border-[#292929]">
            <span className="block font-mono text-[10px] text-[#929292] uppercase">
              OR DRAFT A CUSTOM CONFRONTATION:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={challengeInput}
                onChange={(e) => setChallengeInput(e.target.value)}
                placeholder="Question the critic's qualifications or logic..."
                className="flex-1 bg-[#080808] border border-[#292929] px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F5F5] font-sans focus:border-[#D71920] focus:outline-none transition-colors"
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
                className="btn-primary px-4"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-[#929292]">
            <span>Continuous conversation supported.</span>
            <button onClick={() => setActiveTab('none')} className="hover:text-[#F5F5F5]">
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: SHOW ME THE BRUTAL TRUTH */}
      {activeTab === 'brutal_truth' && (
        <div className="border-2 border-[#F5F5F5] bg-[#050505] p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-[#292929] pb-3">
            <div>
              <span className="font-mono text-[10px] text-[#929292] uppercase tracking-widest">
                PERSONA OVERRIDE: SENIOR ART DIRECTOR
              </span>
              <h4 className="font-mono text-base font-bold text-[#F5F5F5] uppercase tracking-wider">
                THE BRUTAL TRUTH
              </h4>
            </div>

            <button
              onClick={() => setActiveTab('none')}
              className="font-mono text-xs text-[#929292] hover:text-[#F5F5F5]"
            >
              CLOSE
            </button>
          </div>

          {isSubmitting || !brutalTruth ? (
            <div className="py-12 text-center font-mono text-xs text-[#929292] space-y-2">
              <div className="w-2 h-2 mx-auto rounded-full bg-[#F5F5F5] animate-ping" />
              <p>EXTRACTING OBJECTIVE DESIGN TRUTH...</p>
            </div>
          ) : (
            <div className="space-y-6 font-sans">
              {/* Three Strongest Elements */}
              <div className="space-y-2">
                <span className="font-mono text-xs text-[#F5F5F5] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#F5F5F5]" />
                  THREE STRONGEST ELEMENTS:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(brutalTruth.strongestElements || []).map((el, i) => (
                    <div key={i} className="border border-[#292929] p-3 text-xs text-[#F5F5F5]">
                      <span className="font-mono text-[10px] text-[#929292] block mb-1">
                        STRENGTH 0{i + 1}
                      </span>
                      {el}
                    </div>
                  ))}
                </div>
              </div>

              {/* Three Key Improvements */}
              <div className="space-y-2">
                <span className="font-mono text-xs text-[#F5F5F5] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-[#D71920]" />
                  THREE MOST IMPORTANT IMPROVEMENTS:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(brutalTruth.keyImprovements || []).map((imp, i) => (
                    <div key={i} className="border border-[#292929] p-3 text-xs text-[#F5F5F5]">
                      <span className="font-mono text-[10px] text-[#929292] block mb-1">
                        IMPROVEMENT 0{i + 1}
                      </span>
                      {imp}
                    </div>
                  ))}
                </div>
              </div>

              {/* Highest Impact Change First */}
              <div className="border border-[#D71920] bg-black p-4 space-y-1.5">
                <span className="font-mono text-xs text-[#D71920] uppercase font-bold tracking-wider block">
                  HIGHEST-IMPACT CHANGE (EXECUTE FIRST):
                </span>
                <p className="text-sm sm:text-base text-[#F5F5F5] font-semibold">
                  {brutalTruth.highestImpactChange}
                </p>
              </div>

              {/* Director Notes */}
              <div className="text-xs text-[#929292] italic border-t border-[#292929] pt-3">
                <span className="font-mono not-italic text-[#F5F5F5] mr-2">DIRECTOR'S NOTE:</span>
                “{brutalTruth.directorNotes}”
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
