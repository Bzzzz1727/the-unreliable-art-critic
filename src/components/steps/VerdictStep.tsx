import React, { useState, useRef, useEffect } from 'react';
import { Artwork, CritiqueData, CriticStage, CritiqueCategoryItem } from '../../types';
import { CriticPet, CharacterExpression } from '../CriticPet';
import { playClick } from '../../utils/soundEffects';
import { FileText, AlertTriangle, Shield, Flame, Layers, Zap, PlusCircle, CheckCircle2, AlertCircle, Loader2, Sparkles, Cpu } from 'lucide-react';

interface VerdictStepProps {
  artwork: Artwork;
  critique: CritiqueData;
  currentStage: CriticStage;
  speechText: string;
  forcedExpression: CharacterExpression | null;
  onExpressionChange: (expr: CharacterExpression) => void;
  onSpeechChange: (speech: string) => void;
  onOpenDossier: () => void;
  onSelectAction: (action: 'DEFEND' | 'CHALLENGE' | 'BRUTAL_TRUTH' | 'REDESIGN') => void;
  onNewArtwork: () => void;
  isBrutalTruthLoading?: boolean;
  brutalTruthError?: string | null;
  onRetryBrutalTruth?: () => void;
  theme?: 'day' | 'night';
  onOpenSettings?: () => void;
}

export const VerdictStep: React.FC<VerdictStepProps> = ({
  artwork,
  critique,
  currentStage,
  speechText,
  forcedExpression,
  onExpressionChange,
  onSpeechChange,
  onOpenDossier,
  onSelectAction,
  onNewArtwork,
  isBrutalTruthLoading = false,
  brutalTruthError = null,
  onRetryBrutalTruth,
  theme = 'day',
  onOpenSettings
}) => {
  const [activeTab, setActiveTab] = useState<'comp' | 'col' | 'type' | 'conc'>('comp');

  // Scroll to top on fresh artwork critique load only (never on tab switch)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [critique.generatedAt]);

  // Category item determination
  let currentCategory: CritiqueCategoryItem = critique.composition;
  if (activeTab === 'col') currentCategory = critique.colourAndTexture;
  else if (activeTab === 'type' && critique.typography) currentCategory = critique.typography;
  else if (activeTab === 'conc') currentCategory = critique.concept;

  return (
    <div className="w-full flex flex-col items-center anim-step-enter select-none max-w-2xl mx-auto space-y-3 pb-12 px-2 sm:px-4">
      {/* Top Banner: Floating Compact Critic & Framed Artwork Thumbnail */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-border">
        {/* Compact Critic */}
        <div className="flex items-center gap-3">
          <CriticPet
            currentStage={currentStage}
            currentMoodLabel="MOOD: OPINIONATED"
            speechText={speechText || (critique.verdict.overallScore >= 8 ? "Unfortunately, I respect this." : "We need to discuss your margins.")}
            forcedExpression={forcedExpression}
            onExpressionChange={onExpressionChange}
            onSpeechChange={onSpeechChange}
            theme={theme}
            size="sm"
            showBubble={true}
          />
        </div>

        {/* Compact Artwork Thumbnail with Category & Engine Source */}
        <div
          className="flex items-center gap-2 p-1.5 rounded-xl border shadow-sticker"
          style={{
            backgroundColor: 'var(--panel)',
            borderColor: 'var(--border)'
          }}
        >
          <img
            src={artwork.dataUrl}
            alt={artwork.fileName}
            className="artwork-preserve w-10 h-10 object-contain rounded-md border"
            style={{ borderColor: 'var(--border)' }}
          />
          <div className="font-mono text-[10px] hidden sm:block text-left pr-1">
            <span className="block font-bold text-text truncate max-w-[120px]">{artwork.fileName}</span>
            <div className="flex items-center gap-1.5 text-muted">
              <span>{artwork.category}</span>
              <span>•</span>
              <span className={`inline-flex items-center gap-1 px-1 py-0.2 rounded text-[8px] font-bold ${
                critique.engineSource === 'gemini_vision'
                  ? 'text-accent bg-accent/10 border border-accent/20'
                  : 'text-text bg-border/40'
              }`}>
                {critique.engineSource === 'gemini_vision' ? 'AI VISION' : 'CANVAS ENGINE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Engine Status / API Error Alert Banner */}
      {critique.apiError ? (
        <div
          className="w-full max-w-xl p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono shadow-xs"
          style={{
            backgroundColor: theme === 'night' ? '#200A0A' : '#FFF5F5',
            borderColor: 'var(--accent)',
            color: 'var(--accent)'
          }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-accent" />
            <span className="leading-tight">
              <strong>Gemini API Notice:</strong> {critique.apiError}
              <span className="block text-[10px] opacity-80 font-sans">Displaying analysis from Local Canvas Telemetry Engine.</span>
            </span>
          </div>
          {onOpenSettings && (
            <button
              onClick={() => { playClick(); onOpenSettings(); }}
              className="sticker-btn text-[10px] py-1 px-2.5 shrink-0 text-accent hover:border-accent ml-2"
            >
              [ SETTINGS ⚙ ]
            </button>
          )}
        </div>
      ) : critique.engineSource === 'autonomous_heuristic' ? (
        <div
          className="w-full max-w-xl p-2 rounded-xl border flex items-center justify-between text-[11px] font-mono shadow-xs"
          style={{
            backgroundColor: 'var(--panel)',
            borderColor: 'var(--border)',
            color: 'var(--muted)'
          }}
        >
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-muted shrink-0" />
            <span>Autonomous Canvas Telemetry active (Offline Fallback Engine).</span>
          </div>
          {onOpenSettings && (
            <button
              onClick={() => { playClick(); onOpenSettings(); }}
              className="sticker-btn text-[9px] py-0.5 px-2 text-text shrink-0 ml-1.5"
            >
              [ ENGINE ⚙ ]
            </button>
          )}
        </div>
      ) : null}

      {/* Prominent Score Stamp (Always visible & anchored) */}
      <div className="w-full flex flex-col items-center gap-1 pt-1 anim-score-slam">
        <div
          className="px-4 py-1 rounded-2xl border-2 shadow-sticker flex items-baseline gap-1.5"
          style={{
            backgroundColor: 'var(--accent)',
            borderColor: 'var(--border)',
            color: '#FFFFFF'
          }}
        >
          <span className="font-mono text-3xl sm:text-4xl font-black tracking-tight leading-none">
            {critique.verdict.overallScore}
          </span>
          <span className="font-mono text-sm font-bold opacity-80">/ 10</span>
        </div>
        {critique.verdict.scoreReason && (
          <p className="font-sans text-xs text-muted max-w-lg text-center leading-snug px-2">
            {critique.verdict.scoreReason}
          </p>
        )}
      </div>

      {/* First Impression Headline */}
      <div
        className="w-full max-w-xl border rounded-xl p-2.5 text-center shadow-xs"
        style={{
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--border)'
        }}
      >
        <span className="font-mono text-[9px] font-bold text-muted uppercase tracking-wider block mb-0.5">
          FIRST IMPRESSION
        </span>
        <p className="font-sans text-xs sm:text-sm font-semibold text-text leading-snug">
          “{critique.firstImpression?.professional || critique.verdict.firstImpression || critique.verdict.professional}”
        </p>
      </div>

      {/* Structured Summary: What Works & Biggest Problem */}
      <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
        {/* What Works */}
        <div
          className="border rounded-xl p-2.5 space-y-1 shadow-xs"
          style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-1 font-mono text-[9px] font-bold text-text uppercase">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
            <span>WHAT WORKS:</span>
          </div>
          <p className="font-sans text-[11px] text-text leading-relaxed">
            {critique.whatWorks?.evidence || critique.verdict.whatWorks || "Strong overall graphic foundation and color relationships."}
          </p>
        </div>

        {/* Biggest Problem */}
        <div
          className="border rounded-xl p-2.5 space-y-1 shadow-xs"
          style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-1 font-mono text-[9px] font-bold text-accent uppercase">
            <AlertCircle className="w-3.5 h-3.5 text-accent" />
            <span>BIGGEST PROBLEM:</span>
          </div>
          <p className="font-sans text-[11px] text-text leading-relaxed">
            {critique.biggestProblem?.evidence
              ? `${critique.biggestProblem.evidence} ${critique.biggestProblem.consequence || ''}`
              : critique.verdict.biggestProblem || "Visual hierarchy competes for initial viewer attention."}
          </p>
        </div>
      </div>

      {/* What To Preserve */}
      {(critique.whatToPreserve || critique.verdict.whatToPreserve) && (
        <div
          className="w-full max-w-xl border rounded-xl p-2.5 space-y-0.5 shadow-xs"
          style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-1 font-mono text-[9px] font-bold text-text uppercase">
            <Sparkles className="w-3 h-3 text-accent" />
            <span>WHAT TO PRESERVE (DO NOT LOSE IN REVISION):</span>
          </div>
          <p className="font-sans text-[11px] text-text leading-relaxed">
            {critique.whatToPreserve || critique.verdict.whatToPreserve}
          </p>
        </div>
      )}

      {/* 4 Category Tabs (Horizontal touch scroll on mobile) */}
      <div className="w-full max-w-xl flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 justify-start sm:justify-center px-1">
        <button
          onClick={() => { playClick(); setActiveTab('comp'); }}
          className={`font-mono text-[10px] font-bold px-3.5 py-1.5 rounded-lg border transition-all whitespace-nowrap shrink-0 min-h-[36px] flex items-center justify-center ${
            activeTab === 'comp'
              ? 'bg-text text-bg border-text shadow-sticker'
              : 'bg-panel text-muted border-border hover:text-text'
          }`}
        >
          COMPOSITION
        </button>
        <button
          onClick={() => { playClick(); setActiveTab('col'); }}
          className={`font-mono text-[10px] font-bold px-3.5 py-1.5 rounded-lg border transition-all whitespace-nowrap shrink-0 min-h-[36px] flex items-center justify-center ${
            activeTab === 'col'
              ? 'bg-text text-bg border-text shadow-sticker'
              : 'bg-panel text-muted border-border hover:text-text'
          }`}
        >
          COLOUR
        </button>
        {critique.typography && (
          <button
            onClick={() => { playClick(); setActiveTab('type'); }}
            className={`font-mono text-[10px] font-bold px-3.5 py-1.5 rounded-lg border transition-all whitespace-nowrap shrink-0 min-h-[36px] flex items-center justify-center ${
              activeTab === 'type'
                ? 'bg-text text-bg border-text shadow-sticker'
                : 'bg-panel text-muted border-border hover:text-text'
            }`}
          >
            TYPE
          </button>
        )}
        <button
          onClick={() => { playClick(); setActiveTab('conc'); }}
          className={`font-mono text-[10px] font-bold px-3.5 py-1.5 rounded-lg border transition-all whitespace-nowrap shrink-0 min-h-[36px] flex items-center justify-center ${
            activeTab === 'conc'
              ? 'bg-text text-bg border-text shadow-sticker'
              : 'bg-panel text-muted border-border hover:text-text'
          }`}
        >
          CONCEPT
        </button>
      </div>

      {/* Active Category Card: Observation → Evidence → Consequence → Fix */}
      <div
        className="w-full max-w-xl border-2 rounded-xl p-3 shadow-sticker space-y-1.5 text-left"
        style={{
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="flex items-center justify-between border-b pb-1 font-mono text-[10px]" style={{ borderColor: 'var(--border)' }}>
          <span className="font-bold text-text uppercase">{currentCategory.name}</span>
          <span className="font-bold text-accent">SCORE: {currentCategory.score} / 10</span>
        </div>

        {currentCategory.observation && currentCategory.evidence ? (
          <div className="space-y-1 text-xs font-sans">
            <p className="text-text font-medium leading-relaxed">
              <strong>Observation:</strong> {currentCategory.observation}
            </p>
            <p className="text-muted leading-relaxed">
              <strong>Evidence:</strong> {currentCategory.evidence}
            </p>
            {currentCategory.consequence && (
              <p className="text-muted leading-relaxed">
                <strong>Consequence:</strong> {currentCategory.consequence}
              </p>
            )}
          </div>
        ) : (
          <p className="font-sans text-xs text-text leading-relaxed">
            {currentCategory.professional}
          </p>
        )}

        <div className="pt-1.5 border-t text-xs text-muted font-sans" style={{ borderColor: 'var(--border)' }}>
          <strong className="text-text font-mono text-[9px] uppercase block mb-0.5">
            SPECIFIC FIX:
          </strong>
          {currentCategory.fix || critique.whatCouldImprove?.professional?.split('\n')[0] || critique.verdict.howToFixIt || "Refine the visual baseline alignment."}
        </div>
      </div>

      {/* Red Unreliable Opinion Card (Character's witty remark) */}
      <div
        className="w-full max-w-xl rounded-xl p-2.5 border-2 shadow-sticker text-left"
        style={{
          backgroundColor: theme === 'night' ? '#200A0A' : '#FFF5F5',
          borderColor: 'var(--accent)'
        }}
      >
        <div className="flex items-center gap-1 font-mono text-[8px] font-bold text-accent uppercase tracking-wider mb-0.5">
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>UNRELIABLE OPINION</span>
        </div>
        <p className="font-sans text-xs font-semibold text-accent leading-snug">
          “{currentCategory.unreliable || critique.verdict.unreliable}”
        </p>
      </div>

      {/* Repositioned Secondary Button: VIEW FULL CRITIQUE ↗ */}
      <div className="w-full max-w-xl flex justify-center py-1">
        <button
          onClick={() => { playClick(); onOpenDossier(); }}
          className="font-mono text-xs font-bold px-4 py-1.5 rounded-xl border-2 transition-all flex items-center gap-2 shadow-sticker hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent group"
          style={{
            backgroundColor: 'var(--panel)',
            borderColor: 'var(--border)',
            color: 'var(--text)'
          }}
          aria-label="View Full Critique Dossier"
        >
          <FileText className="w-3.5 h-3.5 text-accent transition-transform duration-200 group-hover:scale-110" />
          <span>[ VIEW FULL CRITIQUE ↗ ]</span>
        </button>
      </div>

      {/* Error banner for Brutal Truth if any */}
      {brutalTruthError && (
        <div
          className="w-full max-w-xl p-2 rounded-xl border flex items-center justify-between text-xs font-mono"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--accent)',
            color: 'var(--accent)'
          }}
        >
          <span>{brutalTruthError}</span>
          {onRetryBrutalTruth && (
            <button
              onClick={onRetryBrutalTruth}
              className="sticker-btn text-[10px] py-0.5 px-2 text-accent"
            >
              RETRY
            </button>
          )}
        </div>
      )}

      {/* Bottom Action Row: The 3 Primary Actions + Brutal Truth + New Artwork */}
      <div className="w-full max-w-xl pt-3 border-t border-border grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center gap-2">
        <button
          onClick={() => { playClick(); onSelectAction('DEFEND'); }}
          className="sticker-btn text-xs py-2 px-3 min-h-[44px] flex items-center justify-center gap-1.5 text-text hover:border-accent w-full sm:w-auto"
        >
          <Shield className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>[ DEFEND ]</span>
        </button>

        <button
          onClick={() => { playClick(); onSelectAction('CHALLENGE'); }}
          className="sticker-btn text-xs py-2 px-3 min-h-[44px] flex items-center justify-center gap-1.5 text-text hover:border-accent w-full sm:w-auto"
        >
          <Flame className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>[ CHALLENGE ]</span>
        </button>

        <button
          onClick={() => { playClick(); onSelectAction('REDESIGN'); }}
          className="sticker-btn text-xs py-2 px-3 min-h-[44px] flex items-center justify-center gap-1.5 text-text hover:border-accent w-full sm:w-auto"
        >
          <Layers className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>[ REDESIGN ]</span>
        </button>

        <button
          onClick={() => { playClick(); onSelectAction('BRUTAL_TRUTH'); }}
          disabled={isBrutalTruthLoading}
          className={`sticker-btn text-xs py-2 px-3 min-h-[44px] flex items-center justify-center gap-1.5 text-text hover:border-accent w-full sm:w-auto ${
            isBrutalTruthLoading ? 'opacity-70 cursor-wait' : ''
          }`}
          title="Direct, unvarnished art director critique"
        >
          {isBrutalTruthLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-accent animate-spin shrink-0" />
              <span>[ ANALYSING... ]</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-text shrink-0" />
              <span>[ BRUTAL TRUTH ]</span>
            </>
          )}
        </button>

        <button
          onClick={() => { playClick(); onNewArtwork(); }}
          className="col-span-2 sm:col-span-1 sticker-btn text-xs py-2 px-3 min-h-[44px] flex items-center justify-center gap-1.5 text-muted hover:text-text w-full sm:w-auto"
          title="Upload or select another piece"
        >
          <PlusCircle className="w-3.5 h-3.5 text-muted shrink-0" />
          <span>[ NEW ARTWORK ]</span>
        </button>
      </div>
    </div>
  );
};
