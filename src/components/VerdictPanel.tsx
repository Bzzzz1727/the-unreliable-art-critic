import React, { useState } from 'react';
import { CritiqueData, CritiqueCategoryItem } from '../types';
import { playClick } from '../utils/soundEffects';
import { Award, AlertTriangle, FileText, Loader2 } from 'lucide-react';

interface VerdictPanelProps {
  critique: CritiqueData | null;
  onOpenDossier: () => void;
  isLoading?: boolean;
  hasStagedArtwork?: boolean;
  theme?: 'day' | 'night';
}

export const VerdictPanel: React.FC<VerdictPanelProps> = ({
  critique,
  onOpenDossier,
  isLoading = false,
  hasStagedArtwork = false,
  theme = 'day'
}) => {
  const [activeTab, setActiveTab] = useState<'comp' | 'col' | 'type' | 'conc'>('comp');

  // State C: Analyzing loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4 sticker-card">
        <div
          className="w-10 h-10 rounded-full border flex items-center justify-center mb-2.5 shadow-xs"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border)'
          }}
        >
          <Loader2 className="w-5 h-5 text-accent animate-spin" />
        </div>
        <p className="font-mono text-xs font-bold text-text uppercase tracking-wider">
          Inspecting the evidence...
        </p>
        <p className="font-sans text-xs text-muted max-w-[220px] mt-1">
          Scrutinising typography, margins, balance, and metaphysical weight.
        </p>
      </div>
    );
  }

  // State A & B: Quiet minimal indicator when no critique is ready
  if (!critique) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4 sticker-card">
        <div
          className="w-10 h-10 rounded-full border flex items-center justify-center mb-2.5 shadow-xs"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border)'
          }}
        >
          <Award className="w-5 h-5 text-muted" />
        </div>
        <p className="font-sans text-xs font-medium text-muted">
          {hasStagedArtwork ? 'Artwork staged. Press ANALYSE to judge.' : 'Waiting for a masterpiece.'}
        </p>
      </div>
    );
  }

  // State D & E: Critique complete
  let currentCategory: CritiqueCategoryItem = critique.composition;
  if (activeTab === 'col') currentCategory = critique.colourAndTexture;
  else if (activeTab === 'type' && critique.typography) currentCategory = critique.typography;
  else if (activeTab === 'conc') currentCategory = critique.concept;

  return (
    <div className="h-full flex flex-col sticker-card p-3 overflow-hidden relative">
      {/* Top Header & Verdict Stamp */}
      <div className="flex items-center justify-between pb-1.5 border-b border-border shrink-0">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-text">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span>THE VERDICT</span>
        </div>

        {/* Score Stamp: Prominent 22-28px */}
        <div className="bg-accent text-white border-2 border-border px-2.5 py-0.5 rounded-lg shadow-sticker font-mono anim-stamp-slam flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-black leading-none">{critique.verdict.overallScore}</span>
          <span className="text-[10px] opacity-85 font-bold">/ 10</span>
        </div>
      </div>

      {/* First Impression: 13-15px, sentence case */}
      <div
        className="my-1.5 border rounded-lg p-2.5 shrink-0"
        style={{
          backgroundColor: 'var(--bg)',
          borderColor: 'var(--border)'
        }}
      >
        <span className="font-mono text-[9px] font-bold text-muted uppercase block mb-1">
          First Impression
        </span>
        <p className="font-sans text-[13px] font-medium text-text leading-snug line-clamp-2">
          “{critique.firstImpression.professional}”
        </p>
      </div>

      {/* Compact 4-Category Chips */}
      <div className="flex items-center gap-1 shrink-0 mb-1.5 overflow-x-auto pb-0.5 panel-scroll">
        <button
          onClick={() => { playClick(); setActiveTab('comp'); }}
          className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border transition-all ${
            activeTab === 'comp'
              ? 'bg-text text-bg border-text shadow-sticker'
              : 'bg-panel text-muted border-border hover:text-text'
          }`}
        >
          COMPOSITION
        </button>

        <button
          onClick={() => { playClick(); setActiveTab('col'); }}
          className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border transition-all ${
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
            className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border transition-all ${
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
          className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border transition-all ${
            activeTab === 'conc'
              ? 'bg-text text-bg border-text shadow-sticker'
              : 'bg-panel text-muted border-border hover:text-text'
          }`}
        >
          CONCEPT
        </button>
      </div>

      {/* Active Category Content Box (Shows ONLY selected category) */}
      <div
        className="flex-1 min-h-0 border rounded-lg p-2.5 overflow-y-auto panel-scroll space-y-2 mb-1.5"
        style={{
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="flex items-center justify-between border-b border-border pb-1">
          <span className="font-mono text-[10px] font-bold text-text uppercase">
            {currentCategory.name}
          </span>
          <span className="font-mono text-[10px] font-bold text-accent">
            SCORE: {currentCategory.score} / 10
          </span>
        </div>

        <p className="font-sans text-[12px] sm:text-[13px] text-text leading-relaxed">
          {currentCategory.professional}
        </p>

        {/* Practical Improvement Suggestion */}
        <div className="pt-1.5 border-t border-border font-sans text-[11px] text-muted">
          <strong className="text-text font-mono text-[9px] uppercase block mb-0.5">
            RECOMMENDED FIX:
          </strong>
          {critique.whatCouldImprove.professional.split('\n')[0]}
        </div>
      </div>

      {/* Unreliable Opinion Card (Distinctive Blood Red Border) */}
      <div
        className="shrink-0 rounded-lg p-2.5 shadow-sticker border-2"
        style={{
          backgroundColor: theme === 'night' ? '#200A0A' : '#FFF5F5',
          borderColor: 'var(--accent)'
        }}
      >
        <div className="flex items-center gap-1 font-mono text-[8px] font-bold text-accent uppercase tracking-wider mb-0.5">
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>UNRELIABLE OPINION</span>
        </div>
        <p className="font-sans text-xs font-semibold text-accent leading-snug line-clamp-3">
          “{currentCategory.unreliable || critique.verdict.unreliable}”
        </p>
      </div>

      {/* Bottom Action: Expand Dossier */}
      <div className="mt-1.5 pt-1 border-t border-border flex items-center justify-between shrink-0 font-mono text-[9px]">
        <button
          onClick={() => { playClick(); onOpenDossier(); }}
          className="text-muted hover:text-accent flex items-center gap-1 font-bold underline"
        >
          <FileText className="w-3 h-3 text-accent" />
          <span>[ EXPAND DOSSIER ]</span>
        </button>

        <span className="text-muted opacity-60">AUTONOMOUS RATIFIED</span>
      </div>
    </div>
  );
};
